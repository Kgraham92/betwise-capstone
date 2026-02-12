import type { SuperTest, Test } from "supertest";
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import { startTestServer, stopTestServer } from "./helpers/server.js";

/**
 * We mock the Mongo model used by OddsCacheService so tests don't need a real DB.
 * IMPORTANT: the path must match the import used by your code:
 *   oddsCache.ts -> import { OddsSnapshot } from "../models/OddsSnapshot.js";
 */
vi.mock("../src/models/OddsSnapshot.js", () => {
  return {
    OddsSnapshot: {
      findOne: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      create: vi.fn(),
    },
  };
});

// Pull the mocked module instance for per-test setup
import { OddsSnapshot } from "../src/models/OddsSnapshot.js";

// Mock auth middleware to bypass protection
vi.mock("../src/middleware/auth.js", () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { userId: "test_user", email: "test@example.com" };
    next();
  },
}));

function makeFetchOkJson(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as any;
}

describe("Games API", () => {
  const app = createApp({ corsOrigin: "http://localhost:3000" });
  let api: SuperTest<Test>;
  let server: Awaited<ReturnType<typeof startTestServer>>["server"];

  beforeAll(async () => {
    const testServer = await startTestServer(app);
    api = testServer.request;
    server = testServer.server;
  });

  afterAll(async () => {
    if (server) {
      await stopTestServer(server);
    }
  });

  beforeEach(() => {
    // Required for OddsApiClient.required.oddsApiKey()
    process.env.ODDS_API_KEY = "test_key";
    process.env.ODDS_API_BASE_URL = "https://api.the-odds-api.com";

    // Default: no cache hit -> forces fetch -> then creates snapshot
    OddsSnapshot.findOne.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });
    OddsSnapshot.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });
    OddsSnapshot.countDocuments.mockResolvedValue(0);
    OddsSnapshot.create.mockResolvedValue({});

    // Mock global fetch
    vi.stubGlobal("fetch", vi.fn());

    // Freeze time for 48h checks & TTL checks
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-27T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("GET /api/games 400 when sportKey missing", async () => {
    const res = await api.get("/api/games");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /api/games returns normalized games from mocked Odds API", async () => {
    // Odds API-like payload (minimal shape our normalizer expects)
    const payload = [
      {
        id: "game_1",
        sport_key: "basketball_nba",
        commence_time: "2026-01-28T01:00:00.000Z",
        home_team: "Cowboys",
        away_team: "Eagles",
        bookmakers: [
          {
            key: "draftkings",
            title: "DraftKings",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Cowboys", price: -150 },
                  { name: "Eagles", price: 130 },
                ],
              },
              {
                key: "spreads",
                outcomes: [
                  { name: "Cowboys", point: -3.5, price: -110 },
                  { name: "Eagles", point: 3.5, price: -110 },
                ],
              },
              {
                key: "totals",
                outcomes: [
                  { name: "Over", point: 47.5, price: -110 },
                  { name: "Under", point: 47.5, price: -110 },
                ],
              },
            ],
          },
        ],
      },
    ];

    (globalThis.fetch as any).mockResolvedValue(makeFetchOkJson(payload));

    const res = await api.get(
      "/api/games?sportKey=basketball_nba",
    );

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("games");
    expect(res.body.count).toBe(1);

    const g = res.body.games[0];
    expect(g.providerGameId).toBe("game_1");
    expect(g.sportKey).toBe("basketball_nba");
    expect(g.homeTeam).toBe("Cowboys");
    expect(g.awayTeam).toBe("Eagles");

    // Main extracted lines
    expect(g.moneylineHome).toBe(-150);
    expect(g.moneylineAway).toBe(130);
    expect(g.spreadHome).toBe(-3.5);
    expect(g.spreadAway).toBe(3.5);
    expect(g.total).toBe(47.5);

    // Cache wrote a snapshot
    expect(OddsSnapshot.create).toHaveBeenCalledTimes(1);
  });

  it("GET /api/games uses cached snapshot when fresh (does not call fetch)", async () => {
    // Pretend we already have a fresh snapshot in Mongo
    const cachedPayload = [
      {
        id: "cached_game_1",
        sport_key: "basketball_nba",
        commence_time: "2026-01-28T01:00:00.000Z",
        home_team: "Cowboys",
        away_team: "Eagles",
        bookmakers: [
          {
            key: "draftkings",
            title: "DraftKings",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Cowboys", price: -140 },
                  { name: "Eagles", price: 120 },
                ],
              },
            ],
          },
        ],
      },
    ];

    // Ensure snapshot is still valid (expires in the future)
    OddsSnapshot.findOne.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        sportKey: "basketball_nba",
        regions: "us",
        markets: "h2h,spreads,totals",
        oddsFormat: "american",
        fetchedAt: new Date("2026-01-27T10:00:00.000Z"),
        expiresAt: new Date("2026-01-27T21:00:00.000Z"), // > "now" (12:00Z)
        payload: cachedPayload,
      }),
    });

    const res = await api.get(
      "/api/games?sportKey=basketball_nba",
    );

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.games[0].providerGameId).toBe("cached_game_1");

    // Key assertions:
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(OddsSnapshot.create).not.toHaveBeenCalled();
  });

  it("GET /api/games/:id/trends returns splitsAvailable=false when >48h away", async () => {
    // Now is 2026-01-27T12:00Z, so this is >48h away
    const payload = [
      {
        id: "game_far",
        sport_key: "basketball_nba",
        commence_time: "2026-01-30T20:00:00.000Z",
        home_team: "TeamA",
        away_team: "TeamB",
        bookmakers: [],
      },
    ];

    (globalThis.fetch as any).mockResolvedValue(makeFetchOkJson(payload));

    const res = await api.get(
      "/api/games/game_far/trends?sportKey=basketball_nba",
    );

    expect(res.status).toBe(200);
    expect(res.body.splitsAvailable).toBe(false);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("game");
    expect(res.body).not.toHaveProperty("sentiment");
  });

  it("GET /api/games/:id/trends returns sentiment when within 48h", async () => {
    // Now is 2026-01-27T12:00Z, this is within 48h
    const payload = [
      {
        id: "game_near",
        sport_key: "basketball_nba",
        commence_time: "2026-01-28T20:00:00.000Z",
        home_team: "Cowboys",
        away_team: "Eagles",
        bookmakers: [
          {
            key: "draftkings",
            title: "DraftKings",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Cowboys", price: -150 },
                  { name: "Eagles", price: 130 },
                ],
              },
              {
                key: "spreads",
                outcomes: [
                  { name: "Cowboys", point: -3.5, price: -110 },
                  { name: "Eagles", point: 3.5, price: -110 },
                ],
              },
              {
                key: "totals",
                outcomes: [
                  { name: "Over", point: 47.5, price: -110 },
                  { name: "Under", point: 47.5, price: -110 },
                ],
              },
            ],
          },
        ],
      },
    ];

    (globalThis.fetch as any).mockResolvedValue(makeFetchOkJson(payload));

    const res = await api.get(
      "/api/games/game_near/trends?sportKey=basketball_nba",
    );

    expect(res.status).toBe(200);
    expect(res.body.splitsAvailable).toBe(true);
    expect(res.body).toHaveProperty("game");
    expect(res.body).toHaveProperty("sentiment");

    // Spot check sentiment structure
    expect(res.body.sentiment).toHaveProperty("moneyline.homePct");
    expect(res.body.sentiment).toHaveProperty("meta.seed");
  });

  it("GET /api/games/:id returns game details for a known game", async () => {
    const payload = [
      {
        id: "game_42",
        sport_key: "basketball_nba",
        commence_time: "2026-01-28T01:00:00.000Z",
        home_team: "Cowboys",
        away_team: "Eagles",
        bookmakers: [
          {
            key: "draftkings",
            title: "DraftKings",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Cowboys", price: -150 },
                  { name: "Eagles", price: 130 },
                ],
              },
            ],
          },
        ],
      },
    ];
    (globalThis.fetch as any).mockResolvedValue(makeFetchOkJson(payload));

    const res = await api.get(
      "/api/games/game_42?sportKey=basketball_nba",
    );

    expect(res.status).toBe(200);
    expect(res.body.game.providerGameId).toBe("game_42");
    expect(res.body.game.homeTeam).toBe("Cowboys");
  });

  it("GET /api/games/:id returns 404 when game is not in latest snapshot", async () => {
    const payload = [
      {
        id: "game_other",
        sport_key: "basketball_nba",
        commence_time: "2026-01-28T01:00:00.000Z",
        home_team: "Cowboys",
        away_team: "Eagles",
        bookmakers: [],
      },
    ];
    (globalThis.fetch as any).mockResolvedValue(makeFetchOkJson(payload));

    const res = await api.get(
      "/api/games/game_missing?sportKey=basketball_nba",
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Game not found/i);
  });

  it("GET /api/games/:id/line-movement returns points from odds history", async () => {
    OddsSnapshot.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          fetchedAt: new Date("2026-01-27T10:00:00.000Z"),
          payload: [
            {
              id: "game_hist_1",
              sport_key: "basketball_nba",
              commence_time: "2026-01-28T20:00:00.000Z",
              home_team: "Cowboys",
              away_team: "Eagles",
              bookmakers: [
                {
                  key: "draftkings",
                  title: "DraftKings",
                  markets: [
                    {
                      key: "h2h",
                      outcomes: [
                        { name: "Cowboys", price: -140 },
                        { name: "Eagles", price: 120 },
                      ],
                    },
                    {
                      key: "spreads",
                      outcomes: [
                        { name: "Cowboys", point: -3, price: -110 },
                        { name: "Eagles", point: 3, price: -110 },
                      ],
                    },
                    {
                      key: "totals",
                      outcomes: [
                        { name: "Over", point: 47.5, price: -110 },
                        { name: "Under", point: 47.5, price: -110 },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          fetchedAt: new Date("2026-01-27T11:00:00.000Z"),
          payload: [
            {
              id: "game_hist_1",
              sport_key: "basketball_nba",
              commence_time: "2026-01-28T20:00:00.000Z",
              home_team: "Cowboys",
              away_team: "Eagles",
              bookmakers: [
                {
                  key: "draftkings",
                  title: "DraftKings",
                  markets: [
                    {
                      key: "h2h",
                      outcomes: [
                        { name: "Cowboys", price: -150 },
                        { name: "Eagles", price: 130 },
                      ],
                    },
                    {
                      key: "spreads",
                      outcomes: [
                        { name: "Cowboys", point: -3.5, price: -110 },
                        { name: "Eagles", point: 3.5, price: -110 },
                      ],
                    },
                    {
                      key: "totals",
                      outcomes: [
                        { name: "Over", point: 48, price: -110 },
                        { name: "Under", point: 48, price: -110 },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]),
    });

    const res = await api.get(
      "/api/games/game_hist_1/line-movement?sportKey=basketball_nba",
    );

    expect(res.status).toBe(200);
    expect(res.body.points).toHaveLength(2);
    expect(res.body.points[0]).toHaveProperty("sentimentIndex");
    expect(res.body.game.providerGameId).toBe("game_hist_1");
  });

  it("GET /api/games/:id/line-movement returns 404 when no history exists", async () => {
    OddsSnapshot.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    const res = await api.get(
      "/api/games/game_hist_1/line-movement?sportKey=basketball_nba",
    );

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/No odds history available/i);
  });
});
