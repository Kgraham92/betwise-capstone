# Real-Time Sports Scores and Betting Trends App

## Summary
A mobile-optimized web app showing betting lines (spread, moneyline, totals), live scores, and public betting percentages for various sports games. An optional stretch goal tracks betting performance versus real outcomes.

## Stack
- Frontend: React (mobile-first design or React Native Web)
- Backend: Node.js + Express
- Database: MongoDB (optional if storing user favorites, scraped data, or outcome tracking)
- APIs: Odds API (odds), Live score API (e.g. SportRadar, TheSportsDB), optional scraping for public %s

## Key Features
- View betting odds for upcoming games (spread, moneyline, totals)
- Show % of public money on each betting line
- Display live scores and final results
- Filter by league or date
- Optional: Favorite games/watchlist
- Stretch Goal: Track outcomes vs. betting lines
- Win/Loss against spread
- Win/Loss against moneyline
- Win/Loss against total (Over/Under)

## Scaffold
```txt
/client
/components
GameList.jsx
GameCard.jsx
FilterControls.jsx
/server
/routes
bettingRoutes.js
/controllers
bettingController.js
server.js
```

## Pseudocode
```js
// GET /api/bets/mlb
function getBettingData(req, res) {
  const oddsUrl = `https://the-odds-api.com/v4/sports/baseball_mlb/odds?apikey=API_KEY`;
  const response = await fetch(oddsUrl);
  const games = await response.json();
  res.json(games);
}

// Evaluate outcome vs. spread, moneyline, and total
function evaluateOutcome(game) {
  const { spread, moneyline, total, finalScore } = game;
  const teamAWon = finalScore.teamA > finalScore.teamB;
  const scoreDiff = Math.abs(finalScore.teamA - finalScore.teamB);
  const totalPoints = finalScore.teamA + finalScore.teamB;

  const spreadCovered = scoreDiff > Math.abs(spread);
  const overHit = totalPoints > total;
  const underHit = totalPoints < total;

  return {
    moneylineResult: teamAWon ? "Win" : "Loss",
    spreadResult: spreadCovered ? "Win" : "Loss",
    totalResult: overHit ? "Over" : underHit ? "Under" : "Push",
  };
}
```
