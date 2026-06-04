import { randomUUID } from 'node:crypto';
import type { ProviderId, RunEvent, RunStatus, RunSummary } from '@mentisix/types';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type Observable, ReplaySubject } from 'rxjs';
import { HarnessService } from '../harness/harness.service.js';
import { ProviderFactory } from '../harness/providers/index.js';
import type { RunStartDto } from './run.dto.js';
import { RunsRepository } from './runs.repository.js';

type RunRecord = {
  id: string;
  challenge: 'treasure-hunt';
  seed: number;
  model: { provider: ProviderId; model: string };
  status: RunStatus;
  score: number | null;
  stepsUsed: number;
  tokensUsed: number;
  msUsed: number;
  createdAt: string;
  finishedAt: string | null;
  handle: string | null;
  error?: string;
  events$: ReplaySubject<RunEvent>;
  eventLog: RunEvent[];
};

const SEED_MAX = 2_147_483_647;

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);
  private readonly runs = new Map<string, RunRecord>();

  constructor(
    private readonly harness: HarnessService,
    private readonly providers: ProviderFactory,
    private readonly repo: RunsRepository,
  ) {}

  startRun(dto: RunStartDto): { runId: string; seed: number } {
    const id = randomUUID();
    const seed = dto.seed ?? Math.floor(Math.random() * SEED_MAX);
    const events$ = new ReplaySubject<RunEvent>();

    const record: RunRecord = {
      id,
      challenge: dto.challenge,
      seed,
      model: { provider: dto.model.provider as ProviderId, model: dto.model.model },
      status: 'queued',
      score: null,
      stepsUsed: 0,
      tokensUsed: 0,
      msUsed: 0,
      createdAt: new Date().toISOString(),
      finishedAt: null,
      handle: dto.handle ?? null,
      events$,
      eventLog: [],
    };
    this.runs.set(id, record);

    // Drive the harness in the background. API key is captured in this
    // closure only; we never persist it on the record.
    void this.execute(record, dto.apiKey, dto.options ?? {});

    return { runId: id, seed };
  }

  private async execute(
    record: RunRecord,
    apiKey: string,
    options: RunStartDto['options'],
  ): Promise<void> {
    record.status = 'running';
    const emit = (event: RunEvent) => {
      record.eventLog.push(event);
      record.events$.next(event);
    };
    try {
      const provider = this.providers.for(record.model.provider);
      const finish = await this.harness.run({
        runId: record.id,
        seed: record.seed,
        model: record.model,
        apiKey,
        options: options ?? {},
        provider,
        emit,
      });
      record.status = finish.status;
      record.score = finish.finalScore;
      record.stepsUsed = finish.stepsUsed;
      record.tokensUsed = finish.tokensUsed;
      record.msUsed = finish.msUsed;
      if (finish.error) record.error = finish.error;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`run ${record.id} crashed: ${message}`);
      record.status = 'error';
      record.error = message;
      emit({ kind: 'error', message });
    } finally {
      record.finishedAt = new Date().toISOString();
      record.events$.complete();
      try {
        await this.repo.insertTerminal({
          id: record.id,
          challenge: record.challenge,
          seed: record.seed,
          provider: record.model.provider,
          model: record.model.model,
          status: record.status,
          score: record.score,
          stepsUsed: record.stepsUsed,
          tokensUsed: record.tokensUsed,
          msUsed: record.msUsed,
          createdAt: new Date(record.createdAt),
          finishedAt: record.finishedAt ? new Date(record.finishedAt) : null,
          error: record.error ?? null,
          handle: record.handle,
          events: record.eventLog,
        });
      } catch (err) {
        this.logger.error(
          `run ${record.id} persist failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  getSummary(id: string): RunSummary {
    const r = this.runs.get(id);
    if (!r) throw new NotFoundException(`run ${id} not found`);
    return {
      id: r.id,
      challenge: r.challenge,
      seed: r.seed,
      model: r.model,
      status: r.status,
      score: r.score,
      stepsUsed: r.stepsUsed,
      tokensUsed: r.tokensUsed,
      msUsed: r.msUsed,
      createdAt: r.createdAt,
      finishedAt: r.finishedAt,
      ...(r.handle ? { handle: r.handle } : {}),
      ...(r.error ? { error: r.error } : {}),
    };
  }

  events(id: string): Observable<RunEvent> {
    const r = this.runs.get(id);
    if (!r) throw new NotFoundException(`run ${id} not found`);
    return r.events$.asObservable();
  }

  getReplay(id: string) {
    return this.repo.findReplay(id);
  }
}
