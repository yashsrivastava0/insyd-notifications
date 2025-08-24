import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';
import { computeUserInterestVector, scoreNotificationForUser } from '@/lib/ranker';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get('sort') || 'chrono';
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const where: any = { userId };
  if (unreadOnly) where.read = false;

  let notifications = await prisma.notification.findMany({
    where,
    orderBy: sort === 'chrono' ? { createdAt: 'desc' } : undefined,
    take: limit
  });

  if (sort === 'ai') {
    // If no HF token, avoid expensive embedding calls and fallback to chrono order
    const HF_TOKEN = process.env.HF_API_TOKEN;
    if (!HF_TOKEN) {
      // lightweight heuristic: score by recency + simple type boost
      for (const n of notifications) {
        const recency = Math.exp(-((Date.now() - new Date(n.createdAt).getTime()) / 60000) / 180);
        const typeBoost = n.type === 'new_follow' ? 0.3 : n.type === 'new_post' ? 0.2 : 0.1;
        (n as any).aiScore = 0.6 * typeBoost + 0.4 * recency;
      }
      notifications = notifications.sort((a: any, b: any) => (b.aiScore || 0) - (a.aiScore || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      const userInterest = await computeUserInterestVector(userId);
      const userInterestText = '';
      for (const n of notifications) {
        (n as any).aiScore = await scoreNotificationForUser(n, userInterest, userInterestText);
      }
      notifications = notifications.sort((a: any, b: any) => (b.aiScore || 0) - (a.aiScore || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  // Attach actorName (batch fetch to avoid N+1 queries)
  const actorIds = Array.from(new Set(notifications.map((n: any) => n.actorId).filter(Boolean)));
  const actors = actorIds.length ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } }) : [];
  const actorMap = new Map(actors.map((a: any) => [a.id, a.name]));
  for (const n of notifications) {
    (n as any).actorName = actorMap.get(n.actorId) || String(n.actorId || 'Unknown');
  }

  return NextResponse.json({
  notifications: notifications.map((n: any) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      actorId: n.actorId,
      actorName: (n as any).actorName,
      objectType: n.objectType,
      objectId: n.objectId,
      text: n.text,
      createdAt: n.createdAt,
      read: n.read,
      aiScore: n.aiScore
    })),
    meta: { total: notifications.length }
  });
}
