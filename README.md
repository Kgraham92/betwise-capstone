# BetWise

BetWise is a full-stack MERN capstone project focused on sports betting insights and trend analysis.
It combines real-time odds ingestion, cached data strategy, deterministic sentiment generation, and authenticated user features in a pnpm monorepo.

## Project Overview

BetWise provides:

- game discovery by league/sport
- game detail views with line movement and trend/sentiment context
- protected trend insights and account-aware features
- favorites tracking and account controls

Current implemented product scope:

- auth: register, login, logout, me, forgot password, reset password
- games: list, detail, trends-by-game, line movement history
- trends: aggregated highlight feed
- users: favorites CRUD, password change, delete account

## Monorepo Structure

```txt
betwise/
├── apps/
│   ├── client/              # Next.js frontend
│   └── server/              # Express + TypeScript backend
├── packages/
│   └── shared/              # Shared API types/constants
├── docs/
│   └── submission/          # Submission artifacts
├── pnpm-workspace.yaml
└── README.md
```

## Tech Stack

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4

### Backend

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- Vitest + Supertest

### Shared

- `@betwise/shared` workspace package for shared types and constants

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- MongoDB Atlas database
- The Odds API key

### Install

```bash
pnpm install
```

### Configure Environment Variables

#### Backend (`apps/server/.env`)

```bash
cp apps/server/.env.example apps/server/.env
```

Minimum required backend values:

- `JWT_SECRET`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `ODDS_API_KEY`
- `CORS_ORIGIN`

#### Frontend (`apps/client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Run Locally

From repo root:

```bash
pnpm dev
```

Or per app:

```bash
pnpm --filter client dev
pnpm --filter @betwise/server dev
```

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`

## API Endpoints (Current)

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

### Trends and Sentiment

- `GET /api/trends?minPct=...` (auth required)
- `GET /api/sentiment?...` (auth required, query-based)

### Users (`/api/users`)

- `GET /me/favorites` (auth required)
- `POST /me/favorites` (auth required)
- `PATCH /me/favorites/:favoriteId` (auth required)
- `DELETE /me/favorites/:favoriteId` (auth required)
- `PATCH /me/password` (auth required)
- `DELETE /me` (auth required)

## Data Model Snapshot

Current persisted models:

- `User`
  - auth identity and password hash
  - embedded favorites list
  - password reset token/expiry fields
- `OddsSnapshot`
  - raw provider payload snapshots by sport/market tuple
  - TTL-based expiration and history for line movement

## Sports Coverage

The shared package includes NBA, NFL, NHL, MLB constants.
Current environment examples default to:

- enabled: NBA, NHL
- disabled: NFL, MLB

Control flags:

- `ENABLE_NBA`
- `ENABLE_NFL`
- `ENABLE_NHL`
- `ENABLE_MLB`

## Environment Separation (dev/test/prod)

Server env examples:

- `apps/server/env/development.env.example`
- `apps/server/env/test.env.example`
- `apps/server/env/production.env.example`

Isolation protections:

- `NODE_ENV` aware loading in `apps/server/src/env.ts`
- DB target safety checks in `apps/server/src/config.ts`
- dedicated DB names per environment (`betwise_dev`, `betwise_test`, `betwise_prod`)

## Caching and External API Cost Controls

- Odds snapshots cached in MongoDB (`OddsSnapshot`)
- Snapshot TTL: 8 hours
- Refresh cap defaults to `3` requests per sport per 24h (`ODDS_MAX_REQUESTS_PER_SPORT_PER_24H`)
- Concurrent refresh coalescing prevents duplicate in-flight requests per key
- If cap is reached and cache exists, cached data is served

## Security

- stateless JWT auth (Bearer token)
- token expiry: 24 hours
- bcrypt password hashing
- helmet security headers + CSP
- route-level rate limiting (`authLimiter`, `apiLimiter`, `accountActionLimiter`)
- zod validation/sanitization on auth/account payloads
- structured security event logging for sensitive actions

## Testing

### Commands

```bash
pnpm --filter @betwise/server lint
pnpm --filter client lint
pnpm --filter @betwise/server test
pnpm --filter client test
```

### Current status

- server tests: `51` passing
- client tests: `27` passing

## Submission Documentation

Primary submission docs are in `docs/submission/`:

- `RUBRIC_STATUS.md`
- `STEP1_PROJECT_IDEAS.md`
- `STEP2_PROJECT_PROPOSAL.md`
- `STEP3_FRONTEND_SPEC.md`
- `STEP4_DATABASE_MODEL.md`
- `STEP5_API_SPEC.md`
- `TECHNICAL_DOCUMENTATION.md`
- `DEPLOYMENT_CHECKLIST.md`

## Deployment

Target deployment topology:

- frontend: Vercel
- backend: Render
- database: MongoDB Atlas

Deployment checklist and environment details:

- `docs/submission/DEPLOYMENT_CHECKLIST.md`

Live URLs:

- `CLIENT_DEPLOYMENT_URL=https://betwise-capstone-client.vercel.app`
- `SERVER_DEPLOYMENT_URL=https://betwise-capstone.onrender.com`

## Capstone Alignment

This project is structured to satisfy capstone requirements across:

- MERN stack implementation
- API planning and implementation
- database model planning and CRUD
- frontend planning and user flow
- authentication and authorization
- testing and documentation
