import { BetWiseGame } from "@betwise/shared";

type OddsApiOutcome = { name: string; price?: number; point?: number };
type OddsApiMarket = { key: string; outcomes: OddsApiOutcome[] };
type OddsApiBookmaker = {
  key: string;
  title: string;
  markets: OddsApiMarket[];
};
type OddsApiEvent = {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsApiBookmaker[];
};

export function normalizeOddsApiEvents(payload: unknown): BetWiseGame[] {
  if (!Array.isArray(payload)) return [];

  return (payload as OddsApiEvent[]).map((ev) => {
    const out: BetWiseGame = {
      providerGameId: ev.id,
      sportKey: ev.sport_key,
      commenceTime: ev.commence_time,
      homeTeam: ev.home_team,
      awayTeam: ev.away_team,
    };

    const b = ev.bookmakers?.[0]; // MVP: “first bookmaker” baseline
    const markets = b?.markets ?? [];

    const h2h = markets.find((m) => m.key === "h2h");
    if (h2h?.outcomes?.length) {
      const home = h2h.outcomes.find((o) => o.name === ev.home_team);
      const away = h2h.outcomes.find((o) => o.name === ev.away_team);
      out.moneylineHome =
        typeof home?.price === "number" ? home.price : undefined;
      out.moneylineAway =
        typeof away?.price === "number" ? away.price : undefined;
    }

    const spreads = markets.find((m) => m.key === "spreads");
    if (spreads?.outcomes?.length) {
      const home = spreads.outcomes.find((o) => o.name === ev.home_team);
      const away = spreads.outcomes.find((o) => o.name === ev.away_team);
      out.spreadHome = typeof home?.point === "number" ? home.point : undefined;
      out.spreadAway = typeof away?.point === "number" ? away.point : undefined;
    }

    const totals = markets.find((m) => m.key === "totals");
    if (totals?.outcomes?.length) {
      // totals outcomes are usually "Over"/"Under" with same point
      const over = totals.outcomes.find((o) => o.name.toLowerCase() === "over");
      out.total = typeof over?.point === "number" ? over.point : undefined;
    }

    return out;
  });
}
