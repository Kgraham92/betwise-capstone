import type { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestServer, stopTestServer } from "./helpers/server.js";

describe("Games API auth protection", () => {
  let api: SuperTest<Test>;
  let server: Awaited<ReturnType<typeof startTestServer>>["server"];

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    const { createApp } = await import("../src/app.js");
    const app = createApp({ corsOrigin: "http://localhost:3000" });
    const testServer = await startTestServer(app);
    api = testServer.request;
    server = testServer.server;
  });

  afterAll(async () => {
    if (server) {
      await stopTestServer(server);
    }
  });

  it("GET /api/games/:id/line-movement returns 401 without token", async () => {
    const res = await api.get(
      "/api/games/game_1/line-movement?sportKey=basketball_nba",
    );

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Unauthorized");
  });

  it("GET /api/games/:id/trends returns 401 without token", async () => {
    const res = await api.get(
      "/api/games/game_1/trends?sportKey=basketball_nba",
    );

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("Unauthorized");
  });
});
