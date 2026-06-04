import type { RunStartResponse, RunSummary } from '@mentisix/types';
import { Body, Controller, Get, Param, Post, Sse } from '@nestjs/common';
import { type Observable, map } from 'rxjs';
import { ZodValidationPipe } from '../shared/zod-validation.pipe.js';
import { type RunStartDto, RunStartSchema } from './run.dto.js';
import type { PublicRunReplay } from './runs.repository.js';
import { RunsService } from './runs.service.js';

type SseFrame = { event: string; data: string };

@Controller('runs')
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Post()
  start(@Body(new ZodValidationPipe(RunStartSchema)) body: RunStartDto): RunStartResponse {
    const { runId, seed } = this.runs.startRun(body);
    return { runId, seed, challenge: body.challenge };
  }

  @Get(':id')
  get(@Param('id') id: string): RunSummary {
    return this.runs.getSummary(id);
  }

  @Get(':id/replay')
  replay(@Param('id') id: string): Promise<PublicRunReplay> {
    return this.runs.getReplay(id);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<SseFrame> {
    return this.runs.events(id).pipe(
      map((event) => ({
        event: event.kind,
        data: JSON.stringify(event),
      })),
    );
  }
}
