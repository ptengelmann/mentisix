import { Module } from '@nestjs/common';
import { HarnessModule } from '../harness/harness.module.js';
import { RunsController } from './runs.controller.js';
import { RunsRepository } from './runs.repository.js';
import { RunsService } from './runs.service.js';

@Module({
  imports: [HarnessModule],
  controllers: [RunsController],
  providers: [RunsService, RunsRepository],
})
export class RunsModule {}
