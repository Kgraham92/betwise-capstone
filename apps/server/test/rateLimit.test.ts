import request from "supertest";
import { createApp } from "../src/app.js";
import { describe, it, expect, beforeEach } from "vitest";

describe("Rate Limiting Middleware", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp({ corsOrigin: "http://localhost:3000" });
    app.set("trust proxy", 1);
  });

  it("applies RateLimit headers on mounted /api routes", async () => {
    const response = await request(app)
      .get("/api")
      .set("X-Forwarded-For", "10.10.10.1")
      .expect(200);

    expect(response.headers["ratelimit-policy"]).toContain("100;w=60");
  });

  it("enforces apiLimiter max requests on mounted /api routes", async () => {
    const ip = "10.10.10.2";
    for (let i = 0; i < 100; i++) {
      await request(app).get("/api").set("X-Forwarded-For", ip).expect(200);
    }

    const response = await request(app)
      .get("/api")
      .set("X-Forwarded-For", ip)
      .expect(429);

    expect(response.body).toEqual({
      error: "Too many requests, please slow down",
    });
    expect(response.headers["ratelimit-policy"]).toContain("100;w=60");
    expect(response.headers["retry-after"]).toBeDefined();
  });

  it("applies authLimiter to /api/auth/me", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("X-Forwarded-For", "10.10.10.3")
      .expect(401);

    expect(response.headers["ratelimit-policy"]).toContain("10;w=900");
  });
});
