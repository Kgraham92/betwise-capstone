import mongoose from "mongoose";

export type FavoriteDoc = {
  _id: mongoose.Types.ObjectId;
  sportKey: string;
  teamKey: string;
  teamName: string;
  label?: string;
};

export interface UserDoc extends mongoose.Document {
  email: string;
  passwordHash: string;
  favorites: FavoriteDoc[];
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema = new mongoose.Schema<FavoriteDoc>(
  {
    sportKey: { type: String, required: true, trim: true },
    teamKey: { type: String, required: true, trim: true, lowercase: true },
    teamName: { type: String, required: true, trim: true },
    label: { type: String, trim: true, default: "" },
  },
  { _id: true, timestamps: true },
);

const UserSchema = new mongoose.Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    favorites: { type: [FavoriteSchema], default: [] },
    resetPasswordTokenHash: { type: String, required: false },
    resetPasswordExpiresAt: { type: Date, required: false },
  },
  { timestamps: true },
);

export const User =
  (mongoose.models.User as mongoose.Model<UserDoc>) ??
  mongoose.model<UserDoc>("User", UserSchema);
