# Step 3: Frontend Specifications

## Frontend Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS

## Route Map

- `/` landing page
- `/login` authentication + forgot/reset password flow
- `/register` account creation
- `/games` game list by selected sport
- `/games/[id]` game details (trends + line movement)
- `/trends` aggregated trend highlights
- `/favorites` protected page for favorite team management
- `/account` protected page for password update and account deletion

## Primary User Flows

### Unauthenticated Flow

1. User lands on public pages
2. User opens login/register
3. User authenticates and token is stored client-side

### Authenticated Flow

1. User browses games and trends
2. User opens favorites and adds teams from league dropdowns
3. User updates favorite labels or removes favorites
4. User uses account page for password change or account deletion
5. User logs out from navbar

## User Flow Diagram

### Legacy Planning Addendum: User Flow Diagram

Description:
Visualize how a typical user interacts with BetWise-from landing on the home page to drilling down into specific game details and trend analytics.

Diagram Outline (Flowchart):

```txt
       [User Lands on Home Page]
                   |
                   v
      [View Featured/Live Games]
                   |
       +-----------+-----------+
       |                       |
       v                       v
[Click on Game Card]    [Search/Filter Options]
       |                       |
       v                       v
[Game Detail Page]  <--- [Refined List of Games]
       |
       v
[View Betting Odds & Trends]
       |
       v
[Post-Game Analysis & Outcome]
       |
       v
[Option: Save Favorite Teams or Set Notifications]
```

Notes:
- The initial page offers a high-level view of live or upcoming games.
- Detailed pages include real-time updates, betting metrics, and interactive charts.

Discrepancy notes (kept intentionally):
- The legacy flow mentions a post-game analysis screen and notifications; current production routes center on `/games`, `/games/[id]`, `/trends`, `/favorites`, and `/account`.
- Search/filter is currently lighter-weight than this legacy diagram suggests.

## State and Data Flow

- `AuthContext` holds token/user and syncs with local storage
- API client (`apps/client/src/lib/api.ts`) wraps backend calls and auth headers
- Page-level state is managed with React hooks and loading/error states
- Shared types imported from `@betwise/shared`

## Key Components/Areas

- Navbar with auth-aware links and logout button
- Games list and detail views
- Trend/sentiment visual components
- Favorites form using league/team dropdown selection
- Account security forms and destructive-action confirmation UI

## UX/Validation Expectations

- Clear loading states on async pages
- Error and success messaging around auth/favorites/account actions
- Restricted pages display login CTA when unauthenticated
- Form validation on required fields and password minimums

## Wireframes

### Homepage Wireframe

Legacy wireframe content:

Description:
The homepage presents an overview of live games, featured matchups, and quick stats.

Wireframe Outline:
- Header: Logo, navigation menu, user icon.
- Main Section:
- Banner/Carousel: Rotating featured games.
- Live Scores Panel: List of current games with scores and minimal betting data.
- Navigation Filters: Options to sort by league/date.
- Footer: Contact info, links to legal and privacy policies.

Sketch:

```txt
_______________________________________
|         BetWise Logo   [Menu] [User]  |
|---------------------------------------|
|   [Carousel / Featured Games Banner]  |
|---------------------------------------|
|  Live Scores:                         |
|  -------------------------------------------------
|  | Game 1 | Score | Odds Summary |  Details  |
|  | Game 2 | Score | Odds Summary |  Details  |
|  | ...                                |
|---------------------------------------|
|    [Filters: Date, League, Team, etc.]|
|---------------------------------------|
|  Footer: Links, Contact, Social Media  |
 ---------------------------------------
```

### Game Detail Wireframe

Legacy wireframe content:

Description:
This page offers a detailed view of a selected game, including live scores, betting odds, and trend analytics.

Wireframe Outline:
- Header: Same as Homepage.
- Game Summary Section:
- Team logos, game time, and current score.
- Betting Data Section:
- Betting odds (spread, moneyline, total).
- Public betting % displayed as graphs or charts.
- Trend Analysis Section:
- Historical performance, outcome vs. betting data.
- Footer: Consistent across pages.

Sketch:

```txt
_______________________________________
|         BetWise Logo   [Menu] [User]  |
|---------------------------------------|
|     [Team A Logo]  vs  [Team B Logo]   |
|         Live Score:  XX - YY          |
|      Game Time, Venue, League info    |
|---------------------------------------|
|  Betting Odds & Public Trends:        |
|  -------------------------------------  |
|  | Spread: -7  | Moneyline: -150    |  |
|  | Public Bets: 75% on Team A         |  |
|  | [Interactive Chart/Graph]          |  |
|---------------------------------------|
|  Trend Analysis & Outcome Prediction  |
|  [Detailed visualization and stats]   |
|---------------------------------------|
|  Footer: Links, Contact, Social Media  |
 ---------------------------------------
```

### Trend Analysis Wireframe

Legacy wireframe content:

Description:
An interactive dashboard where users can view historical data and analyze trends across multiple games.

Wireframe Outline:
- Header: Standard navigation.
- Filter/Selection Panel: Choose teams, leagues, or date ranges.
- Data Visualization Panel:
- Multiple charts or graphs showing trends over time.
- Comparison of public betting vs. game outcomes.
- Summary Panel: Brief insights and key statistics.
- Footer: Standard footer.

Sketch:

```txt
_______________________________________
|         BetWise Logo   [Menu] [User]  |
|---------------------------------------|
|   [Filters: Select League, Team, Date]|
|---------------------------------------|
|     [Chart 1: Public Betting Trends]  |
|     [Chart 2: Outcome vs. Spread]     |
|     [Chart 3: Moneyline Comparison]   |
|---------------------------------------|
|   Summary Insights:                   |
|    - Key Statistics & Analysis        |
|---------------------------------------|
|  Footer: Links, Contact, Social Media  |
 ---------------------------------------
```

## Additional Functionality and Stretch Goals

Legacy stretch-goal content:
- User Notifications:
- Allow users to register for alerts on significant line movement or game updates.
- User Authentication:
- Optional user accounts for saving favorites and personalized notifications.
- Advanced Analytics:
- Incorporate machine learning predictions based on historical trends.
- Interactive Simulations:
- (Stretch) Simulate game outcomes based on real-time data and user-selected parameters.

## Frontend Technical Considerations

- API data latency/loading states
- Responsive design and accessibility
- Chart readability and usability

Legacy technical considerations:
- User Experience:
- Optimize for different devices with a responsive design approach.
- Use accessible chart and data display techniques.

Discrepancy notes (kept intentionally):
- Legacy wireframes show a broader marketing-style layout (banner/footer/legal/social sections); current app prioritizes functional route-driven screens.
- Legacy content references public betting percentages throughout UI; current implementation includes deterministic sentiment/trend modeling and does not expose every legacy metric exactly as sketched.

## Frontend Tests (Current)

- `27` passing tests via `pnpm --filter client test`
- Coverage includes auth context, login/register, favorites page, account page, games page, and shared UI components
