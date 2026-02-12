import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/models/OddsSnapshot.js", () => ({
  OddsSnapshot: {
    findOne: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
  },
}));

import { OddsSnapshot } from "../src/models/OddsSnapshot.js";
import { OddsCacheService } from "../src/services/oddsCache.js";

describe("OddsCacheService", () => {
  const key = {
    sportKey: "americanfootball_nfl",
    regions: "us",
    markets: "h2h,spreads,totals",
    oddsFormat: "american" as const,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    OddsSnapshot.countDocuments.mockResolvedValue(0);
  });

  it("returns cached payload when snapshot is fresh", async () => {
    const cachedPayload = [{ id: "cached_game" }];
    OddsSnapshot.findOne.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        ...key,
        fetchedAt: new Date("2026-01-27T10:00:00.000Z"),
        expiresAt: new Date("2099-01-01T00:00:00.000Z"),
        payload: cachedPayload,
      }),
    });

    const client = { fetchOdds: vi.fn() } as any;
    const cache = new OddsCacheService(client);

    const result = await cache.getLatestOrRefresh(key);

    expect(result).toEqual(cachedPayload);
    expect(client.fetchOdds).not.toHaveBeenCalled();
    expect(OddsSnapshot.create).not.toHaveBeenCalled();
  });

  it("fetches and persists when cache is missing or stale", async () => {
    OddsSnapshot.findOne.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });

    const freshPayload = [{ id: "fresh_game" }];
    const client = { fetchOdds: vi.fn().mockResolvedValue(freshPayload) } as any;
    const cache = new OddsCacheService(client, 1_000);

    const result = await cache.getLatestOrRefresh(key);

    expect(result).toEqual(freshPayload);
    expect(client.fetchOdds).toHaveBeenCalledWith(key);
    expect(OddsSnapshot.create).toHaveBeenCalledTimes(1);
    expect(OddsSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...key,
        payload: freshPayload,
      }),
    );
  });

  it("returns stale payload when 24h refresh cap is reached", async () => {
    const stalePayload = [{ id: "stale_game" }];
    OddsSnapshot.findOne.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        ...key,
        fetchedAt: new Date("2026-01-27T10:00:00.000Z"),
        expiresAt: new Date("2026-01-27T11:00:00.000Z"),
        payload: stalePayload,
      }),
    });
    OddsSnapshot.countDocuments.mockResolvedValue(3);

    const client = { fetchOdds: vi.fn() } as any;
    const cache = new OddsCacheService(client, 1_000, 3);

    const result = await cache.getLatestOrRefresh(key);

    expect(result).toEqual(stalePayload);
    expect(client.fetchOdds).not.toHaveBeenCalled();
    expect(OddsSnapshot.create).not.toHaveBeenCalled();
  });

  it("throws when 24h refresh cap is reached and no cached payload exists", async () => {
    OddsSnapshot.findOne.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });
    OddsSnapshot.countDocuments.mockResolvedValue(3);

    const client = { fetchOdds: vi.fn() } as any;
    const cache = new OddsCacheService(client, 1_000, 3);

    await expect(cache.getLatestOrRefresh(key)).rejects.toThrow(
      /refresh cap reached/i,
    );
    expect(client.fetchOdds).not.toHaveBeenCalled();
    expect(OddsSnapshot.create).not.toHaveBeenCalled();
  });

  it("coalesces concurrent refreshes for the same cache key", async () => {
    OddsSnapshot.findOne.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });
    OddsSnapshot.countDocuments.mockResolvedValue(0);

    const freshPayload = [{ id: "coalesced_game" }];
    const client = {
      fetchOdds: vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return freshPayload;
      }),
    } as any;
    const cache = new OddsCacheService(client, 1_000, 3);

    const [a, b] = await Promise.all([
      cache.getLatestOrRefresh(key),
      cache.getLatestOrRefresh(key),
    ]);

    expect(a).toEqual(freshPayload);
    expect(b).toEqual(freshPayload);
    expect(client.fetchOdds).toHaveBeenCalledTimes(1);
    expect(OddsSnapshot.create).toHaveBeenCalledTimes(1);
  });
});
