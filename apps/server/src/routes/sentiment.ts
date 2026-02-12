// apps/server/src/routes/sentiment.ts
import { Router } from "express";
import { generateSentiment } from "../services/sentiment.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/sentiment?gameId=...&homeTeam=...&awayTeam=...
 * Optional: spread, total, mlHome, mlAway, impliedProbHome
 */
router.get("/", authMiddleware, (req, res) => {
  const {
    gameId,
    homeTeam,
    awayTeam,
    spread,
    total,
    mlHome,
    mlAway,
    impliedProbHome,
  } = req.query;

  if (!gameId || !homeTeam || !awayTeam) {
    return res.status(400).json({
      error: "gameId, homeTeam, awayTeam are required",
    });
  }

  const toNum = (v: unknown): number | undefined => {
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const sentiment = generateSentiment({
    gameId: String(gameId),
    homeTeam: String(homeTeam),
    awayTeam: String(awayTeam),
    spread: toNum(spread),
    total: toNum(total),
    moneylineHome: toNum(mlHome),
    moneylineAway: toNum(mlAway),
    impliedProbHome: toNum(impliedProbHome),
  });

  return res.json(sentiment);
});

export default router;
