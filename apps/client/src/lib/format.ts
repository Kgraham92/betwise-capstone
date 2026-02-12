export function formatGameTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatGameDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function getSportLabel(sportKey: string): string {
  const sportMap: Record<string, string> = {
    basketball_nba: "NBA",
    americanfootball_nfl: "NFL",
    icehockey_nhl: "NHL",
    baseball_mlb: "MLB",
  };
  return sportMap[sportKey] || sportKey.toUpperCase();
}
