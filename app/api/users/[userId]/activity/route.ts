import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const since = new Date(Date.now() - Math.max(0, days) * 24 * 60 * 60 * 1000);

    const [postsMade, likesMade, followsMade, lastPost, lastLike, lastFollow] = await Promise.all([
      prisma.post.count({ where: { authorId: userId, createdAt: { gte: since } } }),
      prisma.reaction.count({ where: { userId: userId, type: 'like', createdAt: { gte: since } } }),
      prisma.follow.count({ where: { followerId: userId, createdAt: { gte: since } } }),
      prisma.post.findFirst({ where: { authorId: userId, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      prisma.reaction.findFirst({ where: { userId: userId, type: 'like', createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      prisma.follow.findFirst({ where: { followerId: userId, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    ]);

    return NextResponse.json({
      postsMade,
      likesMade,
      followsMade,
      lastPostAt: lastPost?.createdAt || null,
      lastLikeAt: lastLike?.createdAt || null,
      lastFollowAt: lastFollow?.createdAt || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Activity error' }, { status: 500 });
  }
}
