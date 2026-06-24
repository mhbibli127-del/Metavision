import { Injectable, Logger } from '@nestjs/common';

export interface EmbeddingRecord {
  id: string;
  text: string;
  vector: number[];
}

/**
 * EmbeddingService — vector store abstraction.
 * Structured for Pinecone / Weaviate. Uses in-memory mock when EMBEDDING_API_KEY absent.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey =
    process.env.EMBEDDING_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  private readonly embedUrl =
    process.env.OPENROUTER_EMBED_URL ||
    process.env.OPENAI_EMBED_URL ||
    'https://openrouter.ai/api/v1/embeddings';
  private readonly embedModel = process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';

  // In-memory mock vector store (replace with Pinecone client in production)
  private readonly store = new Map<string, EmbeddingRecord>();

  async embed(text: string): Promise<number[]> {
    if (!this.apiKey) {
      return this.mockVector(text);
    }

    try {
      const res = await fetch(this.embedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...(process.env.OPENROUTER_API_KEY
            ? {
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                'X-Title': 'Metavision TasteMind',
              }
            : {}),
        },
        body: JSON.stringify({ model: this.embedModel, input: text }),
      });

      const data: any = await res.json();
      return data.data?.[0]?.embedding ?? this.mockVector(text);
    } catch {
      return this.mockVector(text);
    }
  }

  async upsert(id: string, text: string): Promise<void> {
    const vector = await this.embed(text);
    this.store.set(id, { id, text, vector });
  }

  async query(text: string, topK = 5): Promise<EmbeddingRecord[]> {
    const queryVec = await this.embed(text);
    const scored = Array.from(this.store.values()).map((record) => ({
      record,
      score: this.cosineSimilarity(queryVec, record.vector),
    }));
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => s.record);
  }

  private mockVector(text: string): number[] {
    const seed = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return Array.from({ length: 64 }, (_, i) => Math.sin(seed + i) * 0.5 + 0.5);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] ?? 0), 0);
    const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return magA && magB ? dot / (magA * magB) : 0;
  }
}
