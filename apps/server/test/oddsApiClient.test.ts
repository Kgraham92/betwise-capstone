import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OddsApiClient } from "../src/services/oddsApiClient.js";

describe("OddsApiClient", () => {
  beforeEach(() => {
    process.env.ODDS_API_KEY = "test_key";
    process.env.ODDS_API_BASE_URL = "https://api.the-odds-api.com";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("fetches odds and passes expected query params", async () => {
    const payload = [{ id: "game_1" }];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => payload,
      }),
    );

    const client = new OddsApiClient();
    const out = await client.fetchOdds({
      sportKey: "americanfootball_nfl",
      regions: "us",
      markets: "h2h,spreads,totals",
      oddsFormat: "american",
    });

    expect(out).toEqual(payload);
    const [url] = (globalThis.fetch as any).mock.calls[0];
    expect(String(url)).toContain("/v4/sports/americanfootball_nfl/odds");
    expect(String(url)).toContain("apiKey=test_key");
    expect(String(url)).toContain("regions=us");
    expect(String(url)).toContain("markets=h2h%2Cspreads%2Ctotals");
    expect(String(url)).toContain("oddsFormat=american");
  });

  it("retries retryable HTTP failures then succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => "server error",
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [{ id: "game_after_retry" }],
        }),
    );

    const client = new OddsApiClient();
    const out = await client.fetchOdds(
      {
        sportKey: "americanfootball_nfl",
        regions: "us",
        markets: "h2h,spreads,totals",
        oddsFormat: "american",
      },
      { retries: 2, backoffMs: 0 },
    );

    expect(out).toEqual([{ id: "game_after_retry" }]);
    expect((globalThis.fetch as any).mock.calls.length).toBe(2);
  });

  it("throws a timeout error when fetch aborts", async () => {
    const abortErr = new Error("aborted");
    abortErr.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortErr));

    const client = new OddsApiClient();
    await expect(
      client.fetchOdds(
        {
          sportKey: "americanfootball_nfl",
          regions: "us",
          markets: "h2h,spreads,totals",
          oddsFormat: "american",
        },
        { timeoutMs: 1, retries: 0 },
      ),
    ).rejects.toThrow(/timeout/i);
  });
});
