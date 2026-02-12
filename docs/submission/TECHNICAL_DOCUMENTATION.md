# BetWise Technical Documentation

## Project Overview

BetWise is a full-stack MERN sports insights application with:

- Next.js frontend for game browsing, trends, authentication, and account management
- Express API backend for auth, user CRUD actions, odds/trends endpoints, and security controls
- MongoDB persistence for users and cached odds snapshots
- Shared workspace contracts for API payloads and frontend/backend type consistency

Core product capabilities:

- auth (`register`, `login`, `logout`, `me`, forgot/reset password)
- game list/detail and trend/sentiment views
- favorites CRUD and account management
- external odds caching with request caps and TTL expiry

## Monorepo Architecture

```txt
betwise-active/
├── apps/
│   ├── client/              # Next.js frontend
│   └── server/              # Express backend
├── packages/
│   └── shared/              # shared types/constants
├── docs/
│   └── submission/          # submission artifacts
├── pnpm-workspace.yaml
└── README.md
```

### Workspace Configuration

- package manager: pnpm workspaces
- workspace paths:
  - `apps/*`
  - `packages/*`

## Runtime System Architecture

```txt
Browser (Next.js Client UI)
        |
        | HTTPS / JSON
        v
Express API (apps/server)
        |
        +----> MongoDB Atlas
        |       - User
        |       - OddsSnapshot (TTL-backed cache)
        |
        +----> External Odds Provider (The Odds API)
```

## Layer Responsibilities

### Frontend (apps/client)

- route rendering and page-level UI state
- auth session state via `AuthContext` + localStorage
- API integration via `src/lib/api.ts`
- protected feature UX (favorites, account, trends/game-trends)

### Backend (apps/server)

- input validation and auth enforcement
- odds fetching, normalization, caching, and trend generation
- user account actions and favorites CRUD
- security headers, rate limiting, and audit logging

### Shared (packages/shared)

- canonical API response types
- sports constants and team lists used across client/server

## Code Structure Maps

### Frontend Structure (high-level)

```txt
apps/client/src/
├── app/
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── games/page.tsx
│   ├── games/[id]/page.tsx
│   ├── trends/page.tsx
│   ├── favorites/page.tsx
│   └── account/page.tsx
├── components/
├── context/
│   └── AuthContext.tsx
└── lib/
    ├── api.ts
    ├── config.ts
    └── types.ts
```

### Backend Structure (high-level)

```txt
apps/server/src/
├── app.ts
├── server.ts
├── config.ts
├── env.ts
├── db.ts
├── routes/
│   ├── auth.ts
│   ├── games.ts
│   ├── trends.ts
│   ├── sentiment.ts
│   └── users.ts
├── controllers/
│   ├── auth.ts
│   └── users.ts
├── models/
│   ├── User.ts
│   └── OddsSnapshot.ts
├── services/
│   ├── oddsApiClient.ts
│   ├── oddsCache.ts
│   ├── oddsNormalize.ts
│   ├── oddsScheduler.ts
│   ├── sentiment.ts
│   └── securityAudit.ts
├── middleware/
│   ├── auth.ts
│   └── rateLimit.ts
└── validators/
    ├── auth.ts
    └── users.ts
```

## Request/Data Flow Diagrams

### Flow A: Games List with Cached Odds

```txt
Client /games page
   -> GET /api/games?sportKey=...
      -> validate sport + feature flag
      -> OddsCacheService.getLatestOrRefresh(key)
         -> if unexpired OddsSnapshot exists: return snapshot payload
         -> else if refreshes in last 24h < cap: fetch external odds + store snapshot
         -> else: return latest cached snapshot (or error if none)
      -> normalize payload to shared BetWiseGame objects
   <- JSON games list
```

### Flow B: Auth + Protected Favorite Mutation

```txt
Client login
   -> POST /api/auth/login
   <- JWT (24h) + user
Client stores token in localStorage

Client add favorite
   -> POST /api/users/me/favorites (Authorization: Bearer <token>)
      -> authMiddleware verifies JWT
      -> accountActionLimiter applies
      -> request body validated/sanitized
      -> user favorite inserted, duplicate checks applied
   <- created favorite payload
```

## API Surface (Current Implementation)

### Health and Base

- `GET /health`
- `GET /api`

### Auth (`/api/auth`)

- `POST /register`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /logout` (auth required)
- `GET /me` (auth required)

### Games (`/api/games`)

- `GET /?sportKey=...`
- `GET /:gameId?sportKey=...`
- `GET /:gameId/trends?sportKey=...` (auth required)
- `GET /:gameId/line-movement?sportKey=...` (auth required)

### Trends/Sentiment

- `GET /api/trends?minPct=...` (auth required)
- `GET /api/sentiment?...` (auth required)

### Users (`/api/users`)

- `GET /me/favorites` (auth required)
- `POST /me/favorites` (auth required)
- `PATCH /me/favorites/:favoriteId` (auth required)
- `DELETE /me/favorites/:favoriteId` (auth required)
- `PATCH /me/password` (auth required)
- `DELETE /me` (auth required)

## Data Model and Schema

### Entity Diagram (Current)

```txt
User (collection)
  _id
  email (unique)
  passwordHash
  favorites[] (embedded)
  resetPasswordTokenHash?
  resetPasswordExpiresAt?
  createdAt, updatedAt

