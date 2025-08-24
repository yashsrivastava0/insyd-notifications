import { PrismaClient, Prisma } from '@prisma/client';
import { getEmbedding } from '../src/lib/hf-client';

const prisma = new PrismaClient();

// Demo users with roles and personalities for better interaction
const DEMO_USERS = [
  { name: 'Alice', role: 'Tech Lead', bio: 'Full-stack developer passionate about clean code' },
  { name: 'Bob', role: 'Designer', bio: 'UI/UX designer with an eye for detail' },
  { name: 'Charlie', role: 'Product Manager', bio: 'Turning ideas into reality' },
  { name: 'Diana', role: 'Marketing', bio: 'Digital marketing specialist' },
  { name: 'Eve', role: 'Developer', bio: 'Backend developer extraordinaire' },
  { name: 'Frank', role: 'Content Creator', bio: 'Creating engaging content daily' },
  { name: 'Grace', role: 'Developer', bio: 'Frontend specialist focusing on React' },
  { name: 'Henry', role: 'DevOps', bio: 'Automation and infrastructure expert' },
  { name: 'Ivy', role: 'QA Engineer', bio: 'Finding bugs before they find you' },
  { name: 'Jack', role: 'Developer', bio: 'Full-stack developer who loves TypeScript' }
] as const;

interface Follow {
  followerId: string;
  followeeId: string;
}

