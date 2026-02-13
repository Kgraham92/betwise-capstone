import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import authRouter from "./routes/auth.js";
import sentimentRouter from "./routes/sentiment.js";
import gamesRouter from "./routes/games.js";
import trendsRouter from "./routes/trends.js";
import usersRouter from "./routes/users.js";
import { apiLimiter } from "./middleware/rateLimit.js";

export function createApp(opts: { corsOrigin: string }) {
  const app = express();
  app.disable("x-powered-by");
  if (process.env.NODE_ENV === "production") {
    // Required behind Render's proxy so rate limiting can read client IP safely.
    app.set("trust proxy", 1);
  }

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          baseUri: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'none'"],
        },
      },
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use(
    cors({
      origin: opts.corsOrigin,
      credentials: true,
    }),
  );

  app.use("/api/auth", authRouter);
  app.use("/api", apiLimiter);
  app.use("/api/games", gamesRouter);
  app.use("/api/trends", trendsRouter);
  app.use("/api/users", usersRouter);

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Placeholder base route for API namespace
  app.get("/api", (_req, res) => {
    res.json({ name: "BetWise API", status: "ok" });
  });

  // Sentiment API (MVP)
  app.use("/api/sentiment", sentimentRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  // Error handler
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    },
  );

  return app;
}
