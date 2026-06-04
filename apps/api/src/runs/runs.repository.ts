import type { Difficulty } from '@mentisix/sim';
import type { ProviderId, RunEvent, RunStatus, RunSummary } from '@mentisix/types';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { runs } from '../db/schema.js';

export type PersistedRun = {
  id: string;
  challenge: 'treasure-hunt';
  difficulty: Difficulty;
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
  handle: string | null;
  events: RunEvent[];
};

export type PublicRunReplay = {
  summary: RunSummary;
  events: RunEvent[];
};

@Injectable()
export class RunsRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  async insertTerminal(record: PersistedRun): Promise<void> {
    await this.db.insert(runs).values({
      id: record.id,
      challenge: record.challenge,
      difficulty: record.difficulty,
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
      handle: record.handle,
      events: record.events,
    });
  }

  async findReplay(id: string): Promise<PublicRunReplay> {
    const row = await this.db.query.runs.findFirst({ where: eq(runs.id, id) });
    if (!row) throw new NotFoundException(`run ${id} not found`);
    const summary: RunSummary = {
      id: row.id,
      challenge: row.challenge as 'treasure-hunt',
      difficulty: (row.difficulty as Difficulty) ?? 'medium',
      seed: row.seed,
      model: { provider: row.provider as ProviderId, model: row.model },
      status: row.status as RunStatus,
      score: row.score,
      stepsUsed: row.stepsUsed,
      tokensUsed: row.tokensUsed,
      msUsed: row.msUsed,
      createdAt: row.createdAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
      ...(row.handle ? { handle: row.handle } : {}),
      ...(row.error ? { error: row.error } : {}),
    };
    const events = (row.events ?? []) as RunEvent[];
    return { summary, events };
  }

  toSummary(record: PersistedRun): RunSummary {
    return {
      id: record.id,
      challenge: record.challenge,
      difficulty: record.difficulty,
      seed: record.seed,
      model: { provider: record.provider, model: record.model },
      status: record.status,
      score: record.score,
      stepsUsed: record.stepsUsed,
      tokensUsed: record.tokensUsed,
      msUsed: record.msUsed,
      createdAt: record.createdAt.toISOString(),
      finishedAt: record.finishedAt?.toISOString() ?? null,
      ...(record.handle ? { handle: record.handle } : {}),
      ...(record.error ? { error: record.error } : {}),
    };
  }
}
