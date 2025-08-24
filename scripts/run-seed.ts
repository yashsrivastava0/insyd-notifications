import { seedDatabase } from '../prisma/seed';

async function main() {
  console.log('Running seed...');
  try {
    const res = await seedDatabase();
    console.log('Seed result:', res);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

main();
