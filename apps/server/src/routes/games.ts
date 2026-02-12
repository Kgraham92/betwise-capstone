import { Router, type Response } from "express";
import { OddsApiClient } from "../services/oddsApiClient.js";
import { OddsCacheService } from "../services/oddsCache.js";
import { normalizeOddsApiEvents } from "../services/oddsNormalize.js";
import { generateSentiment } from "../services/sentiment.js";
import { authMiddleware } from "../middleware/auth.js";
import { OddsSnapshot } from "../models/OddsSnapshot.js";
import type { LineMovementPoint, LineMovementResponse } from "@betwise/shared";
import { config } from "../config.js";
import { withinUnlockWindow } from "./routeUtils.js";

const router = Router();

function resolveSportKeyOrRespond(
  sportKeyRaw: unknown,
  res: Response,
): string | null {
  const sportKey = String(sportKeyRaw ?? "");
  if (!sportKey) {
    res.status(400).json({ error: "sportKey is required" });
    return null;
  }
  if (!config.enableSports[sportKey as keyof typeof config.enableSports]) {
    res.status(400).json({ error: "Sport is disabled" });
    return null;
  }
  return sportKey;
}

router.get("/", async (req, res, next) => {
  try {
    const sportKey = resolveSportKeyOrRespond(req.query.sportKey, res);
    if (!sportKey) return;

    const regions = config.oddsDefaults.regions;
    const markets = config.oddsDefaults.markets;
    const oddsFormat = config.oddsDefaults.oddsFormat;

    const cache = new OddsCacheService(new OddsApiClient());
    const payload = await cache.getLatestOrRefresh({
      sportKey,
      regions,
      markets,
      oddsFormat,
    });

    const games = normalizeOddsApiEvents(payload);
    return res.json({
      sportKey,
      regions,
      markets,
      oddsFormat,
      count: games.length,
      games,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:gameId", async (req, res, next) => {
  try {
    const sportKey = resolveSportKeyOrRespond(req.query.sportKey, res);
    if (!sportKey) return;

    const gameId = req.params.gameId;

    const cache = new OddsCacheService(new OddsApiClient());
    const payload = await cache.getLatestOrRefresh({
      sportKey,
      regions: config.oddsDefaults.regions,
      markets: config.oddsDefaults.markets,
      oddsFormat: config.oddsDefaults.oddsFormat,
    });

    const games = normalizeOddsApiEvents(payload);
    const game = games.find((g) => g.providerGameId === gameId);

    if (!game)
      return res
        .status(404)
        .json({ error: "Game not found in latest snapshot" });
    return res.json({ game });
  } catch (err) {
    next(err);
  }
});

router.get("/:gameId/trends", authMiddleware, async (req, res, next) => {
  try {
    const sportKey = resolveSportKeyOrRespond(req.query.sportKey, res);
    if (!sportKey) return;

    const gameId = req.params.gameId;

    const cache = new OddsCacheService(new OddsApiClient());
    const payload = await cache.getLatestOrRefresh({
      sportKey,
      regions: config.oddsDefaults.regions,
      markets: config.oddsDefaults.markets,
      oddsFormat: config.oddsDefaults.oddsFormat,
    });

    const games = normalizeOddsApiEvents(payload);
    const game = games.find((g) => g.providerGameId === gameId);

    if (!game)
      return res
        .status(404)
        .json({ error: "Game not found in latest snapshot" });

    const splitsAvailable = withinUnlockWindow(game.commenceTime, 48);

    if (!splitsAvailable) {
      return res.json({
        game,
        splitsAvailable: false,
        message:
          "Betting splits/sentiment become available within 48 hours of game start.",
      });
    }

    // Use your sentiment engine with ML devig only if both sides exist
    const sentiment = generateSentiment({
      gameId: game.providerGameId,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      spread: game.spreadHome, // note: home point (e.g., -3.5)
      total: game.total,
      moneylineHome: game.moneylineHome,
      moneylineAway: game.moneylineAway,
    });

    return res.json({
      game,
      splitsAvailable: true,
      sentiment,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:gameId/line-movement", authMiddleware, async (req, res, next) => {
  try {
    const sportKey = resolveSportKeyOrRespond(req.query.sportKey, res);
    if (!sportKey) return;

    const gameId = req.params.gameId;

    const snapshots = await OddsSnapshot.find({
      sportKey,
      regions: config.oddsDefaults.regions,
      markets: config.oddsDefaults.markets,
      oddsFormat: config.oddsDefaults.oddsFormat,
    })
      .sort({ fetchedAt: 1 })
      .lean();

    if (snapshots.length === 0) {
      return res.status(404).json({ error: "No odds history available" });
    }

    const points: LineMovementPoint[] = [];
    let gameMeta: ReturnType<typeof normalizeOddsApiEvents>[number] | null =
      null;

    for (const snap of snapshots) {
      const games = normalizeOddsApiEvents(snap.payload);
      const game = games.find((g) => g.providerGameId === gameId);
      if (!game) continue;

      if (!gameMeta) gameMeta = game;

      const sentiment = generateSentiment({
        gameId: game.providerGameId,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        spread: game.spreadHome,
        total: game.total,
        moneylineHome: game.moneylineHome,
        moneylineAway: game.moneylineAway,
      });

      const sentimentIndex = Math.round(
        (sentiment.spread.homePct +
          sentiment.moneyline.homePct +
          sentiment.total.overPct) /
          3,
      );

      points.push({
        timestamp: new Date(snap.fetchedAt).toISOString(),
        spreadHome: game.spreadHome,
        spreadAway: game.spreadAway,
        moneylineHome: game.moneylineHome,
        moneylineAway: game.moneylineAway,
        total: game.total,
        sentimentIndex,
        sentimentSpreadHome: sentiment.spread.homePct,
        sentimentMoneylineHome: sentiment.moneyline.homePct,
        sentimentOver: sentiment.total.overPct,
      });
    }

    if (!gameMeta) {
      return res.status(404).json({ error: "Game not found in history" });
    }

    const response: LineMovementResponse = {
      game: gameMeta,
      points,
    };

    return res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
