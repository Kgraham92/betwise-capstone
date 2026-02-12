import { OddsSnapshot } from "../models/OddsSnapshot.js";
import { OddsApiClient } from "./oddsApiClient.js";
import { config } from "../config.js";

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const inFlightRefreshes = new Map<string, Promise<unknown>>();

type CacheKey = {
  sportKey: string;
  regions: string;
  markets: string;
  oddsFormat: "american" | "decimal";
};

export class OddsCacheService {
  constructor(
    private client: OddsApiClient,
    private ttlMs: number = EIGHT_HOURS_MS,
    private maxRefreshesPer24h: number = config.oddsMaxRequestsPerSportPer24h,
  ) {}

  async getLatestOrRefresh(key: CacheKey): Promise<unknown> {
    const refreshKey = `${key.sportKey}|${key.regions}|${key.markets}|${key.oddsFormat}`;
    const existing = inFlightRefreshes.get(refreshKey);
    if (existing) {
      return existing;
    }

    const refreshPromise = this.getLatestOrRefreshInternal(key);
    inFlightRefreshes.set(refreshKey, refreshPromise);

    try {
      return await refreshPromise;
    } finally {
      if (inFlightRefreshes.get(refreshKey) === refreshPromise) {
        inFlightRefreshes.delete(refreshKey);
      }
    }
  }

  private async getLatestOrRefreshInternal(key: CacheKey): Promise<unknown> {
    const now = new Date();

    const latest = await OddsSnapshot.findOne({
      sportKey: key.sportKey,
      regions: key.regions,
      markets: key.markets,
      oddsFormat: key.oddsFormat,
    })
      .sort({ fetchedAt: -1 })
      .lean();

    if (latest && latest.expiresAt && new Date(latest.expiresAt) > now) {
      return latest.payload;
    }

    const windowStart = new Date(now.getTime() - TWENTY_FOUR_HOURS_MS);
    const refreshCount = await OddsSnapshot.countDocuments({
      sportKey: key.sportKey,
      regions: key.regions,
      markets: key.markets,
      oddsFormat: key.oddsFormat,
      fetchedAt: { $gte: windowStart },
    });

    if (refreshCount >= this.maxRefreshesPer24h) {
      if (latest?.payload != null) {
        return latest.payload;
      }
      throw new Error(
        `Odds refresh cap reached for ${key.sportKey}; no cached snapshot available`,
      );
    }

    const payload = await this.client.fetchOdds({
      sportKey: key.sportKey,
      regions: key.regions,
      markets: key.markets,
      oddsFormat: key.oddsFormat,
    });

    const fetchedAt = now;
    const expiresAt = new Date(now.getTime() + this.ttlMs);

    await OddsSnapshot.create({
      ...key,
      fetchedAt,
      expiresAt,
      payload,
    });

    return payload;
  }
}
