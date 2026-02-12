# Step 4: Database Model Planning

## Database Technology

- MongoDB Atlas
- Mongoose ODM

## Current Collections/Models

## `User`

Defined in `apps/server/src/models/User.ts`.

### Fields

- `email` (string, required, unique, lowercase, trimmed)
- `passwordHash` (string, required)
- `favorites` (array of subdocuments)
- `resetPasswordTokenHash` (string, optional)
- `resetPasswordExpiresAt` (date, optional)
- timestamps (`createdAt`, `updatedAt`)

### Favorite subdocument

- `_id` (ObjectId)
- `sportKey` (string, required)
- `teamKey` (string, required, normalized)
- `teamName` (string, required)
- `label` (string, optional, defaults to empty)

## `OddsSnapshot`

Defined in `apps/server/src/models/OddsSnapshot.ts`.

### Fields

- `sportKey` (string, indexed)
- `regions` (string)
- `markets` (string)
- `oddsFormat` (`american | decimal`)
- `fetchedAt` (date, indexed)
- `expiresAt` (date, TTL-indexed)
- `payload` (mixed/raw API payload)
- timestamps (`createdAt`, `updatedAt`)

### Indexes

- compound latest-snapshot lookup index:
  - `sportKey + regions + markets + fetchedAt(desc)`
- TTL index on `expiresAt`

## Database Schema Diagram

### Legacy Planning Addendum: Database Schema Diagram

Description:
This diagram details the MongoDB collections (or tables in relational databases) with relationships to capture the necessary data for games, betting odds, and trends analysis.

Diagram Outline (Conceptual Diagram):

```txt
         +----------------+
          |    Games       |
          +----------------+
          | _id            |
          | home_team      |
          | away_team      |
          | start_time     |
          | league         |
          | score_home     |
          | score_away     |
          +-------+--------+
                  |
                  |  One-to-Many (game_id)
                  v
          +----------------+
          |     Odds       |
          +----------------+
          | _id            |
          | game_id (ref)  |
          | spread         |
          | moneyline      |
          | total          |
          | public_bets    |
          | timestamp      |
          +----------------+

          +----------------+
          |    Trends      |
          +----------------+
          | _id            |
          | game_id (ref)  |
          | result_vs_spread|
          | result_vs_total|
          | result_vs_moneyline|
          +----------------+
```

Notes:
- The Games collection stores details about each game.
- The Odds collection links to Games via a reference field (game_id) and holds live betting data.
- The Trends collection stores the analyzed outcome compared to the betting odds.

## Relationship Model

- One `User` has many embedded `favorites`
- `OddsSnapshot` documents are independent event snapshots by sport/market tuple
- No direct foreign-key links between `User` and `OddsSnapshot`

## Collection Relationships

Legacy relationship notes:
- Games -> Odds is one-to-many via `game_id`.
- Games -> Trends is one-to-many via `game_id`.

Discrepancy notes (kept intentionally):
- Current implementation persists `User` and `OddsSnapshot` models; it does not currently persist standalone `Games`, `Odds`, and `Trends` collections with direct `game_id` relations.
- Trend outputs are generated on request from normalized snapshot data, rather than stored as a dedicated Trends collection.

## CRUD Support (Rubric Alignment)

- Create: register user, create favorite, create snapshots
- Read: auth me, favorites list, games/trends/history reads
- Update: favorite label/team name update, password reset/change
- Delete: favorite removal, delete own account, TTL expiration of old snapshots

## Environment Separation

Configured in `apps/server/src/config.ts` and env examples:
- `betwise_dev`
- `betwise_test`
- `betwise_prod`

Safety checks prevent obvious non-prod/prod DB mixups based on `NODE_ENV`.

## Data Integrity and Consistency Considerations

Legacy technical considerations:
- Validate data consistency between multiple sources.
- Prepare for potential rate limits by implementing caching and scheduled pulls.

## Database Scaling Considerations

Legacy scaling considerations:
- Ensure backend and database can handle real-time data ingestion and concurrent user access.
