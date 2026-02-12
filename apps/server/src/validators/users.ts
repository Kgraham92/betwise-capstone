import { z } from "zod";

const safeDisplayText = z
  .string()
  .trim()
  .max(80, "Must be at most 80 characters")
  .regex(/^[^<>]*$/, "HTML-like characters are not allowed");

export const createFavoriteSchema = z.object({
  sportKey: z.string().trim().min(1, "sportKey is required"),
  teamKey: z
    .string()
    .trim()
    .min(1, "teamKey is required")
    .transform((value) => value.toLowerCase()),
  teamName: safeDisplayText.min(1, "teamName is required"),
  label: safeDisplayText.max(60, "label must be at most 60 characters").optional(),
});

export const updateFavoriteSchema = z
  .object({
    teamName: safeDisplayText.min(1, "teamName is required").optional(),
    label: safeDisplayText.max(60, "label must be at most 60 characters").optional(),
  })
  .refine((value) => value.teamName !== undefined || value.label !== undefined, {
    message: "At least one field is required",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password must be at least 8 characters"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });
