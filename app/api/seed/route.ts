import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prismadb';
import { seedDatabase } from '../../../prisma/seed';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Seed error' }, { status: 500 });
  }
}

export async function GET() {
  // For demo: return list of users for dropdown
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  return NextResponse.json({ users });
}
