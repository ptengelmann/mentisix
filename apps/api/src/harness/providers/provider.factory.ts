import type { ProviderId } from '@mentisix/types';
import { Injectable } from '@nestjs/common';
import { AnthropicProvider } from './anthropic.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { GroqProvider } from './groq.provider.js';
import { MockProvider } from './mock.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { OpenRouterProvider } from './openrouter.provider.js';
import type { ModelProvider } from './provider.interface.js';
import { SolverProvider } from './solver.provider.js';

@Injectable()
export class ProviderFactory {
  constructor(
    private readonly openai: OpenAIProvider,
    private readonly anthropic: AnthropicProvider,
    private readonly gemini: GeminiProvider,
    private readonly groq: GroqProvider,
    private readonly openrouter: OpenRouterProvider,
    private readonly mock: MockProvider,
    private readonly solver: SolverProvider,
  ) {}

  for(id: ProviderId): ModelProvider {
    switch (id) {
      case 'openai':
        return this.openai;
      case 'anthropic':
        return this.anthropic;
      case 'gemini':
        return this.gemini;
      case 'groq':
        return this.groq;
      case 'openrouter':
        return this.openrouter;
      case 'mock':
        return this.mock;
      case 'solver':
        return this.solver;
      default: {
        const _exhaustive: never = id;
        throw new Error(`unknown provider: ${_exhaustive as string}`);
      }
    }
  }
}
