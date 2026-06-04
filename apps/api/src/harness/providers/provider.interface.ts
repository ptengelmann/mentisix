import type { Observation } from '@mentisix/sim';
import type { ProviderId } from '@mentisix/types';
import type { AgentResponse } from '../action.schema.js';

export type GenerateInput = {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  /** Structured observation; bypasses the prompt for providers that want it. */
  observation?: Observation;
  /** Per-run identifier so providers can maintain memory across turns. */
  runId?: string;
};

export type GenerateOutput = {
  response: AgentResponse;
  tokensUsed: number;
};

export interface ModelProvider {
  readonly id: ProviderId;
  generate(input: GenerateInput): Promise<GenerateOutput>;
}
