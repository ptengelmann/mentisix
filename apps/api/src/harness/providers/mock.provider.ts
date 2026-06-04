import { Injectable } from '@nestjs/common';
import { AGENT_ACTION_TOKENS } from '../action.schema.js';
import type { GenerateInput, GenerateOutput, ModelProvider } from './provider.interface.js';

/**
 * Deterministic test provider. Picks actions from a small rotating cycle
 * so the run loop has *something* to drive without burning real API quota.
 * Not for production traffic — useful for integration tests and local dev.
 */
@Injectable()
export class MockProvider implements ModelProvider {
  readonly id = 'mock' as const;
  private cycleIndex = 0;

  async generate(_input: GenerateInput): Promise<GenerateOutput> {
    const token = AGENT_ACTION_TOKENS[this.cycleIndex % AGENT_ACTION_TOKENS.length];
    this.cycleIndex++;
    if (!token) throw new Error('mock: cycle underflow');
    return {
      response: {
        reasoning: `mock provider turn ${this.cycleIndex}`,
        action: token,
      },
      tokensUsed: 12,
    };
  }
}
