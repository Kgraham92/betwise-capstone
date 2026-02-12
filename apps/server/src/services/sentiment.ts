// apps/server/src/services/sentiment.ts
// BetWise Sentiment Engine (MVP)
//
// Notes / MVP constraints:
// - We DO NOT devig spread/total yet (requires consistent same-market pricing).
// - We DO devig moneyline *when both home + away ML are provided*, because it's clean/safe.
// - Sentiment outputs are simulated (deterministic/seeded) and designed to look realistic.

import { SentimentData } from "@betwise/shared";

export type SentimentInputs = {
  gameId: string;
  homeTeam: string;
  awayTeam: string;

  // Odds/lines (optional depending on provider)
  spread?: number; // Convention: negative => home favored (e.g., -3.5)
  total?: number; // e.g., 47.5
  moneylineHome?: number; // e.g., -150
  moneylineAway?: number; // e.g., +130

  // Optional enrichment from prediction markets (0..1)
  impliedProbHome?: number; // e.g., 0.62 => 62% home win prob
};

/** ---------- Deterministic PRNG utilities ---------- **/

function fnv1aHashToUint32(str: string): number {
  // FNV-1a 32-bit hash
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return function rand(): number {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// Box–Muller transform for a normal-ish distribution
function randNormal(rand: () => number, mean = 0, stdDev = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

/** ---------- Odds math helpers ---------- **/

function americanToImpliedProb(ml: number): number | null {
  // Returns implied probability from American odds (includes vig; devig happens separately).
  if (!Number.isFinite(ml) || ml === 0) return null;
  if (ml < 0) return -ml / (-ml + 100);
  return 100 / (ml + 100);
}

/**
 * Devigs a moneyline pair via simple normalization.
 * Requires BOTH home and away ML from the same market snapshot.
 *
 * Returns fair home win probability (0..1) or null if inputs not available.
 */
function devigMoneylinePair(mlHome?: number, mlAway?: number): number | null {
  const pH = mlHome != null ? americanToImpliedProb(mlHome) : null;
  const pA = mlAway != null ? americanToImpliedProb(mlAway) : null;
  if (pH == null || pA == null) return null;

  const sum = pH + pA; // > 1.0 when vig present
  if (!Number.isFinite(sum) || sum <= 0) return null;

  return pH / sum;
}

function pickConfidence(inputs: SentimentInputs): "low" | "med" | "high" {
  const hasML =
    Number.isFinite(inputs.moneylineHome) &&
    Number.isFinite(inputs.moneylineAway);
  const hasSpread = Number.isFinite(inputs.spread);
  const hasTotal = Number.isFinite(inputs.total);
  const hasMarketProb = Number.isFinite(inputs.impliedProbHome);

  const score = [hasML, hasSpread, hasTotal, hasMarketProb].filter(
    Boolean,
  ).length;
  if (score >= 3) return "high";
  if (score === 2) return "med";
  return "low";
}

/**
 * Generates a believable ticket % centered around base,
 * with realistic variance & rare extremes.
 */
function generateTicketPct(
  rand: () => number,
  base: number,
  min = 20,
  max = 80,
): number {
  // Most results in 40–60:
  // Normal noise with std dev ~6.5 points, then clamp.
  let pct = base + randNormal(rand, 0, 6.5);

  // Occasionally create stronger public lean (rare “steam” vibe)
  const r = rand();
  if (r < 0.06) pct += randNormal(rand, 0, 9); // 6% moderately stronger
  if (r < 0.015) pct += randNormal(rand, 0, 12); // 1.5% rare very strong

  pct = clamp(pct, min, max);
  return round1(pct);
}

/**
 * Softly nudges a value toward a target without snapping to it.
 */
function nudgeToward(
  current: number,
  target: number,
  strength: number,
): number {
  const next = current + (target - current) * clamp(strength, 0, 1);
  return next;
}

/** ---------- Main Engine ---------- **/

export function generateSentiment(inputs: SentimentInputs): SentimentData {
  const notes: string[] = [];

  // Deterministic seed from game identity (stable across refreshes)
  const seedStr = `${inputs.gameId}|${inputs.homeTeam}|${inputs.awayTeam}`;
  const seed = fnv1aHashToUint32(seedStr);
  const rand = mulberry32(seed);

  // Priority order for implied probability anchor:
  // 1) prediction-market implied probability (if provided)
  // 2) devigged moneyline implied probability (if BOTH MLs provided)
  const deviggedHomeFromML = devigMoneylinePair(
    inputs.moneylineHome,
    inputs.moneylineAway,
  );

  const impliedHome: number | null =
    inputs.impliedProbHome ?? deviggedHomeFromML ?? null;

  if (inputs.impliedProbHome != null) {
    notes.push("Used prediction-market implied probability.");
  } else if (deviggedHomeFromML != null) {
    notes.push("Used devigged moneyline implied probability (normalized).");
  } else if (
    inputs.moneylineHome != null &&
    americanToImpliedProb(inputs.moneylineHome) != null
  ) {
    notes.push(
      "Moneyline provided but devig unavailable (missing opposite side).",
    );
  } else {
    notes.push("No implied probability available; using neutral baseline.");
  }

  // Establish baselines near 50
  let baseMLHome = 50;
  let baseSpreadHome = 50;
  let baseOver = 51; // public over bias

  // If we have implied probability, anchor ML tickets gently toward it
  if (impliedHome != null) {
    const target = impliedHome * 100;

    // Public ticket % should be less extreme than true probability.
    // Example: 0.62 implied → tickets maybe ~56–64, not 62 locked.
    const shrink = 0.65; // shrink toward 50
    const ticketTarget = 50 + (target - 50) * shrink;

    baseMLHome = nudgeToward(baseMLHome, ticketTarget, 0.75);
    baseSpreadHome = nudgeToward(baseSpreadHome, ticketTarget, 0.55);

    notes.push("Anchored tickets softly toward implied probability (shrunk).");
  }

  // If spread exists, public likes the favorite more (modest)
  if (Number.isFinite(inputs.spread)) {
    // Convention: negative spread => home favored
    const s = inputs.spread as number;

    if (s < 0) {
      baseSpreadHome += 3.5;
      baseMLHome += 2.0;
      notes.push("Applied favorite bias toward home (spread < 0).");
    } else if (s > 0) {
      baseSpreadHome -= 3.5;
      baseMLHome -= 2.0;
      notes.push("Applied favorite bias toward away (spread > 0).");
    } else {
      notes.push("Spread is pick'em (0); no favorite bias applied.");
    }
  }

  // Keep baselines sane
  baseMLHome = clamp(baseMLHome, 35, 65);
  baseSpreadHome = clamp(baseSpreadHome, 35, 65);
  baseOver = clamp(baseOver, 45, 58);

  // Generate tickets with realistic randomness
  const mlHomePct = generateTicketPct(rand, baseMLHome);
  const spreadHomePct = generateTicketPct(rand, baseSpreadHome);

  // Total: Over slightly favored by public, but not always
  // Use implied probability a tiny bit: big favorites sometimes correlate with "over" hype (narrative-driven)
  let baseOverAdjusted = baseOver;
  if (impliedHome != null) {
    const hype = clamp((impliedHome - 0.5) * 10, -2, 2); // -2..+2
    baseOverAdjusted = clamp(baseOverAdjusted + hype, 45, 60);
  }

  const overPct = generateTicketPct(rand, baseOverAdjusted);

  // Ensure coherence: ML and spread shouldn’t disagree wildly.
  // If they do, pull spread a bit toward ML.
  const diff = spreadHomePct - mlHomePct;
  if (Math.abs(diff) > 10) {
    const corrected = nudgeToward(spreadHomePct, mlHomePct, 0.35);
    notes.push("Coherence correction applied between spread and moneyline.");
    const finalSpreadHome = round1(clamp(corrected, 20, 80));
    return finalize(seed, notes, finalSpreadHome, overPct, mlHomePct, inputs);
  }

  return finalize(seed, notes, spreadHomePct, overPct, mlHomePct, inputs);
}

function finalize(
  seed: number,
  notes: string[],
  spreadHomePct: number,
  overPct: number,
  mlHomePct: number,
  inputs: SentimentInputs,
): SentimentData {
  const spreadAwayPct = round1(100 - spreadHomePct);
  const underPct = round1(100 - overPct);
  const mlAwayPct = round1(100 - mlHomePct);

  const confidence = pickConfidence(inputs);

  return {
    spread: { homePct: spreadHomePct, awayPct: spreadAwayPct },
    total: { overPct, underPct },
    moneyline: { homePct: mlHomePct, awayPct: mlAwayPct },
    confidence,
    meta: { seed, notes },
  };
}
