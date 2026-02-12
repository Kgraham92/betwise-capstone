import type { SuperTest, Test } from "supertest";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import { startTestServer, stopTestServer } from "./helpers/server.js";

vi.mock("../src/middleware/auth.js", () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    next();
  },
}));

describe("GET /api/sentiment", () => {
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

  it("400s when required params are missing", async () => {
    const res = await api.get("/api/sentiment");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns deterministic output for same inputs", async () => {
    const qs =
      "/api/sentiment?gameId=123&homeTeam=Cowboys&awayTeam=Eagles&spread=-3.5&total=47.5&mlHome=-150&mlAway=130";

    const a = await api.get(qs);
    const b = await api.get(qs);

    expect(a.status).toBe(200);
    expect(b.status).toBe(200);

    // Deterministic seed means same result each call
    expect(a.body).toEqual(b.body);
    expect(a.body).toHaveProperty("meta.seed");
    expect(a.body).toHaveProperty("meta.notes");
  });

  it("uses prediction-market impliedProbHome when provided (note check)", async () => {
    const qs =
      "/api/sentiment?gameId=999&homeTeam=TeamA&awayTeam=TeamB&impliedProbHome=0.62";

    const res = await api.get(qs);
    expect(res.status).toBe(200);
    expect(res.body.meta.notes.join(" ")).toMatch(/prediction-market/i);
  });
});
