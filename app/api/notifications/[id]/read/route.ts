import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Not found' }, { status: 404 });
  }
}
