import { Router } from "express";
import {
  register,
  login,
  me,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  validateBody,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.js";

const router = Router();

router.post("/register", authLimiter, validateBody(registerSchema), register);
router.post("/login", authLimiter, validateBody(loginSchema), login);
router.post(
  "/forgot-password",
  authLimiter,
  validateBody(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  validateBody(resetPasswordSchema),
  resetPassword,
);
router.post("/logout", authLimiter, authMiddleware, logout);
router.get("/me", authLimiter, authMiddleware, me);

export default router;
