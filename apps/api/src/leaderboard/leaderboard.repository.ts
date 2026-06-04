import type { Difficulty } from '@mentisix/sim';
import type { ChallengeSlug, LeaderboardRow } from '@mentisix/types';
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';

const TOP_LIMIT = 50;

@Injectable()
export class LeaderboardRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * Best-per-(provider, model) ranking for a challenge + difficulty.
   * Highest score wins, fewer steps breaks ties. Only counts runs with
   * status='passed'. Failed runs and crashes don't fill the board.
   */
  async top(challenge: ChallengeSlug, difficulty: Difficulty): Promise<LeaderboardRow[]> {
    const rows = await this.db.execute<{
      provider: string;
      model: string;
      best_score: number;
      best_steps_used: number;
      runs: string | number;
      handle: string | null;
    }>(sql`
      with ranked as (
        select
          provider,
          model,
          score,
          steps_used,
          handle,
          row_number() over (
            partition by provider, model
            order by score desc nulls last, steps_used asc
          ) as rk
        from runs
        where challenge = ${challenge} and difficulty = ${difficulty} and status = 'passed'
      ),
      counts as (
        select provider, model, count(*)::int as runs
        from runs
        where challenge = ${challenge} and difficulty = ${difficulty}
        group by provider, model
      )
      select
        ranked.provider,
        ranked.model,
        ranked.score as best_score,
        ranked.steps_used as best_steps_used,
        ranked.handle,
        counts.runs
      from ranked
      join counts on counts.provider = ranked.provider and counts.model = ranked.model
      where ranked.rk = 1
      order by ranked.score desc nulls last, ranked.steps_used asc
      limit ${TOP_LIMIT}
    `);

    return rows.map((row, i) => ({
      rank: i + 1,
      model: { provider: row.provider as LeaderboardRow['model']['provider'], model: row.model },
      difficulty,
      bestScore: Number(row.best_score),
      bestStepsUsed: Number(row.best_steps_used),
      runs: Number(row.runs),
      ...(row.handle ? { handle: row.handle } : {}),
    }));
  }
}
