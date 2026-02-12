import { config, required } from "../config.js";

type OddsApiParams = {
  sportKey: string;
  regions: string; // "us"
  markets: string; // "h2h,spreads,totals"
  oddsFormat: "american" | "decimal";
};

type OddsApiFetchOptions = {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 500;
const RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);

class OddsApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "OddsApiError";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OddsApiClient {
  async fetchOdds(
    params: OddsApiParams,
    options: OddsApiFetchOptions = {},
  ): Promise<unknown> {
    const apiKey = required.oddsApiKey();
    const base = config.oddsApiBaseUrl.replace(/\/$/, "");

    const url = new URL(`${base}/v4/sports/${params.sportKey}/odds`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("regions", params.regions);
    url.searchParams.set("markets", params.markets);
    url.searchParams.set("oddsFormat", params.oddsFormat);

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const retries = options.retries ?? DEFAULT_RETRIES;
    const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF_MS;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url.toString(), {
          headers: { accept: "application/json" },
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          const error = new OddsApiError(
            res.status,
            `OddsApi error ${res.status}: ${body}`,
          );

          if (RETRY_STATUS.has(res.status) && attempt < retries) {
            await sleep(backoffMs * (attempt + 1));
            continue;
          }

          throw error;
        }

        return res.json();
      } catch (err) {
        if (err instanceof OddsApiError) {
          throw err;
        }

        if (attempt < retries) {
          await sleep(backoffMs * (attempt + 1));
          continue;
        }

        if (err instanceof Error && err.name === "AbortError") {
          throw new Error(`OddsApi timeout after ${timeoutMs}ms`);
        }

        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new Error("OddsApi request failed");
  }
}
