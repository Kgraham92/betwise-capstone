# BetWise: Real-Time Sports Scores and Betting Trends Dashboard

## Type
### Description
A web-based sports data platform for displaying live scores, betting odds (spread, moneyline, totals), and public betting trends, with outcome tracking and visual analytics.

## Stack
- Frontend: React.js, Tailwind CSS, Chart.js, Axios
- Backend: Node.js, Express.js
- Database: MongoDB
- Other Tools: Vite, Jest, Postman, GitHub, Netlify/Vercel

## Focus
Full-stack  
Equal attention to frontend data visualization and backend data processing/API integration.

## Type
Responsive Website  
Optimized for desktop and mobile use. Mobile app could be a future stretch goal.

## Goal
- Aggregate and display live sports scores and betting odds
- Analyze public betting trends
- Track game outcomes vs betting lines to provide insights
- Help users make informed sports predictions

## Users
- Sports fans (ages 18–45)
- Casual to advanced sports bettors
- Fantasy sports users and data-driven fans

The app will cater to users who want to:
- See live game scores and odds
- Track line movements and betting trends
- Analyze how well public sentiment matches results

## Data
### What
- Game metadata (teams, times, scores)
- Betting odds (spread, moneyline, total)
- Public % bet distribution
- Game results and outcome comparisons

### How
- Use sports odds APIs (e.g., The Odds API, ScoreBat, Sportradar)
- Store in MongoDB for trend analysis
- Potential mock API for early development
- Data may be processed through a server-side aggregator and optionally cached in MongoDB for trend tracking and querying

## Approach to Building
### Design Database Schema
- Plan MongoDB collections: Games, Odds, Trends

### Source Your Data
- Identify and integrate with external APIs (e.g., The Odds API)

### User Flows
- Design user journey: homepage → game details → trends

### Set Up Backend & DB
- Build Express API to retrieve, process, and store data; connect to MongoDB

### Set Up Frontend
- Build React UI with Axios for API calls; implement responsive layout

### User Authentication
- (Stretch) Allow users to save teams or set betting alerts (sign up/login)

## Database Schema
### Games
- `_id`
- `home_team, away_team`
- `start_time, league`
- `score_home, score_away`
- `final_result`

### Odds
- `game_id (ref)`
- `spread, moneyline, total`
- `public_bets: { team_a: %, team_b: % }`
- `timestamp`

### Trends
- `game_id (ref)`
- `result_vs_spread: win/loss/push`
- `result_vs_total: over/under/push`
- `result_vs_moneyline: win/loss`

## Functionality
- Browse live and upcoming games with betting lines
- View % of public bets and total line movement
- Track real-time scores
- Show win/loss outcome compared to spread/moneyline/total after game ends
- Stretch Goal: Leaderboard of most/least accurate public picks

## User Flow
- User lands on homepage → sees featured games and odds
- User clicks on a game → views detailed score and betting breakdown
- Historical page → track trends for past games (e.g. how often public was right)
- Stretch: Search or filter by team, date, or league

## Challenges & Risks
- Rate limits / API cost: May hit request caps with free tiers → consider scheduled data pulls or caching strategies
- Data consistency: Ensure game IDs align across scores and odds endpoints
- Latency: Real-time updates may require polling or WebSocket integration
- Security: Secure any API keys and use .env files to avoid leaks in production
- Mobile optimization: Building responsive charts and tables can be complex

## Stretch Goals
- Add user accounts to save favorite teams or games
- Enable notifications for big line movements or close games
- Build machine learning model to predict outcomes based on historical data
- Integrate game simulation based on team strength/injury/news feeds
