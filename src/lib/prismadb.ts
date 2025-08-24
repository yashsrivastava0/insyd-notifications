// src/lib/prismadb.ts
// Prisma client singleton for serverless environments
import pkg from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { PrismaClient } = (pkg as any);

const globalForPrisma = globalThis as unknown as { prisma: any | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // reduce logging noise in dev to improve performance
    log: ['warn', 'error']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
