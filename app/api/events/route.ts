import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';

export const runtime = 'nodejs';

function truncate(str: string | undefined, n = 120) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const type = event.type;
    const actorId: string = event.actorId;

    if (!actorId) return NextResponse.json({ error: 'actorId required' }, { status: 400 });

    // new_post: create a post and notify followers
    if (type === 'new_post') {
      const content = event.text || `New post from user ${actorId}`;
      const post = await prisma.post.create({ data: { authorId: actorId, content } });

      // notify followers
      const followers = await prisma.follow.findMany({ where: { followeeId: actorId } });
  const validFollowerIds = followers.map((f: any) => f.followerId).filter(Boolean);
      if (validFollowerIds.length) {
        const existing = await prisma.user.findMany({ where: { id: { in: validFollowerIds } }, select: { id: true } });
  const existingIds = new Set(existing.map((e: any) => e.id));
        const notifs = followers
          .map((f: { followerId: string }) => ({
            userId: f.followerId,
            type: 'new_post',
            actorId,
            objectType: 'post',
            objectId: post.id,
            text: truncate(content, 140)
          }))
          .filter((n: any) => existingIds.has(n.userId));
        if (notifs.length) await prisma.notification.createMany({ data: notifs });
      }
      return NextResponse.json({ ok: true, createdPost: post.id });
    }

    // new_like: like a recent post from targetUserId (if provided), notify post author
    if (type === 'new_like') {
      const targetUserId: string | undefined = event.targetUserId || event.objectId;
      // find a recent post by targetUserId or any recent post
      let post;
      if (targetUserId) {
        post = await prisma.post.findFirst({ where: { authorId: targetUserId }, orderBy: { createdAt: 'desc' } });
      }
      if (!post) {
        post = await prisma.post.findFirst({ orderBy: { createdAt: 'desc' } });
      }
      if (!post) return NextResponse.json({ error: 'No post available to like' }, { status: 400 });

      await prisma.reaction.create({ data: { postId: post.id, userId: actorId, type: 'like' } });
      if (post.authorId !== actorId) {
        await prisma.notification.create({ data: {
          userId: post.authorId,
          type: 'new_like',
          actorId,
          objectType: 'post',
          objectId: post.id,
          text: 'Someone liked your post'
        }});
      }
      return NextResponse.json({ ok: true, likedPost: post.id });
    }

    // new_follow: create follow and notify followee
    if (type === 'new_follow') {
      const followeeId: string | undefined = event.objectId || event.followeeId;
      if (!followeeId) return NextResponse.json({ error: 'followeeId required' }, { status: 400 });
      // create follow if not exists
      await prisma.follow.createMany({ data: [{ followerId: actorId, followeeId }], skipDuplicates: true });
      await prisma.notification.create({ data: {
        userId: followeeId,
        type: 'new_follow',
        actorId,
        objectType: 'user',
        objectId: followeeId,
        text: `Started following you`
      }});
      return NextResponse.json({ ok: true });
    }

    // fallback: store diagnostic event
    await prisma.notification.create({ data: {
      userId: event.userId || actorId,
      type: type || 'unknown',
      actorId,
      objectType: event.objectType || null,
      objectId: event.objectId || null,
      text: event.text || 'event'
    }});
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Event error' }, { status: 400 });
  }
}
