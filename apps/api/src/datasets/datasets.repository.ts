import type {
  ChallengeSlug,
  DatasetRow,
  DatasetStats,
  ProviderId,
  RunEvent,
  RunStatus,
} from '@mentisix/types';
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { runs } from '../db/schema.js';

@Injectable()
export class DatasetsRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * Stream every run for the challenge as `DatasetRow`. Yields in DB
   * order (by created_at). The caller serializes each row to JSONL.
   * We hold no buffer larger than one row.
   */
  async *streamRows(challenge: ChallengeSlug): AsyncGenerator<DatasetRow, void, void> {
    const rows = await this.db.select().from(runs).where(sql`${runs.challenge} = ${challenge}`);
    for (const row of rows) {
      yield {
        id: row.id,
        challenge: row.challenge as ChallengeSlug,
        seed: row.seed,
        provider: row.provider as ProviderId,
        model: row.model,
        status: row.status as RunStatus,
        score: row.score,
        stepsUsed: row.stepsUsed,
        tokensUsed: row.tokensUsed,
        msUsed: row.msUsed,
        handle: row.handle,
        createdAt: row.createdAt.toISOString(),
        finishedAt: row.finishedAt?.toISOString() ?? null,
        events: (row.events ?? []) as RunEvent[],
      };
    }
  }

  async stats(challenge: ChallengeSlug): Promise<DatasetStats> {
    const aggregates = await this.db.execute<{
      provider: string;
      model: string;
      runs: number | string;
      passes: number | string;
      total_tokens: number | string;
      total_ms: number | string;
      avg_score: number | string | null;
    }>(sql`
      select
        provider,
        model,
        count(*)::int as runs,
        sum(case when status = 'passed' then 1 else 0 end)::int as passes,
        coalesce(sum(tokens_used), 0)::bigint as total_tokens,
        coalesce(sum(ms_used), 0)::bigint as total_ms,
        avg(score) filter (where status = 'passed') as avg_score
      from runs
      where challenge = ${challenge}
      group by provider, model
      order by passes desc, model asc
    `);

    const byModel = aggregates.map((row) => {
      const runCount = Number(row.runs);
      const passes = Number(row.passes);
      return {
        provider: row.provider as ProviderId,
        model: row.model,
        runs: runCount,
        passes,
        passRate: runCount === 0 ? 0 : passes / runCount,
        totalTokens: Number(row.total_tokens),
        avgScore: row.avg_score === null ? null : Number(row.avg_score),
      };
    });

    const totalRuns = byModel.reduce((acc, m) => acc + m.runs, 0);
    const totalPassedRuns = byModel.reduce((acc, m) => acc + m.passes, 0);
    const totalTokens = byModel.reduce((acc, m) => acc + m.totalTokens, 0);
    const totalMs = aggregates.reduce((acc, row) => acc + Number(row.total_ms), 0);

    return {
      challenge,
      totalRuns,
      totalPassedRuns,
      totalTokens,
      totalMs,
      byModel,
      generatedAt: new Date().toISOString(),
    };
  }
}
