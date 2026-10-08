import { afterEach, describe, expect, it, vi } from 'vitest';
import { PollinationsAIClient } from '@server/ai/PollinationsAIClient.js';

const messages = [
  { role: 'system' as const, content: 'You are a crewmate.' },
  { role: 'user' as const, content: 'Who looks suspicious?' },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PollinationsAIClient', () => {
  it('sends an authenticated OpenAI-compatible chat completion request', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { role: 'assistant', content: 'Blue looks suspicious.' } }],
        usage: { prompt_tokens: 21, completion_tokens: 5 },
      }), { status: 200 })
    );
    const client = new PollinationsAIClient({
      baseUrl: 'https://gen.pollinations.ai/',
      apiKey: 'pk_test_only',
      model: 'deepseek/deepseek-v4.1-flash',
      fetchImplementation,
    });

    const response = await client.complete(messages, { temperature: 0.3, maxTokens: 80 });

    expect(response).toBe('Blue looks suspicious.');
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImplementation.mock.calls[0];
    expect(url).toBe('https://gen.pollinations.ai/v1/chat/completions');
    expect(init?.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer pk_test_only',
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      model: 'deepseek/deepseek-v4.1-flash',
      messages,
      max_tokens: 80,
      stream: false,
      temperature: 0.3,
    });
  });

  it('omits temperature for GPT-6 Luna, which does not advertise support for it', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { role: 'assistant', content: 'OK' } }],
      }), { status: 200 })
    );
    const client = new PollinationsAIClient({ apiKey: 'pk_test_only', fetchImplementation });

    await client.complete(messages, { model: 'openai/gpt-6-luna', temperature: 0.1 });

    const [, init] = fetchImplementation.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe('openai/gpt-6-luna');
    expect(body).not.toHaveProperty('temperature');
  });

  it('fails clearly without a Pollinations API key and does not send a request', async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    const client = new PollinationsAIClient({ apiKey: '', fetchImplementation });

    await expect(client.complete(messages)).rejects.toThrow(
      'Pollinations API key is missing. Set POLLINATIONS_API_KEY in the server environment.'
    );
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it('includes the provider status and response body on API errors', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('invalid model', { status: 400 })
    );
    const client = new PollinationsAIClient({ apiKey: 'pk_test_only', fetchImplementation });

    await expect(client.complete(messages)).rejects.toThrow(
      'Pollinations API error (400): invalid model'
    );
  });
});
