# Insyd Notifications — Proof of Concept

Lightweight demo of a real-time notification system built with Next.js (App Router), TypeScript, Prisma, and PostgreSQL (Neon). The project includes fast seeding, demo event buttons (post / like / follow), a digest view, and an AI-ranking fallback for prioritizing notifications.

Quick start (local, Windows PowerShell)
```powershell
npm install
npx prisma generate
npm run prisma:seed    # fast demo seed
npm run dev
# open http://localhost:3000
```

How the demo works (short)
- Seed: `npm run prisma:seed` creates demo users, follows, posts, reactions and notifications quickly (bulk insert). Use the reseed button in the UI to re-populate data.
- Demo actions: The Notifications UI has buttons to create a demo post, like, or follow from the currently-selected user. Those actions create DB records and notifications immediately.
- Digest: the Digest page aggregates unread notifications and also shows recent actions performed by the selected user (so follow/like actions appear in the digest right away).

Vercel deployment checklist (essential)
1. Env vars on Vercel:
	- `DATABASE_URL` (required)
	- `HF_API_TOKEN` (optional, only for Hugging Face embeddings/ranking)
2. Build settings:
	- Ensure `prisma generate` runs before the Next.js build. If your project uses a custom install/build step, include `npx prisma generate` in the build hook or add it to `postinstall` in package.json.
3. Prisma production considerations:
	- For serverless hosting (Vercel) we strongly recommend using Prisma Data Proxy or a connection pool (Neon provides pooling), to avoid exhausted DB connections under concurrent builds/requests.
4. Recommended Vercel settings:
	- Set the Node version to a supported LTS (if you pin one), and make sure environment is set to `Production`/`Preview` appropriately.

Verification steps (what I do to confirm a deployment works)
1. Deploy to Vercel with env vars set.
2. Run the seeded flow locally first: seed -> run dev -> open UI -> select a demo user.
3. Click demo actions (Follow / Like / Post) and watch the Notifications panel and Digest — events should appear within a few seconds with accurate relative timestamps.
4. Check server logs for errors (DB connection warnings). If you see connection issues in production, enable Prisma Data Proxy or adjust connection pooling.

Notes and tips
- HF embeddings are optional — if `HF_API_TOKEN` is not set the app falls back to a cheap heuristic for AI ranking, so the app remains functional without external API keys.
- The seed script uses `createMany` for speed; use the slower embedding-enabled path only when you have the HF token and you want richer ranking data.
- If you want me to push these changes to your GitHub repo and create a PR, confirm the branch name. I will create a branch, commit the README, and attempt to push (you may need to allow access or provide the remote if not configured).

If you want, I can also add a short section with exact Vercel build commands and a one-click deploy button next.
