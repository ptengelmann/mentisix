import { Module } from '@nestjs/common';
import { HarnessService } from './harness.service.js';
import {
  AnthropicProvider,
  GroqProvider,
  MockProvider,
  OpenAIProvider,
  ProviderFactory,
  SolverProvider,
} from './providers/index.js';

@Module({
  providers: [
    OpenAIProvider,
    AnthropicProvider,
    GroqProvider,
    MockProvider,
    SolverProvider,
    ProviderFactory,
    HarnessService,
  ],
  exports: [HarnessService, ProviderFactory],
})
export class HarnessModule {}
