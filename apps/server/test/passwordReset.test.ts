import type { SuperTest, Test } from "supertest";
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { startTestServer, stopTestServer } from "./helpers/server.js";

vi.mock("../src/models/User.js", () => ({
  User: {
    findOne: vi.fn(),
  },
}));

import { User } from "../src/models/User.js";

describe("Password Reset Flow", () => {
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

  it("POST /api/auth/forgot-password returns generic success for unknown email", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null as any);

    const res = await api.post("/api/auth/forgot-password").send({
      email: "missing@example.com",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("If an account exists");
    expect(res.body.resetToken).toBeUndefined();
  });

  it("POST /api/auth/forgot-password returns reset token in non-production", async () => {
    const user = {
      resetPasswordTokenHash: undefined as string | undefined,
      resetPasswordExpiresAt: undefined as Date | undefined,
      save: vi.fn(async () => undefined),
    };
    vi.mocked(User.findOne).mockResolvedValue(user as any);

    const res = await api.post("/api/auth/forgot-password").send({
      email: "user@example.com",
    });

    expect(res.status).toBe(200);
    expect(res.body.resetToken).toMatch(/^[a-f0-9]{64}$/i);
    expect(user.resetPasswordTokenHash).toBeTruthy();
    expect(user.resetPasswordExpiresAt).toBeInstanceOf(Date);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  it("POST /api/auth/reset-password rejects invalid token", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null as any);

    const res = await api.post("/api/auth/reset-password").send({
      token: "abcdef0123456789",
      newPassword: "newPassword123",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid or expired");
  });

  it("POST /api/auth/reset-password updates password on valid token", async () => {
    const user = {
      passwordHash: await bcrypt.hash("oldPassword123", 10),
      resetPasswordTokenHash: "some-hash",
      resetPasswordExpiresAt: new Date(Date.now() + 1000 * 60),
      save: vi.fn(async () => undefined),
    };
    vi.mocked(User.findOne).mockResolvedValue(user as any);

    const res = await api.post("/api/auth/reset-password").send({
      token: "abcdef0123456789",
      newPassword: "newPassword123",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password reset successful");
    expect(await bcrypt.compare("newPassword123", user.passwordHash)).toBe(true);
    expect(user.resetPasswordTokenHash).toBeUndefined();
    expect(user.resetPasswordExpiresAt).toBeUndefined();
    expect(user.save).toHaveBeenCalledTimes(1);
  });
});
