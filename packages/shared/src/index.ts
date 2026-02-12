// Shared Types for BetWise

export type BetWiseGame = {
  providerGameId: string;
  sportKey: string;
  commenceTime: string; // ISO date string
  homeTeam: string;
  awayTeam: string;
  moneylineHome?: number;
  moneylineAway?: number;
  spreadHome?: number;
  spreadAway?: number;
  total?: number;
};

export type SentimentData = {
  spread: { homePct: number; awayPct: number };
  total: { overPct: number; underPct: number };
  moneyline: { homePct: number; awayPct: number };
  confidence: "low" | "med" | "high";
  meta: {
    seed: number;
    notes: string[];
  };
};

export type FavoriteTeam = {
  id: string;
  sportKey: string;
  teamKey: string;
  teamName: string;
  label: string;
};

// API Response types

export type GamesListResponse = {
  sportKey: string;
  regions: string;
  markets: string;
  oddsFormat: string;
  count: number;
  games: BetWiseGame[];
};

export type GameResponse = {
  game: BetWiseGame;
};

export type GameTrendsResponse = {
  game: BetWiseGame;
  splitsAvailable: boolean;
  message?: string;
  sentiment?: SentimentData;
};

export type TrendHighlight = {
  market: "spread" | "moneyline" | "total";
  side: string;
  pct: number;
};

export type TrendItem = {
  game: BetWiseGame;
  sentiment: SentimentData;
  highlights: TrendHighlight[];
};

export type TrendsResponse = {
  minPct: number;
  count: number;
  generatedAt: string;
  items: TrendItem[];
};

export type LineMovementPoint = {
  timestamp: string;
  spreadHome?: number;
  spreadAway?: number;
  moneylineHome?: number;
  moneylineAway?: number;
  total?: number;
  sentimentIndex?: number;
  sentimentSpreadHome?: number;
  sentimentMoneylineHome?: number;
  sentimentOver?: number;
};

export type LineMovementResponse = {
  game: BetWiseGame;
  points: LineMovementPoint[];
};

export type FavoritesListResponse = {
  count: number;
  favorites: FavoriteTeam[];
};

export type FavoriteResponse = {
  favorite: FavoriteTeam;
};

// Sport configuration
export type SportConfig = {
  key: string;
  name: string;
  icon: string;
};

export const SPORTS: SportConfig[] = [
  { key: "basketball_nba", name: "NBA", icon: "Basketball" },
  { key: "americanfootball_nfl", name: "NFL", icon: "Football" },
  { key: "icehockey_nhl", name: "NHL", icon: "Hockey" },
  { key: "baseball_mlb", name: "MLB", icon: "Baseball" },
];

export const LEAGUE_TEAMS: Record<string, string[]> = {
  basketball_nba: [
    "Atlanta Hawks",
    "Boston Celtics",
    "Brooklyn Nets",
    "Charlotte Hornets",
    "Chicago Bulls",
    "Cleveland Cavaliers",
    "Dallas Mavericks",
    "Denver Nuggets",
    "Detroit Pistons",
    "Golden State Warriors",
    "Houston Rockets",
    "Indiana Pacers",
    "LA Clippers",
    "Los Angeles Lakers",
    "Memphis Grizzlies",
    "Miami Heat",
    "Milwaukee Bucks",
    "Minnesota Timberwolves",
    "New Orleans Pelicans",
    "New York Knicks",
    "Oklahoma City Thunder",
    "Orlando Magic",
    "Philadelphia 76ers",
    "Phoenix Suns",
    "Portland Trail Blazers",
    "Sacramento Kings",
    "San Antonio Spurs",
    "Toronto Raptors",
    "Utah Jazz",
    "Washington Wizards",
  ],
  americanfootball_nfl: [
    "Arizona Cardinals",
    "Atlanta Falcons",
    "Baltimore Ravens",
    "Buffalo Bills",
    "Carolina Panthers",
    "Chicago Bears",
    "Cincinnati Bengals",
    "Cleveland Browns",
    "Dallas Cowboys",
    "Denver Broncos",
    "Detroit Lions",
    "Green Bay Packers",
    "Houston Texans",
    "Indianapolis Colts",
    "Jacksonville Jaguars",
    "Kansas City Chiefs",
    "Las Vegas Raiders",
    "Los Angeles Chargers",
    "Los Angeles Rams",
    "Miami Dolphins",
    "Minnesota Vikings",
    "New England Patriots",
    "New Orleans Saints",
    "New York Giants",
    "New York Jets",
    "Philadelphia Eagles",
    "Pittsburgh Steelers",
    "San Francisco 49ers",
    "Seattle Seahawks",
    "Tampa Bay Buccaneers",
    "Tennessee Titans",
    "Washington Commanders",
  ],
  icehockey_nhl: [
    "Anaheim Ducks",
    "Boston Bruins",
    "Buffalo Sabres",
    "Calgary Flames",
    "Carolina Hurricanes",
    "Chicago Blackhawks",
    "Colorado Avalanche",
    "Columbus Blue Jackets",
    "Dallas Stars",
    "Detroit Red Wings",
    "Edmonton Oilers",
    "Florida Panthers",
    "Los Angeles Kings",
    "Minnesota Wild",
    "Montreal Canadiens",
    "Nashville Predators",
    "New Jersey Devils",
    "New York Islanders",
    "New York Rangers",
    "Ottawa Senators",
    "Philadelphia Flyers",
    "Pittsburgh Penguins",
    "San Jose Sharks",
    "Seattle Kraken",
    "St. Louis Blues",
    "Tampa Bay Lightning",
    "Toronto Maple Leafs",
    "Utah Hockey Club",
    "Vancouver Canucks",
    "Vegas Golden Knights",
    "Washington Capitals",
    "Winnipeg Jets",
  ],
  baseball_mlb: [
    "Arizona Diamondbacks",
    "Atlanta Braves",
    "Baltimore Orioles",
    "Boston Red Sox",
    "Chicago Cubs",
    "Chicago White Sox",
    "Cincinnati Reds",
    "Cleveland Guardians",
    "Colorado Rockies",
    "Detroit Tigers",
    "Houston Astros",
    "Kansas City Royals",
    "Los Angeles Angels",
    "Los Angeles Dodgers",
    "Miami Marlins",
    "Milwaukee Brewers",
    "Minnesota Twins",
    "New York Mets",
    "New York Yankees",
    "Oakland Athletics",
    "Philadelphia Phillies",
    "Pittsburgh Pirates",
    "San Diego Padres",
    "San Francisco Giants",
    "Seattle Mariners",
    "St. Louis Cardinals",
    "Tampa Bay Rays",
    "Texas Rangers",
    "Toronto Blue Jays",
    "Washington Nationals",
  ],
};

export const DEFAULT_SPORT = "basketball_nba";
