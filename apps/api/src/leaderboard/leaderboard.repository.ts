import type { Difficulty } from '@mentisix/sim';
import type { ChallengeSlug, LeaderboardRow } from '@mentisix/types';
import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DB, type Db } from '../db/db.module.js';
import { tokensToGBP } from './pricing.js';

const TOP_LIMIT = 50;

@Injectable()
export class LeaderboardRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * Best-per-(provider, model) leaderboard for a challenge + difficulty.
   * Rank is primarily by Bayesian-shrunken pass rate (so 1 lucky pass
   * doesn't crown a model), with raw best score as the tie-breaker.
   * Surfaces cost-per-success in GBP for models whose prices are known.
   */
  async top(challenge: ChallengeSlug, difficulty: Difficulty): Promise<LeaderboardRow[]> {
    const rows = await this.db.execute<{
      provider: string;
      model: string;
      best_score: number | null;
      best_steps_used: number | null;
      runs: string | number;
      passes: string | number;
      total_tokens: string | number;
      handle: string | null;
    }>(sql`
      with passes as (
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
      best_per_model as (
        select provider, model, score, steps_used, handle
        from passes where rk = 1
      ),
      aggregates as (
        select
          provider,
          model,
          count(*)::int as runs,
          sum(case when status = 'passed' then 1 else 0 end)::int as passes,
          coalesce(sum(tokens_used), 0)::bigint as total_tokens
        from runs
        where challenge = ${challenge} and difficulty = ${difficulty}
        group by provider, model
      )
      select
        aggregates.provider,
        aggregates.model,
        best_per_model.score as best_score,
        best_per_model.steps_used as best_steps_used,
        best_per_model.handle,
        aggregates.runs,
        aggregates.passes,
        aggregates.total_tokens
      from aggregates
      left join best_per_model
        on best_per_model.provider = aggregates.provider
        and best_per_model.model = aggregates.model
      where aggregates.runs > 0
    `);

    const enriched: LeaderboardRow[] = rows.map((row) => {
      const runs = Number(row.runs);
      const passes = Number(row.passes);
      const totalTokens = Number(row.total_tokens);
      // Bayesian shrinkage: Beta(1,1) prior + observed runs → posterior
      // mean is (passes + 1) / (runs + 2). A model with 0 of 0 runs lands
      // at 0.5; one lucky pass at 1/1 → 0.667; ten of ten → 0.917; etc.
      const passRateShrunk = (passes + 1) / (runs + 2);
      const totalCostGBP = tokensToGBP(row.model, totalTokens);
      const costPerSuccessGBP =
        totalCostGBP !== undefined && passes > 0 ? totalCostGBP / passes : undefined;
      return {
        // Rank assigned after sort.
        rank: 0,
        model: { provider: row.provider as LeaderboardRow['model']['provider'], model: row.model },
        difficulty,
        bestScore: row.best_score === null ? 0 : Number(row.best_score),
        bestStepsUsed: row.best_steps_used === null ? 0 : Number(row.best_steps_used),
        runs,
        passes,
        passRateShrunk,
        ...(costPerSuccessGBP !== undefined ? { costPerSuccessGBP } : {}),
        ...(totalCostGBP !== undefined ? { totalCostGBP } : {}),
        ...(row.handle ? { handle: row.handle } : {}),
      };
    });

    // Primary sort: posterior pass rate desc. Tie-break: best score desc,
    // then runs desc (more evidence wins ties), then fewer steps.
    enriched.sort((a, b) => {
      if (b.passRateShrunk !== a.passRateShrunk) return b.passRateShrunk - a.passRateShrunk;
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.runs !== a.runs) return b.runs - a.runs;
      return a.bestStepsUsed - b.bestStepsUsed;
    });

    return enriched.slice(0, TOP_LIMIT).map((row, i) => ({ ...row, rank: i + 1 }));
  }
}
