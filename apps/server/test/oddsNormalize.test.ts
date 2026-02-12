import { describe, it, expect } from "vitest";
import { normalizeOddsApiEvents } from "../src/services/oddsNormalize.js";

describe("normalizeOddsApiEvents", () => {
  it("returns empty array for non-array payload", () => {
    expect(normalizeOddsApiEvents(null)).toEqual([]);
    expect(normalizeOddsApiEvents({})).toEqual([]);
  });

  it("maps provider event and extracts h2h/spreads/totals", () => {
    const payload = [
      {
        id: "game_1",
        sport_key: "americanfootball_nfl",
        commence_time: "2026-01-28T01:00:00.000Z",
        home_team: "Cowboys",
        away_team: "Eagles",
        bookmakers: [
          {
            key: "draftkings",
            title: "DraftKings",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Cowboys", price: -150 },
                  { name: "Eagles", price: 130 },
                ],
              },
              {
                key: "spreads",
                outcomes: [
                  { name: "Cowboys", point: -3.5, price: -110 },
                  { name: "Eagles", point: 3.5, price: -110 },
                ],
              },
              {
                key: "totals",
                outcomes: [
                  { name: "Over", point: 47.5, price: -110 },
                  { name: "Under", point: 47.5, price: -110 },
                ],
              },
            ],
          },
        ],
      },
    ];

    const out = normalizeOddsApiEvents(payload);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual(
      expect.objectContaining({
        providerGameId: "game_1",
        sportKey: "americanfootball_nfl",
        homeTeam: "Cowboys",
        awayTeam: "Eagles",
        moneylineHome: -150,
        moneylineAway: 130,
        spreadHome: -3.5,
        spreadAway: 3.5,
        total: 47.5,
      }),
    );
  });
});
