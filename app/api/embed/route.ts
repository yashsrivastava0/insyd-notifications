import { NextRequest, NextResponse } from 'next/server';
import { getEmbedding } from '../../../src/lib/hf-client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const embedding = await getEmbedding(text);
    if (!embedding) return NextResponse.json({ error: 'HF embedding unavailable' }, { status: 501 });
    return NextResponse.json({ embedding });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Embedding error' }, { status: 400 });
  }
}
