import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { User } from "../models/User.js";
import { config, required } from "../config.js";
import type { AuthRequest } from "../middleware/auth.js";
import { auditSecurityEvent } from "../services/securityAudit.js";

const JWT_SECRET = required.jwtSecret();
const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30;
const AUTH_TOKEN_TTL = "24h";

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signAuthToken(user: {
  _id: { toString(): string };
  email: string;
}) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: AUTH_TOKEN_TTL },
  );
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      passwordHash,
    });

    const token = signAuthToken(user);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      auditSecurityEvent("warn", "auth.login.invalid_user", req, { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      auditSecurityEvent("warn", "auth.login.invalid_password", req, { email });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signAuthToken(user);

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function me(req: Request, res: Response) {
  const authUser = (req as AuthRequest).user;
  if (!authUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({
    user: {
      id: authUser.userId,
      email: authUser.email,
    },
  });
}

export async function logout(req: Request, res: Response) {
  const authUser = (req as AuthRequest).user;
  if (authUser?.userId) {
    auditSecurityEvent("info", "auth.logout", req, { userId: authUser.userId });
  }
  return res.json({ message: "Logout successful" });
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body as { email: string };

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        message:
          "If an account exists for this email, reset instructions have been generated.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordTokenHash = hashResetToken(resetToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    return res.json({
      message:
        "If an account exists for this email, reset instructions have been generated.",
      ...(config.nodeEnv !== "production" ? { resetToken } : {}),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body as {
      token: string;
      newPassword: string;
    };

    const tokenHash = hashResetToken(token);
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      auditSecurityEvent("warn", "auth.reset.invalid_token", req);
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
    auditSecurityEvent("info", "auth.reset.success", req, {
      userId: String(user._id),
    });

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
