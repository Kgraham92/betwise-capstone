import type { SuperTest, Test } from "supertest";
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import { startTestServer, stopTestServer } from "./helpers/server.js";

vi.mock("../src/models/OddsSnapshot.js", () => ({
  OddsSnapshot: {
    findOne: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../src/middleware/auth.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { userId: "test_user", email: "test@example.com" };
    next();
  },
}));

const generateSentimentMock = vi.fn();
vi.mock("../src/services/sentiment.js", () => ({
  generateSentiment: (...args: unknown[]) => generateSentimentMock(...args),
}));
import { OddsSnapshot } from "../src/models/OddsSnapshot.js";

function makeFetchOkJson(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as any;
}

describe("GET /api/trends", () => {
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
    process.env.ODDS_API_KEY = "test_key";
    process.env.ODDS_API_BASE_URL = "https://api.the-odds-api.com";

    OddsSnapshot.findOne.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    });
    OddsSnapshot.countDocuments.mockResolvedValue(0);
    OddsSnapshot.create.mockResolvedValue({});

    vi.stubGlobal("fetch", vi.fn((input: string | URL) => {
      const url = String(input);
      if (url.includes("/sports/basketball_nba/odds")) {
        return Promise.resolve(
          makeFetchOkJson([
            {
              id: "nba_high",
              sport_key: "basketball_nba",
              commence_time: "2026-01-28T15:00:00.000Z",
              home_team: "Lakers",
              away_team: "Celtics",
              bookmakers: [],
            },
            {
              id: "nba_low",
              sport_key: "basketball_nba",
              commence_time: "2026-01-28T18:00:00.000Z",
              home_team: "Heat",
              away_team: "Bulls",
              bookmakers: [],
            },
          ]),
        );
      }
      if (url.includes("/sports/americanfootball_nfl/odds")) {
        return Promise.resolve(
          makeFetchOkJson([
            {
              id: "nfl_mid",
              sport_key: "americanfootball_nfl",
              commence_time: "2026-01-28T21:00:00.000Z",
              home_team: "Cowboys",
              away_team: "Eagles",
              bookmakers: [],
            },
          ]),
        );
      }
      if (url.includes("/sports/icehockey_nhl/odds")) {
        return Promise.resolve(
          makeFetchOkJson([
            {
              id: "nhl_future",
              sport_key: "icehockey_nhl",
              commence_time: "2026-02-05T21:00:00.000Z",
              home_team: "Rangers",
              away_team: "Bruins",
              bookmakers: [],
            },
          ]),
        );
      }
      return Promise.resolve(makeFetchOkJson([]));
    }));

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-27T12:00:00.000Z"));

    generateSentimentMock.mockImplementation((input: { gameId: string }) => {
      if (input.gameId === "nba_high") {
        return {
          spread: { homePct: 74, awayPct: 26 },
          moneyline: { homePct: 58, awayPct: 42 },
          total: { overPct: 52, underPct: 48 },
          confidence: "high",
          meta: { seed: 1, notes: [] },
        };
      }
      if (input.gameId === "nfl_mid") {
        return {
          spread: { homePct: 68, awayPct: 32 },
          moneyline: { homePct: 55, awayPct: 45 },
          total: { overPct: 51, underPct: 49 },
          confidence: "med",
          meta: { seed: 2, notes: [] },
        };
      }
      return {
        spread: { homePct: 54, awayPct: 46 },
        moneyline: { homePct: 53, awayPct: 47 },
        total: { overPct: 52, underPct: 48 },
        confidence: "low",
        meta: { seed: 3, notes: [] },
      };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("filters by minPct and sorts items by strongest highlight descending", async () => {
    const res = await api.get("/api/trends?minPct=60");

    expect(res.status).toBe(200);
    expect(res.body.minPct).toBe(60);
    expect(res.body.count).toBe(1);
    expect(res.body.items[0].game.providerGameId).toBe("nba_high");
  });

  it("applies a floor of 50 to minPct", async () => {
    const res = await api.get("/api/trends?minPct=20");

    expect(res.status).toBe(200);
    expect(res.body.minPct).toBe(50);
    expect(res.body.count).toBeGreaterThan(0);
  });
});
