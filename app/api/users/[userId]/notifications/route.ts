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
    take: limit,
    include: { user: true }
  });

  if (sort === 'ai') {
    const userInterest = await computeUserInterestVector(userId);
    const userInterestText = '';
    for (const n of notifications) {
      n.aiScore = await scoreNotificationForUser(n, userInterest, userInterestText);
    }
  notifications = notifications.sort((a: any, b: any) => (b.aiScore || 0) - (a.aiScore || 0) || b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Attach actorName
  for (const n of notifications) {
    const actor = await prisma.user.findUnique({ where: { id: n.actorId } });
    (n as any).actorName = actor?.name || n.actorId;
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
