import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { accountActionLimiter } from "../middleware/rateLimit.js";
import {
  changePassword,
  createFavorite,
  deleteFavorite,
  deleteOwnAccount,
  getFavorites,
  updateFavorite,
} from "../controllers/users.js";
import { validateBody } from "../validators/auth.js";
import {
  changePasswordSchema,
  createFavoriteSchema,
  updateFavoriteSchema,
} from "../validators/users.js";

const router = Router();

router.use(authMiddleware);

router.get("/me/favorites", getFavorites);
router.post(
  "/me/favorites",
  accountActionLimiter,
  validateBody(createFavoriteSchema),
  createFavorite,
);
router.patch(
  "/me/favorites/:favoriteId",
  accountActionLimiter,
  validateBody(updateFavoriteSchema),
  updateFavorite,
);
router.delete("/me/favorites/:favoriteId", accountActionLimiter, deleteFavorite);

router.patch(
  "/me/password",
  accountActionLimiter,
  validateBody(changePasswordSchema),
  changePassword,
);
router.delete("/me", accountActionLimiter, deleteOwnAccount);

export default router;
