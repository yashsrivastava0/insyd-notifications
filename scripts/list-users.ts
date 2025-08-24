import { prisma } from '../src/lib/prismadb';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  console.log('users:', users);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
