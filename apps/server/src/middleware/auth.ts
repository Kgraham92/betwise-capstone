import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { required } from "../config.js";

const JWT_SECRET = required.jwtSecret();

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
