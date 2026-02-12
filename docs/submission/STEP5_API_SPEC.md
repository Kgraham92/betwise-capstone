# Step 5: API Specifications

Base URL (local): `http://localhost:3001`

## System Architecture Diagram

### Legacy Planning Addendum: System Architecture Diagram

Description:
This diagram illustrates how the different components of BetWise interact. The architecture is built using a full-stack approach with separate layers for the frontend, backend, and database, with third-party API integrations for real-time sports data.

Diagram Outline (Sample ASCII Diagram):

```txt
              +-----------------------+
               |      Client Device    |
               | (Desktop/Mobile Browser)|
               +-----------+-----------+
                           |
                           | HTTPS Requests
                           |
               +-----------v-----------+
               |   Frontend (React)    |
               +-----------+-----------+
                           |
                           | API Calls (Axios)
                           |
               +-----------v-----------+
               |    Backend (Node.js/  |
               |     Express.js)       |
               +-----------+-----------+
                           |
         +-----------------+-----------------+
         |                                   |
+--------v---------+                +--------v--------+
|  Third-party     |                |     MongoDB     |
|  Sports Data API |                |    (Database)   |
| (Odds, Scores,   |                |                |
|  Public Betting) |                +-----------------+
+------------------+
```

Notes:
- Client Device: Represents browsers on desktops or smartphones accessing the app.
- Frontend: Built with React, provides the UI for interacting with live data and visualizations.
- Backend: Manages API calls to external sports data providers, processes the data, and serves it to the frontend.
- Database: MongoDB stores historical data and user preferences.
- Third-party APIs: Supply real-time sports scores, odds, and betting trends.

Discrepancy notes (kept intentionally):
- Legacy diagram names plain React + Axios; current implementation uses Next.js (React) on frontend and a shared workspace package for types.
- Legacy diagram references live score/public betting feeds broadly; current backend is centered on configured odds provider and deterministic sentiment generation from normalized odds snapshots.

## End-to-End Data Flow

Legacy flow notes:
- Client sends HTTPS requests to frontend/backend stack.
- Backend fetches third-party sports data and interacts with MongoDB persistence layer.
- Frontend consumes processed API responses for display and interaction.

## Auth API (`/api/auth`)

## `POST /api/auth/register`

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response: JWT token + user object.

## `POST /api/auth/login`

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response: JWT token + user object.

## `POST /api/auth/forgot-password`

Request body:

```json
{
  "email": "user@example.com"
}
```

Response:
- Always returns a generic message
- In non-production envs includes temporary `resetToken`

## `POST /api/auth/reset-password`

Request body:

```json
{
  "token": "reset-token",
  "newPassword": "newPassword123"
}
```

Response: success message.

## `POST /api/auth/logout` (protected)

Headers:
- `Authorization: Bearer <token>`

Response: success message.

## `GET /api/auth/me` (protected)

Headers:
- `Authorization: Bearer <token>`

Response: authenticated user identity.

## Games API (`/api/games`)

## `GET /api/games?sportKey=<sportKey>`

Returns normalized games for a sport.

## `GET /api/games/:gameId?sportKey=<sportKey>`

Returns one game from the latest normalized snapshot.

## `GET /api/games/:gameId/trends?sportKey=<sportKey>` (protected)

Returns:
- `splitsAvailable=false` if outside 48-hour unlock window
- otherwise game + generated sentiment payload

## `GET /api/games/:gameId/line-movement?sportKey=<sportKey>` (protected)

Returns historical line/sentiment points reconstructed from snapshot history.

## Trends and Sentiment

## `GET /api/trends?minPct=<number>` (protected)

Aggregates highlighted trends across enabled sports.

## `GET /api/sentiment?...` (protected)

Required query params:
- `gameId`
- `homeTeam`
- `awayTeam`

Optional query params:
- `spread`
- `total`
- `mlHome`
- `mlAway`
- `impliedProbHome`

Returns generated sentiment object.

## Users API (`/api/users`) (all protected)

Headers for all endpoints:
- `Authorization: Bearer <token>`

## `GET /api/users/me/favorites`

Returns current user favorites list.

## `POST /api/users/me/favorites`

Request body:

```json
{
  "sportKey": "basketball_nba",
  "teamKey": "boston-celtics",
  "teamName": "Boston Celtics",
  "label": "My lock"
}
```

Response: created favorite.

## `PATCH /api/users/me/favorites/:favoriteId`

Request body (partial):

```json
{
  "teamName": "Boston Celtics",
  "label": "Updated label"
}
```

Response: updated favorite.

## `DELETE /api/users/me/favorites/:favoriteId`

Response: `204 No Content`.

## `PATCH /api/users/me/password`

Request body:

```json
{
  "currentPassword": "oldPass123",
  "newPassword": "newPass123"
}
```

Response: success message.

## `DELETE /api/users/me`

Deletes the authenticated user account.
Response: `204 No Content`.

## Global Middleware/Behavior

- JSON body parsing
- CORS with configured origin
- helmet security headers
- API rate limiting
- JWT auth guard for protected routes
- Zod validation for auth/account payloads

## API Challenges and Mitigations

- Rate limits, caching strategy, and scheduled pulls
- Third-party data consistency and fallback handling

Legacy technical considerations:
- API Challenges:
- Prepare for potential rate limits by implementing caching and scheduled pulls.
- Validate data consistency between multiple sources.

## Security and Privacy Considerations

- Environment variable and secret management
- Auth/access control boundaries
- Sensitive logging and data exposure controls

Legacy security considerations:
- Secure API keys and sensitive user data using environmental variables and secure authentication.

## Stretch API Functionality (Optional)

Legacy stretch-goal content:
- User Notifications:
- Allow users to register for alerts on significant line movement or game updates.
- User Authentication:
- Optional user accounts for saving favorites and personalized notifications.
- Advanced Analytics:
- Incorporate machine learning predictions based on historical trends.
- Interactive Simulations:
- (Stretch) Simulate game outcomes based on real-time data and user-selected parameters.
