import mongoose from "mongoose";

export type OddsSnapshotDoc = {
  sportKey: string;
  regions: string; // "us"
  markets: string; // "h2h,spreads,totals"
  oddsFormat: "american" | "decimal";
  fetchedAt: Date;
  expiresAt: Date; // fetchedAt + ttl
  // Store raw provider payload so you can re-normalize later without re-fetching
  payload: unknown;
};

const OddsSnapshotSchema = new mongoose.Schema<OddsSnapshotDoc>(
  {
    sportKey: { type: String, required: true, index: true },
    regions: { type: String, required: true },
    markets: { type: String, required: true },
    oddsFormat: { type: String, required: true, enum: ["american", "decimal"] },
    fetchedAt: { type: Date, required: true, index: true },
    expiresAt: { type: Date, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

// Common query: latest snapshot for sportKey/regions/markets
OddsSnapshotSchema.index({
  sportKey: 1,
  regions: 1,
  markets: 1,
  fetchedAt: -1,
});

OddsSnapshotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OddsSnapshot =
  (mongoose.models.OddsSnapshot as mongoose.Model<OddsSnapshotDoc>) ??
  mongoose.model<OddsSnapshotDoc>("OddsSnapshot", OddsSnapshotSchema);
