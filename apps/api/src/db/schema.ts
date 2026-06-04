import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * One row per completed Treasure Hunt run. The harness writes here on
 * terminal state; the leaderboard reads from here. We deliberately don't
 * persist event streams in this table — that comes in a separate replay
 * artifact in a follow-up.
 */
export const runs = pgTable(
  'runs',
  {
    id: uuid('id').primaryKey(),
    challenge: text('challenge').notNull(),
    seed: integer('seed').notNull(),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    status: text('status').notNull(),
    score: integer('score'),
    stepsUsed: integer('steps_used').notNull(),
    tokensUsed: integer('tokens_used').notNull(),
    msUsed: integer('ms_used').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    error: text('error'),
    handle: text('handle'),
  },
  (t) => ({
    byChallengeStatusScore: index('runs_challenge_status_score_idx').on(
      t.challenge,
      t.status,
      t.score,
    ),
    byProviderModel: index('runs_provider_model_idx').on(t.provider, t.model),
  }),
);

export type RunRow = typeof runs.$inferSelect;
export type NewRunRow = typeof runs.$inferInsert;
