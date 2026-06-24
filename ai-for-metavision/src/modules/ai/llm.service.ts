import { Injectable, Logger } from '@nestjs/common';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  text: string;
  confidence: number;
  reasoning: string;
  tokensUsed: number;
}

/**
 * LlmService — OpenRouter (və ya OpenAI uyğun) chat completions.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiKey =
    process.env.LLM_PROVIDER === 'openrouter'
      ? process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
      : process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  private readonly model =
    process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || 'openai/gpt-4o-mini';
  private readonly baseUrl =
    process.env.OPENROUTER_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    'https://openrouter.ai/api/v1/chat/completions';

  async complete(messages: LlmMessage[], temperature = 0.7): Promise<LlmResponse> {
    if (!this.apiKey) {
      this.logger.warn('OPENROUTER_API_KEY / OPENAI_API_KEY not set — mock response');
      return this.mockResponse(messages);
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      };
      if (process.env.OPENROUTER_API_KEY) {
        headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        headers['X-Title'] = 'Metavision TasteMind';
      }

      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: this.model, messages, temperature }),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`LLM error: ${res.status} — ${err}`);
        return this.mockResponse(messages);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { total_tokens?: number };
      };
      const text: string = data.choices?.[0]?.message?.content ?? '';
      const tokensUsed: number = data.usage?.total_tokens ?? 0;

      return {
        text,
        confidence: 0.92,
        reasoning: 'LLM inference via OpenRouter',
        tokensUsed,
      };
    } catch (err) {
      this.logger.error('LLM fetch failed', err);
      return this.mockResponse(messages);
    }
  }

  buildSystemPrompt(context: object): LlmMessage {
    return {
      role: 'system',
      content: `You are TasteMind Assistant for Metavision restaurant platform.
Context:
${JSON.stringify(context, null, 2)}

Respond in Azerbaijani when user writes in Azerbaijani. Be concise and data-driven.
Format JSON: { "answer": "...", "confidence": 0.XX, "reasoning": "..." }`,
    };
  }

  private mockResponse(messages: LlmMessage[]): LlmResponse {
    const userMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    return {
      text: JSON.stringify({
        answer: `Sualınız qəbul edildi: "${userMsg.slice(0, 80)}". OpenRouter açarı aktivdirsə real cavab gələcək.`,
        confidence: 0.5,
        reasoning: 'Mock — API açarı yoxlanılmalıdır',
      }),
      confidence: 0.5,
      reasoning: 'Mock response',
      tokensUsed: 0,
    };
  }
}
