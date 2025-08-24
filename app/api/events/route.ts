import { NextRequest, NextResponse } from 'next/server';
import { handleEvent } from '../../../prisma/seed';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const result = await handleEvent(event);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Event error' }, { status: 400 });
  }
}
