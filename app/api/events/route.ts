import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prismadb';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    // Handle event inline (lightweight) to avoid export coupling with seed
    // Very small subset of behavior: create follow/post/reaction notifications
    // For now, just persist a diagnostic record
    await prisma.notification.create({
      data: {
        userId: event.userId || '',
        type: event.type || 'unknown',
        actorId: event.actorId || '',
        objectType: event.objectType || null,
        objectId: event.objectId || null,
        text: event.text || 'event'
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Event error' }, { status: 400 });
  }
}
