// src/lib/hf-client.ts
// Hugging Face embeddings API wrapper
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

export async function getEmbedding(text: string): Promise<number[] | null> {
  if (!HF_API_TOKEN) return null;
  try {
    const res = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    });
    if (!res.ok) throw new Error('HF API error');
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) return data[0];
    if (Array.isArray(data)) return data;
    return null;
  } catch (e) {
    return null;
  }
}
