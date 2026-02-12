import { Router } from "express";
import { OddsApiClient } from "../services/oddsApiClient.js";
import { OddsCacheService } from "../services/oddsCache.js";
import { normalizeOddsApiEvents } from "../services/oddsNormalize.js";
import { generateSentiment } from "../services/sentiment.js";
import { authMiddleware } from "../middleware/auth.js";
import { config } from "../config.js";
import type { TrendHighlight, TrendItem, TrendsResponse } from "@betwise/shared";
import { SPORTS } from "@betwise/shared";
import { withinUnlockWindow } from "./routeUtils.js";

const router = Router();

function getHighlights(
  item: TrendItem,
  minPct: number,
): TrendHighlight[] {
  const { sentiment, game } = item;
  const highlights: TrendHighlight[] = [];

  if (sentiment.spread.homePct >= minPct) {
    highlights.push({
      market: "spread",
      side: game.homeTeam,
      pct: sentiment.spread.homePct,
    });
  }
  if (sentiment.spread.awayPct >= minPct) {
    highlights.push({
      market: "spread",
      side: game.awayTeam,
      pct: sentiment.spread.awayPct,
    });
  }

  if (sentiment.moneyline.homePct >= minPct) {
    highlights.push({
      market: "moneyline",
      side: game.homeTeam,
      pct: sentiment.moneyline.homePct,
    });
  }
  if (sentiment.moneyline.awayPct >= minPct) {
    highlights.push({
      market: "moneyline",
      side: game.awayTeam,
      pct: sentiment.moneyline.awayPct,
    });
  }

  if (sentiment.total.overPct >= minPct) {
    highlights.push({
      market: "total",
      side: "Over",
      pct: sentiment.total.overPct,
    });
  }
  if (sentiment.total.underPct >= minPct) {
    highlights.push({
      market: "total",
      side: "Under",
      pct: sentiment.total.underPct,
    });
  }

  return highlights;
}

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const minPct = Math.max(50, Number(req.query.minPct ?? 60));

    const cache = new OddsCacheService(new OddsApiClient());
    const items: TrendItem[] = [];
    const enabledSports = SPORTS.filter(
      (sport) => config.enableSports[sport.key as keyof typeof config.enableSports],
    );

    const sportPayloads = await Promise.all(
      enabledSports.map(async (sport) => {
        try {
          const payload = await cache.getLatestOrRefresh({
            sportKey: sport.key,
            regions: config.oddsDefaults.regions,
            markets: config.oddsDefaults.markets,
            oddsFormat: config.oddsDefaults.oddsFormat,
          });
          return { sport, payload, error: null as null | Error };
        } catch (error) {
          return {
            sport,
            payload: null,
            error: error instanceof Error ? error : new Error("Unknown error"),
          };
        }
      }),
    );

    for (const { sport, payload, error } of sportPayloads) {
      if (error || !payload) {
        console.warn(`Skipping trends for sport ${sport.key}: ${error?.message ?? "Unknown error"}`);
        continue;
      }
      const games = normalizeOddsApiEvents(payload);

      for (const game of games) {
        if (!withinUnlockWindow(game.commenceTime, 48)) continue;

        const sentiment = generateSentiment({
          gameId: game.providerGameId,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          spread: game.spreadHome,
          total: game.total,
          moneylineHome: game.moneylineHome,
          moneylineAway: game.moneylineAway,
        });

        const item: TrendItem = { game, sentiment, highlights: [] };
        item.highlights = getHighlights(item, minPct);

        if (item.highlights.length > 0) {
          items.push(item);
        }
      }
    }

    items.sort((a, b) => {
      const maxA = Math.max(...a.highlights.map((h) => h.pct));
      const maxB = Math.max(...b.highlights.map((h) => h.pct));
      return maxB - maxA;
    });

    const response: TrendsResponse = {
      minPct,
      count: items.length,
      generatedAt: new Date().toISOString(),
      items,
    };

    return res.json(response);
  } catch (err) {
    next(err);
  }
});

export default router;
