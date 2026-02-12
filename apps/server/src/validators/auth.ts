import { z, ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Schema for user registration.
 * Requires valid email and password with minimum length.
 */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Schema for user login.
 * Requires email and non-empty password.
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Middleware factory for Zod validation.
 * Validates request body against the provided schema.
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({ error: "Validation failed", details: errors });
    }

    // Replace body with parsed data (includes type coercion if any)
    req.body = result.data;
    next();
  };
}