export async function seedDatabase(options?: { fast?: boolean }) {
  const fast = options?.fast ?? true;
  console.log('🌱 Starting database seed... (fast=', fast, ')');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.notification.deleteMany({});
    await prisma.reaction.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.follow.deleteMany({});
    await prisma.user.deleteMany({});

    // Create users (bulk)
    console.log('Creating users...');
    const userCreates = DEMO_USERS.map(u => ({ name: u.name, bio: `${u.role} - ${u.bio}` }));
    await prisma.user.createMany({ data: userCreates, skipDuplicates: true });
  const users: Array<{ id: string; name: string; bio?: string | null }> = await prisma.user.findMany({ select: { id: true, name: true, bio: true } });
    console.log(`Created ${users.length} users`);

    // Create follows (bulk)
    console.log('Creating follow relationships...');
  const followRows: Array<{ followerId: string; followeeId: string }> = [];
    for (const user of users) {
      const numFollows = Math.floor(Math.random() * 3) + 2; // 2-4
      const others = users.filter((u) => u.id !== user.id);
      for (let i = 0; i < numFollows; i++) {
        const other = others[Math.floor(Math.random() * others.length)];
        if (!followRows.some(f => f.followerId === user.id && f.followeeId === other.id)) {
          followRows.push({ followerId: user.id, followeeId: other.id });
        }
      }
    }
    if (followRows.length) await prisma.follow.createMany({ data: followRows, skipDuplicates: true });
    console.log(`Created ${followRows.length} follow relationships`);

    // Create posts (bulk) - keep counts moderate for speed
    console.log('Creating posts...');
  const postRows: Array<{ authorId: string; content: string }> = [];
    for (const user of users) {
      const numPosts = Math.floor(Math.random() * 2) + 1; // 1-2 posts each for speed
      for (let i = 0; i < numPosts; i++) {
        const content = generatePostContent(user.name, user.bio || null);
        postRows.push({ authorId: user.id, content });
      }
    }
    if (postRows.length) await prisma.post.createMany({ data: postRows });
  const posts: Array<{ id: string; authorId: string; content: string }> = await prisma.post.findMany({ select: { id: true, authorId: true, content: true } });
  console.log(`Created ${posts.length} posts`);

    // Create reactions (bulk)
    console.log('Creating reactions...');
    const reactionRows: Array<{ postId: string; userId: string; type: string; text?: string }> = [];
    for (const post of posts) {
      const reactors = users.filter((u) => u.id !== post.authorId);
      const numReactions = Math.floor(Math.random() * 2) + 0; // 0-1 reaction per post for speed
      for (let i = 0; i < numReactions; i++) {
        const reactor = reactors[Math.floor(Math.random() * reactors.length)];
        const type = Math.random() < 0.7 ? 'like' : 'comment';
        reactionRows.push({ postId: post.id, userId: reactor.id, type, text: type === 'comment' ? generateComment() : undefined });
      }
    }
    if (reactionRows.length) await prisma.reaction.createMany({ data: reactionRows });
    console.log(`Created ${reactionRows.length} reactions`);

    // Create notifications in bulk
    console.log('Creating notifications...');
    const notificationRows: Array<any> = [];

    // follow notifications
    for (const f of followRows) {
      notificationRows.push({ userId: f.followeeId, type: 'new_follow', actorId: f.followerId, objectType: 'user', objectId: f.followeeId, text: `Someone started following you.` });
    }

    // post notifications: notify followers of each post's author
    const followsByFollowee = await prisma.follow.findMany();
    const followersMap = new Map<string, string[]>();
    for (const f of followsByFollowee) {
      if (!followersMap.has(f.followeeId)) followersMap.set(f.followeeId, []);
      followersMap.get(f.followeeId)!.push(f.followerId);
    }

    for (const post of posts) {
      const followers = followersMap.get(post.authorId) || [];
      for (const followerId of followers) {
        notificationRows.push({ userId: followerId, type: 'new_post', actorId: post.authorId, objectType: 'post', objectId: post.id, text: `${truncate(post.content, 60)}` });
      }
    }

    // reactions notifications: notify post author for reactions
    const reactions: Array<{ id: string; postId: string; userId: string; type: string; text?: string | null }> = await prisma.reaction.findMany({ select: { id: true, postId: true, userId: true, type: true, text: true } });
    const postById = new Map<string, { id: string; authorId: string; content: string }>(posts.map((p) => [p.id, p]));
    for (const r of reactions) {
      const post = postById.get(r.postId);
      if (post && post.authorId !== r.userId) {
        notificationRows.push({ userId: post.authorId, type: r.type === 'like' ? 'new_like' : 'new_comment', actorId: r.userId, objectType: r.type === 'like' ? 'post' : 'comment', objectId: post.id, text: r.type === 'like' ? 'Someone liked your post' : `${truncate(r.text || '', 60)}` });
      }
    }

    // Bulk create notifications. Skip embeddings in fast mode.
    if (notificationRows.length) {
      if (fast) {
        await prisma.notification.createMany({ data: notificationRows });
      } else {
        // slower path: call getEmbedding per notification
        for (const n of notificationRows) {
          await createNotification(n);
        }
      }
    }

    const stats = {
      users: users.length,
      follows: followRows.length,
      posts: posts.length,
      reactions: reactionRows.length,
      notifications: await prisma.notification.count()
    };

    console.log('✅ Seed completed successfully', stats);
    return stats;
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

async function createNotification(data: {
  userId: string;
  type: string;
  actorId: string;
  objectType: string;
  objectId: string;
  text: string;
}) {
  let embedding = null;
  try {
    embedding = await getEmbedding(data.text);
  } catch (error) {
    console.warn('Failed to generate embedding:', error);
  }

  return prisma.notification.create({
    data: {
      ...data,
      meta: embedding ? { embedding } : undefined
    }
  });
}

function generatePostContent(userName: string, userBio: string | null): string {
  const topics = [
    'Just finished a new feature! 🚀',
    'Thoughts on modern web development...',
    'Excited to share my latest project!',
    'Team collaboration at its best 🤝',
    'Learning something new today:',
    'Quick tip for fellow developers:'
  ];

  const topic = topics[Math.floor(Math.random() * topics.length)];
  return `${topic} #coding #tech #development`;
}

function generateComment(): string {
  const comments = [
    'Great work! 👏',
    'This is impressive!',
    'Thanks for sharing!',
    'Interesting perspective 🤔',
    'Looking forward to more!',
    'Really helpful, thanks!'
  ];

  return comments[Math.floor(Math.random() * comments.length)];
}

function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

// For ES module: run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(r => {
      console.log('Seeded:', r);
      process.exit(0);
    })
    .catch(e => {
      console.error('Seed error:', e);
      process.exit(1);
    });
}



