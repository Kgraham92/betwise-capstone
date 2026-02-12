import type { SuperTest, Test } from "supertest";
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
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
    findByIdAndDelete: vi.fn(),
  },
}));

import { User } from "../src/models/User.js";

describe("Account Actions", () => {
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

  it("POST /api/auth/logout returns success", async () => {
    const res = await api.post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Logout successful");
  });

  it("PATCH /api/users/me/password changes password", async () => {
    const oldHash = await bcrypt.hash("currentPass123", 10);
    const user = {
      passwordHash: oldHash,
      save: vi.fn(async () => undefined),
    };

    vi.mocked(User.findById).mockResolvedValue(user as any);

    const res = await api.patch("/api/users/me/password").send({
      currentPassword: "currentPass123",
      newPassword: "newPass1234",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password updated");
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(await bcrypt.compare("newPass1234", user.passwordHash)).toBe(true);
  });

  it("PATCH /api/users/me/password rejects incorrect current password", async () => {
    const oldHash = await bcrypt.hash("currentPass123", 10);
    const user = {
      passwordHash: oldHash,
      save: vi.fn(async () => undefined),
    };

    vi.mocked(User.findById).mockResolvedValue(user as any);

    const res = await api.patch("/api/users/me/password").send({
      currentPassword: "wrong-password",
      newPassword: "newPass1234",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("incorrect");
    expect(user.save).not.toHaveBeenCalled();
  });

  it("DELETE /api/users/me deletes the current account", async () => {
    vi.mocked(User.findByIdAndDelete).mockResolvedValue({ _id: "u1" } as any);

    const res = await api.delete("/api/users/me");

    expect(res.status).toBe(204);
    expect(vi.mocked(User.findByIdAndDelete)).toHaveBeenCalledWith("u1");
  });
});
