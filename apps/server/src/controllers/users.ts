import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import type { FavoriteDoc } from "../models/User.js";
import type { AuthRequest } from "../middleware/auth.js";
import { auditSecurityEvent } from "../services/securityAudit.js";

type FavoritePayload = {
  id: string;
  sportKey: string;
  teamKey: string;
  teamName: string;
  label: string;
};

const SALT_ROUNDS = 10;

function toFavoritePayload(favorite: {
  _id: unknown;
  sportKey: string;
  teamKey: string;
  teamName: string;
  label?: string;
}): FavoritePayload {
  return {
    id: String(favorite._id),
    sportKey: favorite.sportKey,
    teamKey: favorite.teamKey,
    teamName: favorite.teamName,
    label: favorite.label ?? "",
  };
}

function getUserId(req: Request): string | null {
  const authReq = req as AuthRequest;
  return authReq.user?.userId ?? null;
}

export async function getFavorites(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  const favorites = (user.favorites ?? []).map((favorite) =>
    toFavoritePayload(favorite),
  );
  return res.json({ count: favorites.length, favorites });
}

export async function createFavorite(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { sportKey, teamKey, teamName, label } = req.body as {
    sportKey: string;
    teamKey: string;
    teamName: string;
    label?: string;
  };

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const exists = user.favorites.some(
    (favorite) =>
      favorite.sportKey === sportKey && favorite.teamKey === teamKey,
  );
  if (exists) {
    return res.status(409).json({ error: "Favorite already exists" });
  }

  user.favorites.push({
    sportKey,
    teamKey,
    teamName,
    label: label ?? "",
  } as FavoriteDoc);

  await user.save();

  const added = user.favorites[user.favorites.length - 1];
  if (!added) {
    return res.status(500).json({ error: "Failed to create favorite" });
  }

  return res.status(201).json({ favorite: toFavoritePayload(added) });
}

export async function updateFavorite(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const favoriteId = req.params.favoriteId;
  const { teamName, label } = req.body as {
    teamName?: string;
    label?: string;
  };

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const favorite = user.favorites.find(
    (item) => String(item._id) === favoriteId,
  );
  if (!favorite) return res.status(404).json({ error: "Favorite not found" });

  if (teamName !== undefined) favorite.teamName = teamName;
  if (label !== undefined) favorite.label = label;

  await user.save();

  return res.json({ favorite: toFavoritePayload(favorite) });
}

export async function deleteFavorite(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const favoriteId = req.params.favoriteId;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const nextFavorites = user.favorites.filter(
    (item) => String(item._id) !== favoriteId,
  );

  if (nextFavorites.length === user.favorites.length) {
    return res.status(404).json({ error: "Favorite not found" });
  }

  user.favorites = nextFavorites;
  await user.save();

  return res.status(204).send();
}

export async function changePassword(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    auditSecurityEvent("warn", "account.change_password.invalid_current", req, {
      userId,
    });
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
  auditSecurityEvent("info", "account.change_password.success", req, { userId });

  return res.json({ message: "Password updated" });
}

export async function deleteOwnAccount(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const deleted = await User.findByIdAndDelete(userId);
  if (!deleted) return res.status(404).json({ error: "User not found" });
  auditSecurityEvent("warn", "account.delete", req, { userId });

  return res.status(204).send();
}
