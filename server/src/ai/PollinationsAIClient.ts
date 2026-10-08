/**
 * Server-side Pollinations client for AI agent decisions.
 * Keep the provider key on the server; never expose it through Vite/client env.
 */
import { aiLogger } from '../logging/index.js';
import { getLLMQueue } from './LLMQueue.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIModelOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface PollinationsAIClientOptions {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

const DEFAULT_BASE_URL = 'https://gen.pollinations.ai';
export const DEFAULT_POLLINATIONS_MODEL_POOL = [
  'openai/gpt-6-luna',
  'nvidia/nemotron-3.5-lightning',
  'minimax/minimax-m3',
  'deepseek/deepseek-v4.1-flash',
  'mistralai/mistral-large-3',
] as const;
const DEFAULT_MODEL = DEFAULT_POLLINATIONS_MODEL_POOL[0];
const DEFAULT_REQUEST_TIMEOUT_MS = 25_000;
const LLM_QUEUE_TIMEOUT_MS = 30_000;

/**
 * POLLINATIONS_MODELS accepts a comma-separated pool override. The singular
 * POLLINATIONS_MODEL remains available to pin the app to one model.
 */
export function getPollinationsModelPool(): string[] {
  const singleModel = process.env.POLLINATIONS_MODEL?.trim();
  if (singleModel) return [singleModel];

  const configured = process.env.POLLINATIONS_MODELS
    ?.split(',')
    .map(model => model.trim())
    .filter(Boolean);
  if (configured && configured.length > 0) return configured;

  return [...DEFAULT_POLLINATIONS_MODEL_POOL];
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export class PollinationsAIClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly fetchImplementation: typeof fetch;

  constructor(options: PollinationsAIClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.POLLINATIONS_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.apiKey = (options.apiKey ?? process.env.POLLINATIONS_API_KEY ?? '').trim();
    this.model = (options.model ?? getPollinationsModelPool()[0] ?? DEFAULT_MODEL).trim();
    this.timeoutMs = options.timeoutMs ?? positiveInteger(
      process.env.POLLINATIONS_TIMEOUT_MS,
      DEFAULT_REQUEST_TIMEOUT_MS
    );
    this.fetchImplementation = options.fetchImplementation ?? globalThis.fetch.bind(globalThis);
  }

  /** Make an OpenAI-compatible Pollinations chat-completions request. */
  async complete(messages: ChatMessage[], options: AIModelOptions = {}): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Pollinations API key is missing. Set POLLINATIONS_API_KEY in the server environment.');
    }

    const model = options.model ?? this.model;
    const payload: Record<string, unknown> = {
      model,
      messages,
      max_tokens: options.maxTokens ?? 200,
      stream: false,
    };
    // GPT-6 Luna does not advertise temperature support in Pollinations' catalog.
    if (model !== 'openai/gpt-6-luna') {
      payload.temperature = options.temperature ?? 0.8;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImplementation(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pollinations API error (${response.status}): ${errorText}`);
      }

      const result = await response.json() as ChatCompletionResponse;
      if (!result.choices || result.choices.length === 0) {
        throw new Error('Pollinations API returned no choices');
      }

      if (result.usage) {
        getLLMQueue(LLM_QUEUE_TIMEOUT_MS).recordTokenUsage(
          result.usage.prompt_tokens ?? 0,
          result.usage.completion_tokens ?? 0
        );
      }

      return result.choices[0].message?.content ?? '';
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Pollinations request timed out after ${this.timeoutMs}ms`);
        }
        aiLogger.error('Pollinations AI API error', { error });
        throw error;
      }
      throw new Error('Unknown error communicating with Pollinations AI');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Queue a decision request so a busy simulation does not flood the provider. */
  async getDecision(
    systemPrompt: string,
    userPrompt: string,
    options?: AIModelOptions
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return getLLMQueue(LLM_QUEUE_TIMEOUT_MS).enqueue(() => this.complete(messages, options));
  }
}
