import "./env.js";

type NodeEnv = "development" | "test" | "production";

/**
 * Throws early if a required env var is missing.
 * This prevents silent misconfiguration in prod.
 */
function mustGet(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}

function resolveNodeEnv(rawNodeEnv: string | undefined): NodeEnv {
  if (rawNodeEnv === "development") return "development";
  if (rawNodeEnv === "test") return "test";
  if (rawNodeEnv === "production") return "production";
  return "development";
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function extractMongoDbName(mongoUri: string): string {
  if (!mongoUri) return "";

  try {
    const parsed = new URL(mongoUri);
    const pathname = parsed.pathname.replace(/^\/+/, "");
    if (!pathname) return "";
    return pathname.split("/")[0] ?? "";
  } catch {
    return "";
  }
}

function ensureSafeMongoTarget(nodeEnv: NodeEnv, mongoDbName: string) {
  const normalized = mongoDbName.toLowerCase();
  const hasProdMarker = normalized.includes("prod");
  const hasNonProdMarker =
    normalized.includes("dev") ||
    normalized.includes("development") ||
    normalized.includes("test");

  if (nodeEnv !== "production" && hasProdMarker) {
    throw new Error(
      `Unsafe MongoDB database name "${mongoDbName}" for NODE_ENV=${nodeEnv}`,
    );
  }

  if (nodeEnv === "production" && hasNonProdMarker) {
    throw new Error(
      `Unsafe MongoDB database name "${mongoDbName}" for NODE_ENV=production`,
    );
  }
}

const nodeEnv = resolveNodeEnv(process.env.NODE_ENV);
const mongoUri = process.env.MONGODB_URI ?? "";
const mongoDbNameFromUri = extractMongoDbName(mongoUri);
const mongoDbName =
  process.env.MONGODB_DB_NAME ??
  (nodeEnv === "development"
    ? "betwise_dev"
    : nodeEnv === "test"
      ? "betwise_test"
      : mongoDbNameFromUri);

if (mongoDbName) {
  ensureSafeMongoTarget(nodeEnv, mongoDbName);
}

export const config = {
  // Runtime
  nodeEnv,
  port: Number(process.env.PORT ?? 3001),

  // App
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000", // Next dev default

  // Database
  mongoUri,
  mongoDbName,

  // Odds API (The Odds API)
  oddsApiKey: process.env.ODDS_API_KEY ?? "",
  oddsApiBaseUrl:
    process.env.ODDS_API_BASE_URL ?? "https://api.the-odds-api.com",
  oddsMaxRequestsPerSportPer24h: parsePositiveInt(
    process.env.ODDS_MAX_REQUESTS_PER_SPORT_PER_24H,
    3,
  ),

  // Odds API defaults (MVP-locked)
  oddsDefaults: {
    regions: "us",
    markets: "h2h,spreads,totals",
    oddsFormat: "american" as const,
  },

  // Feature flags
  enableSports: {
    basketball_nba: process.env.ENABLE_NBA !== "false",
    americanfootball_nfl: process.env.ENABLE_NFL === "true",
    icehockey_nhl: process.env.ENABLE_NHL !== "false",
    baseball_mlb: process.env.ENABLE_MLB === "true",
  },
};

export const required = {
  mongoUri: () => mustGet("MONGODB_URI"),
  oddsApiKey: () => mustGet("ODDS_API_KEY"),
  jwtSecret: () => mustGet("JWT_SECRET"),
};