favorites[] subdocument
  _id
  sportKey
  teamKey
  teamName
  label

OddsSnapshot (collection)
  _id
  sportKey
  regions
  markets
  oddsFormat
  fetchedAt
  expiresAt   <-- TTL index
  payload     <-- raw provider payload
  createdAt, updatedAt
```

### Indexing and Query Strategy

- `User.email` unique index for auth identity
- `OddsSnapshot` compound index for latest snapshot lookup by sport/market tuple
- `OddsSnapshot.expiresAt` TTL index for automatic cleanup

### Persistence Notes

- game/trend results are generated from `OddsSnapshot.payload` at read time
- favorites are embedded on user documents for simple account-scoped CRUD

## Authentication and Session Model

- auth model: stateless JWT
- transport: `Authorization: Bearer <token>`
- token lifetime: 24h
- client storage: localStorage (`betwise_token`, `betwise_user`)
- logout behavior:
  - server endpoint logs event and returns success
  - client clears local session state regardless of server response

## Security Architecture

### Request Protection

- `helmet` with restrictive CSP
- `x-powered-by` disabled
- JSON body size limit (`1mb`)
- CORS origin control via environment variable

### Abuse and Auth Controls

- auth limiter for login/register/reset paths
- global API limiter for `/api`
- account action limiter for sensitive user mutations
- JWT middleware for protected endpoints

### Validation and Sanitization

- zod-based schemas for auth and account payloads
- sanitization rules on user inputs (including favorites labels/team fields)

### Security Observability

- structured security event logging (`securityAudit.ts`)
- sensitive events include auth anomalies and account actions

## External API Usage and Cost Control

- odds fetches use `OddsCacheService`
- default snapshot TTL: 8 hours
- hard refresh cap: `ODDS_MAX_REQUESTS_PER_SPORT_PER_24H` (default `3`)
- cap scope: sport + regions + markets + oddsFormat
- in-flight refreshes are deduplicated by key
- fallback behavior: serve latest cached snapshot if cap reached and cache exists

## Sports Coverage and Feature Flags

Config flags:

- `ENABLE_NBA`
- `ENABLE_NFL`
- `ENABLE_NHL`
- `ENABLE_MLB`

Current env examples default to:

- enabled: NBA, NHL
- disabled: NFL, MLB

## User Flows (Current Product)

### Flow 1: Discover Games

1. User opens `/games`
2. User chooses sport
3. User views normalized game cards
4. User opens `/games/[id]` for detail data

### Flow 2: Authenticated Trends

1. User logs in on `/login`
2. User opens `/trends` or game trend route
3. Protected endpoints return trend/sentiment data

### Flow 3: Favorites CRUD

1. User opens `/favorites`
2. User selects league + team from dropdown
3. User adds/removes favorites and edits labels

### Flow 4: Account Security Actions

1. User opens `/account`
2. User changes password or deletes account
3. Backend validates, rate-limits, and audits action

## UI Wireframe Snapshots (Current-State Layout Intent)

### Games Page

```txt
[Navbar: Games | Trends | Favorites | Account]
[Sport Selector]
[Game List Cards]
  - Teams, start time
  - Spread / Moneyline / Total
  - Link to details
```

### Game Detail Page

```txt
[Game Header: Team A vs Team B]
[Consensus Odds Block]
[Trend Availability State]
  - if outside unlock window: message
  - else: sentiment/trend blocks
[Line Movement Visualization]
```

### Favorites Page

```txt
[League Dropdown] [Team Dropdown] [Optional Label] [Add]
[Favorite Items]
  - Team + league
  - Editable label
  - Remove action
```

### Account Page

```txt
[Change Password Form]
[Danger Zone: Delete Account]
[Status/Error Feedback]
```

## Environment and Configuration Strategy

### Environment Files

- `apps/server/.env.example`
- `apps/server/env/development.env.example`
- `apps/server/env/test.env.example`
- `apps/server/env/production.env.example`

### Environment Isolation Protections

- `NODE_ENV`-aware env loading order in `env.ts`
- database name safety checks in `config.ts` reject common prod/non-prod mixups
- explicit `MONGODB_DB_NAME` support for environment separation

## Testing and Quality Status

Validated command set:

- `pnpm --filter @betwise/server lint`
- `pnpm --filter client lint`
- `pnpm --filter @betwise/server test` (`51` passing)
- `pnpm --filter client test` (`27` passing)

Test coverage spans:

- backend API route behavior, auth, rate limits, caching, trends, account actions
- frontend auth context, auth pages, favorites/account pages, games UI components

## Deployment Topology (Target)

```txt
Vercel (apps/client)
  NEXT_PUBLIC_API_URL
        |
        v
Render (apps/server)
  NODE_ENV=production
  CORS_ORIGIN=<vercel-url>
        |
        v
MongoDB Atlas (betwise_prod)
```

Production deployment checklist:

1. deploy backend service
2. configure backend environment variables/secrets
3. deploy frontend project
4. point `NEXT_PUBLIC_API_URL` to backend URL
5. validate protected flows and rate-limit/security behavior
6. update submission docs with final public URLs
