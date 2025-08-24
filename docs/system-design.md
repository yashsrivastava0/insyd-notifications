# System Design — Insyd Notifications

## Overview
A minimal notification system for a social/blog platform, built with Next.js (App Router), Prisma ORM, and Neon Postgres. Optional Hugging Face embeddings for AI ranking.

### Architecture
- **Frontend:** Next.js App Router (TypeScript, minimal Tailwind)
- **Backend:** Next.js API routes (Node.js runtime)
- **DB:** Neon Postgres (pooled)
- **ORM:** Prisma
- **AI:** Hugging Face embeddings (if `HF_API_TOKEN` present), fallback to rule-based

### Data Model
- **User, Follow, Post, Reaction, Notification** (see `prisma/schema.prisma`)
- **Indexes:**
  - Notification: `@@index([userId, createdAt])`, `@@index([userId, read])`

### Event → Notification Flow
- All events (post, like, comment, follow) are handled via `/api/events` and during seeding.
- Fanout-on-write: notifications are created immediately for all recipients.

### AI Ranking
- If `HF_API_TOKEN` is set, notification and user interest embeddings are computed via Hugging Face API.
- If not, fallback to token-overlap (Jaccard) for relevance.
- Recency is always mixed in.
- aiScore = 0.6 * relevance + 0.4 * recency

### Scale Considerations
- For 1M DAUs:
  - Move notification logic to a backend service/worker
  - Use a queue (Bull/Bee/Kafka) for fanout
  - Redis for caching
  - Partitioned/sharded notification store
  - Vector DB for embeddings

### Limitations
- No auth (demo only)
- No mobile/responsive UI
- No caching
- No real-time updates

### Testing Plan
- Seed DB, fetch notifications, mark as read, toggle AI/chrono sort
- API tested via curl and UI

### Deliverables
- [GitHub Repo](<repo-link>)
- [Deployed App](<vercel-link>)
- [README](../README.md)
- [API Spec](../README.md#api-examples)

---

*See README for setup and API usage.*
