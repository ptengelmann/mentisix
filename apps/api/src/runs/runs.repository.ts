import type { ProviderId, RunStatus, RunSummary } from '@mentisix/types';
import { Inject, Injectable } from '@nestjs/common';
import { DB, type Db } from '../db/db.module.js';
import { runs } from '../db/schema.js';

export type PersistedRun = {
  id: string;
  challenge: 'treasure-hunt';
  seed: number;
  provider: ProviderId;
  model: string;
  status: RunStatus;
  score: number | null;
  stepsUsed: number;
  tokensUsed: number;
  msUsed: number;
  createdAt: Date;
  finishedAt: Date | null;
  error: string | null;
};

@Injectable()
export class RunsRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  async insertTerminal(record: PersistedRun): Promise<void> {
    await this.db.insert(runs).values({
      id: record.id,
      challenge: record.challenge,
      seed: record.seed,
      provider: record.provider,
      model: record.model,
      status: record.status,
      score: record.score,
      stepsUsed: record.stepsUsed,
      tokensUsed: record.tokensUsed,
      msUsed: record.msUsed,
      createdAt: record.createdAt,
      finishedAt: record.finishedAt,
      error: record.error,
    });
  }

  toSummary(record: PersistedRun): RunSummary {
    return {
      id: record.id,
      challenge: record.challenge,
      seed: record.seed,
      model: { provider: record.provider, model: record.model },
      status: record.status,
      score: record.score,
      stepsUsed: record.stepsUsed,
      tokensUsed: record.tokensUsed,
      msUsed: record.msUsed,
      createdAt: record.createdAt.toISOString(),
      finishedAt: record.finishedAt?.toISOString() ?? null,
      ...(record.error ? { error: record.error } : {}),
    };
  }
}
