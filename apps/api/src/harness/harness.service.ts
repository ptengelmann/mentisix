import {
  type Difficulty,
  type ProbeState,
  type WorldState,
  scoreProbe,
  score as scoreTreasureHunt,
} from '@mentisix/sim';
import type { ChallengeSlug, ModelRef, RunEvent, RunOptions, RunStatus } from '@mentisix/types';
import { Injectable, Logger } from '@nestjs/common';
import { getChallenge } from '../challenges/registry.js';
import { getResponseSchema } from '../challenges/schemas.js';
import type { ModelProvider } from './providers/index.js';

const DEFAULT_MAX_TOKENS = 200_000;
const DEFAULT_MAX_WALLCLOCK_MS = 5 * 60_000;

export type RunContext = {
  runId: string;
  challenge: ChallengeSlug;
  seed: number;
  difficulty: Difficulty;
  model: ModelRef;
  apiKey: string;
  options: RunOptions;
  provider: ModelProvider;
  emit: (event: RunEvent) => void;
};

export type RunFinish = {
  status: RunStatus;
  finalScore: number;
  tokensUsed: number;
  msUsed: number;
  stepsUsed: number;
  error?: string;
};

@Injectable()
export class HarnessService {
  private readonly logger = new Logger(HarnessService.name);

  /**
   * Drive a model through a challenge run. Emits a stream of events via
   * `ctx.emit`; resolves with the terminal status when the run ends.
   * Stops on: state terminal, step limit, token budget, wall clock, or
   * LLM error.
   */
  async run(ctx: RunContext): Promise<RunFinish> {
    const startedAt = Date.now();
    const maxTokens = ctx.options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const maxWallClockMs = ctx.options.maxWallClockMs ?? DEFAULT_MAX_WALLCLOCK_MS;

    const challenge = getChallenge(ctx.challenge);
    const responseSchema = getResponseSchema(ctx.challenge);

    let state = challenge.init(ctx.seed, ctx.difficulty);
    if (ctx.options.maxSteps && ctx.challenge === 'treasure-hunt') {
      // Step-budget override applies only to the world config; the rest
      // of the procedurally generated world stays identical to the seed.
      const w = state as WorldState;
      state = { ...w, config: { ...w.config, maxSteps: ctx.options.maxSteps } } as typeof state;
    }

    // Hello event is challenge-specific.
    this.emitHello(ctx, state);

    let tokensUsed = 0;

    while (!challenge.isTerminal(state)) {
      if (Date.now() - startedAt > maxWallClockMs) {
        ctx.emit({ kind: 'error', message: 'wall-clock budget exhausted' });
        return finish('killed', 'wall-clock budget exhausted');
      }
      if (tokensUsed >= maxTokens) {
        ctx.emit({ kind: 'error', message: 'token budget exhausted' });
        return finish('killed', 'token budget exhausted');
      }

      const stepNum = challenge.stepsUsed(state);
      const obs = challenge.observe(state);
      ctx.emit({ kind: 'observation', step: stepNum, observation: obs });

      const thinkStart = Date.now();
      let resp: Awaited<ReturnType<ModelProvider['generate']>>;
      try {
        resp = await ctx.provider.generate({
          apiKey: ctx.apiKey,
          model: ctx.model.model,
          system: challenge.systemPrompt(ctx.difficulty),
          user: challenge.serializeObservation(obs, state),
          observation: obs,
          runId: ctx.runId,
          responseSchema,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`provider failure on step ${stepNum}: ${message}`);
        ctx.emit({ kind: 'error', message: `provider: ${message}` });
        return finish('error', message);
      }

      tokensUsed += resp.tokensUsed;
      const thinkMs = Date.now() - thinkStart;
      ctx.emit({
        kind: 'thinking',
        step: stepNum,
        reasoning: resp.response.reasoning,
        tokensUsed: resp.tokensUsed,
        msUsed: thinkMs,
      });

      const prevState = state;
      state = challenge.step(state, resp.response);

      this.emitActionAndState(ctx, state, prevState, resp.response);

      if (ctx.options.stepDelayMs && !challenge.isTerminal(state)) {
        await new Promise<void>((resolve) => setTimeout(resolve, ctx.options.stepDelayMs));
      }
    }

    const finalScore = challenge.score(state);
    const status: RunStatus = finalScore.won ? 'passed' : 'failed';
    ctx.emit({
      kind: 'done',
      status,
      score: this.scoreBreakdownFor(ctx.challenge, state),
      tokensUsed,
      msUsed: Date.now() - startedAt,
    });

    return {
      status,
      finalScore: finalScore.score,
      tokensUsed,
      msUsed: Date.now() - startedAt,
      stepsUsed: challenge.stepsUsed(state),
    };

    function finish(killStatus: RunStatus, message: string): RunFinish {
      return {
        status: killStatus,
        finalScore: 0,
        tokensUsed,
        msUsed: Date.now() - startedAt,
        stepsUsed: challenge.stepsUsed(state),
        error: message,
      };
    }
  }

  private emitHello(ctx: RunContext, state: unknown): void {
    if (ctx.challenge === 'treasure-hunt') {
      const w = state as WorldState;
      ctx.emit({
        kind: 'hello',
        runId: ctx.runId,
        seed: ctx.seed,
        initialWorld: {
          seed: w.seed,
          width: w.config.width,
          height: w.config.height,
          maxSteps: w.config.maxSteps,
          visionRadius: w.config.visionRadius,
          agent: w.agent,
          grid: w.grid,
        },
      });
      return;
    }
    if (ctx.challenge === 'memory-probe') {
      const p = state as ProbeState;
      ctx.emit({
        kind: 'mp_hello',
        runId: ctx.runId,
        seed: ctx.seed,
        maxTurns: p.maxTurns,
        factCount: p.config.facts,
        schedule: p.schedule.map((t) => t.kind),
      });
    }
  }

  private emitActionAndState(
    ctx: RunContext,
    state: unknown,
    prevState: unknown,
    response: { reasoning: string; [k: string]: unknown },
  ): void {
    if (ctx.challenge === 'treasure-hunt') {
      const w = state as WorldState;
      const prev = prevState as WorldState;
      const result = w.history.at(-1);
      if (result && w !== prev) {
        ctx.emit({
          kind: 'action',
          step: w.step,
          action: result.action,
          outcome: result.outcome,
        });
      }
      ctx.emit({
        kind: 'state',
        step: w.step,
        agent: w.agent,
        inventory: w.inventory,
        treasuresCollected: w.treasuresCollected,
        status: w.status,
      });
      return;
    }
    if (ctx.challenge === 'memory-probe') {
      const p = state as ProbeState;
      const prev = prevState as ProbeState;
      const justAnswered = p.answers.length > prev.answers.length ? p.answers.at(-1) : undefined;
      const answer = typeof response.answer === 'string' ? response.answer : '';
      ctx.emit({
        kind: 'mp_action',
        step: p.turn,
        answer,
        ...(justAnswered ? { expected: justAnswered.expected, correct: justAnswered.correct } : {}),
      });
      ctx.emit({
        kind: 'mp_state',
        step: p.turn,
        turn: p.turn,
        factsRevealed: p.schedule.slice(0, p.turn).filter((t) => t.kind === 'tell').length,
        answersGiven: p.answers.length,
        answersCorrect: p.answers.filter((a) => a.correct).length,
        status: p.status,
      });
    }
  }

  private scoreBreakdownFor(challenge: ChallengeSlug, state: unknown): unknown {
    if (challenge === 'treasure-hunt') return scoreTreasureHunt(state as WorldState);
    if (challenge === 'memory-probe') return scoreProbe(state as ProbeState);
    return null;
  }
}
