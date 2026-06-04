import { Module } from '@nestjs/common';
import { HarnessService } from './harness.service.js';
import {
  AnthropicProvider,
  GeminiProvider,
  GroqProvider,
  MockProvider,
  OpenAIProvider,
  OpenRouterProvider,
  ProviderFactory,
  SolverProvider,
} from './providers/index.js';

@Module({
  providers: [
    OpenAIProvider,
    AnthropicProvider,
    GeminiProvider,
    GroqProvider,
    OpenRouterProvider,
    MockProvider,
    SolverProvider,
    ProviderFactory,
    HarnessService,
  ],
  exports: [HarnessService, ProviderFactory],
})
export class HarnessModule {}
