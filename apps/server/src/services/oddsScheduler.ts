import { OddsApiClient } from "./oddsApiClient.js";
import { OddsCacheService } from "./oddsCache.js";
import { SPORTS } from "@betwise/shared";
import { config } from "../config.js";

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

type SchedulerOptions = {
  intervalMs?: number;
};

export function startOddsScheduler(options: SchedulerOptions = {}) {
  const intervalMs = options.intervalMs ?? EIGHT_HOURS_MS;
  const cache = new OddsCacheService(new OddsApiClient());

  async function refreshAll() {
    for (const sport of SPORTS) {
      if (!config.enableSports[sport.key as keyof typeof config.enableSports]) {
        continue;
      }
      try {
        await cache.getLatestOrRefresh({
          sportKey: sport.key,
          regions: "us",
          markets: "h2h,spreads,totals",
          oddsFormat: "american",
        });
      } catch (err) {
        console.error(`[scheduler] failed to refresh ${sport.key}`, err);
      }
    }
  }

  // Run once on startup, then on the interval.
  void refreshAll();
  const handle = setInterval(refreshAll, intervalMs);

  return () => clearInterval(handle);
}
