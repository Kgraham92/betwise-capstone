import type { SuperTest, Test } from "supertest";
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import { startTestServer, stopTestServer } from "./helpers/server.js";

vi.mock("../src/middleware/auth.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { userId: "u1", email: "user@test.com" };
    next();
  },
}));

vi.mock("../src/models/User.js", () => ({
  User: {
    findById: vi.fn(),
  },
}));

import { User } from "../src/models/User.js";

type MutableFavorite = {
  _id: string;
  sportKey: string;
  teamKey: string;
  teamName: string;
  label?: string;
};

type MutableUser = {
  favorites: MutableFavorite[];
  save: ReturnType<typeof vi.fn>;
};

function makeUser(favorites: MutableFavorite[] = []): MutableUser {
  return {
    favorites,
    save: vi.fn(async () => undefined),
  };
}

describe("Favorites CRUD", () => {
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
    vi.resetAllMocks();
  });

  it("GET /api/users/me/favorites returns favorites", async () => {
    vi.mocked(User.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        favorites: [
          {
            _id: "fav_1",
            sportKey: "basketball_nba",
            teamKey: "lakers",
            teamName: "Lakers",
            label: "Home lock",
          },
        ],
      }),
    } as any);

    const res = await api.get("/api/users/me/favorites");

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.favorites[0]).toMatchObject({
      id: "fav_1",
      teamName: "Lakers",
      sportKey: "basketball_nba",
    });
  });

  it("POST /api/users/me/favorites creates a favorite", async () => {
    const user = makeUser();
    vi.mocked(User.findById).mockResolvedValue(user as any);

    const res = await api.post("/api/users/me/favorites").send({
      sportKey: "basketball_nba",
      teamKey: "lakers",
      teamName: "Lakers",
      label: "West",
    });

    expect(res.status).toBe(201);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res.body.favorite).toMatchObject({
      sportKey: "basketball_nba",
      teamKey: "lakers",
      teamName: "Lakers",
      label: "West",
    });
  });

  it("PATCH /api/users/me/favorites/:favoriteId updates a favorite", async () => {
    const user = makeUser([
      {
        _id: "fav_1",
        sportKey: "basketball_nba",
        teamKey: "lakers",
        teamName: "Lakers",
        label: "Old",
      },
    ]);
    vi.mocked(User.findById).mockResolvedValue(user as any);

    const res = await api.patch("/api/users/me/favorites/fav_1").send({
      label: "New",
      teamName: "LA Lakers",
    });

    expect(res.status).toBe(200);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(res.body.favorite).toMatchObject({
      id: "fav_1",
      teamName: "LA Lakers",
      label: "New",
    });
  });

  it("DELETE /api/users/me/favorites/:favoriteId deletes a favorite", async () => {
    const user = makeUser([
      {
        _id: "fav_1",
        sportKey: "basketball_nba",
        teamKey: "lakers",
        teamName: "Lakers",
      },
    ]);
    vi.mocked(User.findById).mockResolvedValue(user as any);

    const res = await api.delete("/api/users/me/favorites/fav_1");

    expect(res.status).toBe(204);
    expect(user.favorites).toEqual([]);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  it("POST /api/users/me/favorites returns 409 for duplicates", async () => {
    const user = makeUser([
      {
        _id: "fav_1",
        sportKey: "basketball_nba",
        teamKey: "lakers",
        teamName: "Lakers",
      },
    ]);
    vi.mocked(User.findById).mockResolvedValue(user as any);

    const res = await api.post("/api/users/me/favorites").send({
      sportKey: "basketball_nba",
      teamKey: "lakers",
      teamName: "Lakers",
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain("exists");
  });
});
