import type { SuperTest, Test } from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import { startTestServer, stopTestServer } from "./helpers/server.js";

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

describe("Auth Routes", () => {
  describe("POST /api/auth/register", () => {
    it("returns 400 for missing email", async () => {
      const res = await api
        .post("/api/auth/register")
        .send({ password: "testpassword123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("returns 400 for invalid email format", async () => {
      const res = await api
        .post("/api/auth/register")
        .send({ email: "not-an-email", password: "testpassword123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("returns 400 for password too short", async () => {
      const res = await api
        .post("/api/auth/register")
        .send({ email: "test@example.com", password: "short" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.details).toContainEqual(
        expect.objectContaining({ field: "password" })
      );
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns 400 for missing email", async () => {
      const res = await api
        .post("/api/auth/login")
        .send({ password: "testpassword" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("returns 400 for invalid email format", async () => {
      const res = await api
        .post("/api/auth/login")
        .send({ email: "not-an-email", password: "testpassword" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("returns 400 for missing password", async () => {
      const res = await api
        .post("/api/auth/login")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 without token", async () => {
      const res = await api.get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Unauthorized");
    });

    it("returns 401 with invalid token", async () => {
      const res = await api
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Unauthorized");
    });
  });
});
