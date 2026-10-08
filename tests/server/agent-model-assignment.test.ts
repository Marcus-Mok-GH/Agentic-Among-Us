import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIDecisionService } from '@server/ai/AIDecisionService.js';
import {
  DEFAULT_POLLINATIONS_MODEL_POOL,
  getPollinationsModelPool,
} from '@server/ai/PollinationsAIClient.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Pollinations agent model assignment', () => {
  it('uses the reference repository’s five-model default pool', () => {
    vi.stubEnv('POLLINATIONS_MODELS', '');
    vi.stubEnv('POLLINATIONS_MODEL', '');

    expect(getPollinationsModelPool()).toEqual([
      'openai/gpt-6-luna',
      'nvidia/nemotron-3.5-lightning',
      'minimax/minimax-m3',
      'deepseek/deepseek-v4.1-flash',
      'mistralai/mistral-large-3',
    ]);
    expect(DEFAULT_POLLINATIONS_MODEL_POOL).toHaveLength(5);
  });

  it('allows a configured comma-separated pool override', () => {
    vi.stubEnv('POLLINATIONS_MODELS', 'provider/model-a, provider/model-b');
    vi.stubEnv('POLLINATIONS_MODEL', '');

    expect(getPollinationsModelPool()).toEqual(['provider/model-a', 'provider/model-b']);
  });

  it('keeps an agent on the same randomly assigned model across service instances', () => {
    vi.stubEnv('POLLINATIONS_MODELS', '');
    vi.stubEnv('POLLINATIONS_MODEL', '');
    const agentId = `model-assignment-test-${Date.now()}-${Math.random()}`;
    const firstService = new AIDecisionService();
    const secondService = new AIDecisionService();

    const assignedModel = firstService.getModelForAgent(agentId);

    expect(DEFAULT_POLLINATIONS_MODEL_POOL).toContain(assignedModel);
    expect(firstService.getModelForAgent(agentId)).toBe(assignedModel);
    expect(secondService.getModelForAgent(agentId)).toBe(assignedModel);
  });

  it('allows the next match to draw again from its configured pool', () => {
    const agentId = `model-reset-test-${Date.now()}-${Math.random()}`;
    vi.stubEnv('POLLINATIONS_MODEL', 'provider/model-before-reset');
    const firstService = new AIDecisionService();
    expect(firstService.getModelForAgent(agentId)).toBe('provider/model-before-reset');

    AIDecisionService.resetAgentModelAssignments();
    vi.stubEnv('POLLINATIONS_MODEL', 'provider/model-after-reset');
    const nextMatchService = new AIDecisionService();
    expect(nextMatchService.getModelForAgent(agentId)).toBe('provider/model-after-reset');
  });
});
