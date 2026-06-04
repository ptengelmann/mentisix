import { Injectable } from '@nestjs/common';
import { AGENT_ACTION_TOKENS } from '../action.schema.js';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

/**
 * Deterministic stateless test provider. Picks an action from the rotating
 * vocabulary using the current step extracted from the observation prompt.
 * Stateless on purpose: a fresh run always starts at "turn 0", and the
 * NestJS singleton lifetime carries no run-to-run leakage.
 *
 * Not for production traffic. Useful for integration tests and local dev.
 */
@Injectable()
export class MockProvider implements ModelProvider {
  readonly id = 'mock' as const;

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const match = input.user.match(/STEP\s+(\d+)/);
    const step = match?.[1] ? Number.parseInt(match[1], 10) : 0;
    const token = AGENT_ACTION_TOKENS[step % AGENT_ACTION_TOKENS.length];
    if (!token) throw new Error('mock: cycle underflow');
    return {
      response: {
        reasoning: `mock turn @ step ${step} → ${token}`,
        action: token,
      },
      tokensUsed: 12,
    };
  }
}
