import { Module } from '@nestjs/common';
import { HarnessService } from './harness.service.js';
import {
  AnthropicProvider,
  GroqProvider,
  MockProvider,
  OpenAIProvider,
  ProviderFactory,
} from './providers/index.js';

@Module({
  providers: [
    OpenAIProvider,
    AnthropicProvider,
    GroqProvider,
    MockProvider,
    ProviderFactory,
    HarnessService,
  ],
  exports: [HarnessService, ProviderFactory],
})
export class HarnessModule {}
