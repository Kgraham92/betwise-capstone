# BetWise Rubric Status (Submission Mapping)

This document maps Springboard capstone rubric items to concrete BetWise artifacts in this repository.

## Step Deliverables

| Rubric Step | Status | Submission Artifact |
|---|---|---|
| Step 1: Project Ideas | Complete | `docs/submission/STEP1_PROJECT_IDEAS.md` |
| Step 2: Final Project Proposal | Complete | `docs/submission/STEP2_PROJECT_PROPOSAL.md` |
| Step 3: Frontend Specifications | Complete | `docs/submission/STEP3_FRONTEND_SPEC.md` |
| Step 4: Database Model Planning | Complete | `docs/submission/STEP4_DATABASE_MODEL.md` |
| Step 5: API Planning | Complete | `docs/submission/STEP5_API_SPEC.md` |
| Step 6: Build + Documentation | Complete | `README.md`, `docs/submission/TECHNICAL_DOCUMENTATION.md`, `docs/submission/DEPLOYMENT_CHECKLIST.md` |

## High-Priority Gaps Previously Identified

### 1) Deployment evidence

- Current state: **Addressed**
- Evidence:
  - Frontend live URL: `https://betwise-capstone-client.vercel.app`
  - Backend live URL: `https://betwise-capstone.onrender.com`
  - Health check: `https://betwise-capstone.onrender.com/health`
  - Production smoke test coverage recorded in `docs/submission/DEPLOYMENT_CHECKLIST.md`

### 2) MongoDB CRUD coverage

- Current state: **Addressed**
- Evidence (favorites + account CRUD):
  - `apps/server/src/routes/users.ts`
  - `apps/server/src/controllers/users.ts`
  - `apps/server/src/models/User.ts`
- Additional auth/account updates:
  - `apps/server/src/routes/auth.ts`
  - `apps/server/src/controllers/auth.ts`

### 3) Explicit Step 1/2 artifacts

- Current state: **Addressed**
- Evidence:
  - `docs/submission/STEP1_PROJECT_IDEAS.md`
  - `docs/submission/STEP2_PROJECT_PROPOSAL.md`

### 4) README API/setup mismatch

- Current state: **Addressed in submission README**
- Evidence:
  - `README.md` reflects real setup paths and implemented endpoints
  - Includes `POST /api/auth/logout`
  - Uses query-based sentiment endpoint (`GET /api/sentiment?...`)
  - Uses `apps/server/.env.example` rather than missing root `.env.example`

### 5) Technical documentation drift

- Current state: **Addressed**
- Evidence:
  - `docs/submission/TECHNICAL_DOCUMENTATION.md` describes actual route/model/service layout in current repo

### 6) Stale test/documentation counts

- Current state: **Addressed**
- Evidence:
  - `README.md` records current validated results:
    - server: 51 tests
    - client: 27 tests

## Security and Ops Snapshot

- JWT auth with 24h expiry (`apps/server/src/controllers/auth.ts`)
- Bearer-token auth middleware (`apps/server/src/middleware/auth.ts`)
- Rate limiting (`apps/server/src/middleware/rateLimit.ts`)
- Security headers via helmet/CSP (`apps/server/src/app.ts`)
- Input validation and sanitization (`apps/server/src/validators/*.ts`)
- Security event auditing (`apps/server/src/services/securityAudit.ts`)

## External API Cost-Control Snapshot

- 8-hour cached odds snapshots (`apps/server/src/services/oddsCache.ts`)
- Max refreshes/sport/24h configurable (default 3) (`apps/server/src/config.ts`)
- In-flight refresh coalescing (`apps/server/src/services/oddsCache.ts`)
- Current enabled sports flags default to NBA + NHL (NFL/MLB disabled in env examples)
