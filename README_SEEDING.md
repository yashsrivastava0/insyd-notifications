# Seeding the database (local)

This project uses Prisma. To populate demo users, posts and notifications:

1. Install dependencies:

```ps1
npm install
```

2. Generate Prisma client (if needed):

```ps1
npx prisma generate
```

3. Run the seed script (recommended):

```ps1
npm run prisma:seed
```

This runs `scripts/run-seed.ts` which calls the `seedDatabase` function and prints counts.

4. Verify users exist (quick check):

```ps1
npx tsx scripts/list-users.ts
```

5. Start dev server:

```ps1
npm run dev
```

Then open the app and use the "Reseed Data" button in the demo user selector or choose a user to see notifications.

One-click (Windows PowerShell):

1. Run the included helper to seed + start dev server:

```powershell
.\run-dev.ps1
```

This will ensure dependencies are installed, run the fast seed, and launch the dev server.
