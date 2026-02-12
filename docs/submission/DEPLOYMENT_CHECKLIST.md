# Deployment Checklist (Submission)

This checklist tracks the final deployment requirement before capstone submission handoff.

## Status

- Frontend deployment URL: `<pending>`
- Backend deployment URL: `<pending>`

## Target Platforms

- Frontend: Vercel
- Backend: Render (or equivalent)
- Database: MongoDB Atlas (production database only)

## Required Environment Variables

## Frontend

- `NEXT_PUBLIC_API_URL=<backend-url>`

## Backend

- `NODE_ENV=production`
- `PORT`
- `JWT_SECRET`
- `MONGODB_URI`
- `MONGODB_DB_NAME=betwise_prod`
- `CORS_ORIGIN=<frontend-url>`
- `ODDS_API_KEY`
- `ODDS_API_BASE_URL`
- `ODDS_MAX_REQUESTS_PER_SPORT_PER_24H=3`
- `ENABLE_NBA`
- `ENABLE_NFL=false`
- `ENABLE_NHL`
- `ENABLE_MLB=false`

## Verification Checklist

1. `/health` returns `{ ok: true }` in production
2. auth/register/login/logout/me flows work against production backend
3. protected routes reject missing/invalid token
4. favorites CRUD works end-to-end in production
5. trends/games endpoints return data for enabled sports
6. lint and test suites pass on final release branch

