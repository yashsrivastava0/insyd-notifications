// src/lib/ranker.ts
import { prisma } from './prismadb';
import { getEmbedding } from './hf-client';

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

function jaccard(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\W+/));
  const setB = new Set(b.toLowerCase().split(/\W+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size ? intersection.size / union.size : 0;
}

export async function computeUserInterestVector(userId: string): Promise<number[] | null> {
  // Fetch last 20 posts the user reacted to
  const reactions = await prisma.reaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { post: true }
  });
  const texts = reactions.map(r => r.post.content).filter(Boolean);
  const vectors: number[][] = [];
  for (const text of texts) {
    const embedding = await getEmbedding(text);
    if (embedding) vectors.push(embedding);
  }
  if (vectors.length === 0) return null;
  // Average vectors
  const dim = vectors[0].length;
  const avg = Array(dim).fill(0);
  for (const v of vectors) for (let i = 0; i < dim; i++) avg[i] += v[i];
  for (let i = 0; i < dim; i++) avg[i] /= vectors.length;
  return avg;
}

export async function scoreNotificationForUser(notification: any, userInterestVector: number[] | null, userInterestText: string): Promise<number> {
  // Recency: exp(-minutesSince/tau)
  const tau = 180;
  const minutesSince = (Date.now() - new Date(notification.createdAt).getTime()) / 60000;
  const recencyScore = Math.exp(-minutesSince / tau);
  let relevance = 0;
  if (userInterestVector && notification.meta?.embedding) {
    relevance = cosineSimilarity(notification.meta.embedding, userInterestVector);
    // Normalize to 0..1
    relevance = (relevance + 1) / 2;
  } else if (userInterestText) {
    relevance = jaccard(notification.text, userInterestText);
  }
  return 0.6 * relevance + 0.4 * recencyScore;
}

export { cosineSimilarity, jaccard };
