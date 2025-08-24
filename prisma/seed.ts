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

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.notification.deleteMany({});
    await prisma.reaction.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.follow.deleteMany({});
    await prisma.user.deleteMany({});

    // Create users
    console.log('Creating users...');
    const users = await Promise.all(
      DEMO_USERS.map(user => 
        prisma.user.create({
          data: {
            name: user.name,
            bio: `${user.role} - ${user.bio}`
          }
        })
      )
    );
    console.log(`Created ${users.length} users`);

    // Create follows - each user follows 2-4 random others
    console.log('Creating follow relationships...');
    const follows: Follow[] = [];
    for (const user of users) {
      const numFollows = Math.floor(Math.random() * 3) + 2; // 2-4 follows
      const otherUsers = users.filter(u => u.id !== user.id);
      
      for (let i = 0; i < numFollows; i++) {
        const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        
        // Check if this follow relationship already exists
        if (!follows.some(f => f.followerId === user.id && f.followeeId === randomUser.id)) {
          follows.push({ followerId: user.id, followeeId: randomUser.id });
          
          await prisma.follow.create({
            data: { followerId: user.id, followeeId: randomUser.id }
          });

          // Create follow notification
          await createNotification({
            userId: randomUser.id,
            type: 'new_follow',
            actorId: user.id,
            objectType: 'user',
            objectId: randomUser.id,
            text: `${user.name} started following you.`
          });
        }
      }
    }
    console.log(`Created ${follows.length} follow relationships`);

    // Create posts - each user creates 2-5 posts
    console.log('Creating posts...');
    const posts = [];
    for (const user of users) {
      const numPosts = Math.floor(Math.random() * 4) + 2; // 2-5 posts
      for (let i = 0; i < numPosts; i++) {
        const content = generatePostContent(user.name, user.bio);
        const post = await prisma.post.create({
          data: { authorId: user.id, content }
        });
        posts.push(post);

        // Notify followers about the new post
        const followers = await prisma.follow.findMany({
          where: { followeeId: user.id }
        });

        for (const follower of followers) {
          await createNotification({
            userId: follower.followerId,
            type: 'new_post',
            actorId: user.id,
            objectType: 'post',
            objectId: post.id,
            text: `${user.name} published: ${truncate(content, 60)}`
          });
        }
      }
    }
    console.log(`Created ${posts.length} posts`);

    // Create reactions (likes and comments)
    console.log('Creating reactions...');
    const reactions = [];
    for (const post of posts) {
      const numReactions = Math.floor(Math.random() * 3) + 1; // 1-3 reactions per post
      const potentialReactors = users.filter(u => u.id !== post.authorId);

      for (let i = 0; i < numReactions; i++) {
        const reactor = potentialReactors[Math.floor(Math.random() * potentialReactors.length)];
        const type = Math.random() < 0.7 ? 'like' : 'comment';
        const text = type === 'comment' ? generateComment() : undefined;

        const reaction = await prisma.reaction.create({
          data: {
            postId: post.id,
            userId: reactor.id,
            type,
            text
          }
        });
        reactions.push(reaction);

        // Create notification for the post author
        await createNotification({
          userId: post.authorId,
          type: `new_${type}`,
          actorId: reactor.id,
          objectType: type === 'like' ? 'post' : 'comment',
          objectId: post.id,
          text: type === 'like' 
            ? `${reactor.name} liked your post`
            : `${reactor.name} commented on your post: ${truncate(text || '', 60)}`
        });
      }
    }
    console.log(`Created ${reactions.length} reactions`);

    console.log('✅ Seed completed successfully');
    return {
      users: users.length,
      follows: follows.length,
      posts: posts.length,
      reactions: reactions.length,
      notifications: await prisma.notification.count()
    };

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



