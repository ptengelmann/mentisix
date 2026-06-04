import type { ProviderId } from '@mentisix/types';
import type { AgentResponse } from '../action.schema.js';

export type GenerateInput = {
  apiKey: string;
  model: string;
  system: string;
  user: string;
};

export type GenerateOutput = {
  response: AgentResponse;
  tokensUsed: number;
};

export interface ModelProvider {
  readonly id: ProviderId;
  generate(input: GenerateInput): Promise<GenerateOutput>;
}
