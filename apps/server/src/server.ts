import { createApp } from "./app.js";
import { config, required } from "./config.js";
import { connectDb } from "./db.js";
import { startOddsScheduler } from "./services/oddsScheduler.js";

async function start() {
  // DB is required for production; in early dev you can choose to allow running without DB.
  const mongoUri = config.mongoUri || required.mongoUri();

  await connectDb(mongoUri, config.mongoDbName);

  startOddsScheduler();

  const app = createApp({ corsOrigin: config.corsOrigin });

  app.listen(config.port, () => {
    console.log(`[server] listening on :${config.port} (${config.nodeEnv})`);
  });
}

start().catch((e) => {
  console.error("[server] failed to start", e);
  process.exit(1);
});
