import rateLimit from "express-rate-limit";

/**
 * Rate limiter for authentication endpoints (login/register).
 * Prevents brute force and credential stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter for all other endpoints.
 * Prevents abuse while allowing normal usage.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Sensitive account actions limiter (favorites mutations, password/account changes).
 * Helps detect and mitigate unusual account activity spikes.
 */
export const accountActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: "Too many account actions, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
