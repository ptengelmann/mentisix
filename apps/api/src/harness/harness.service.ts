import { type WorldState, createWorld, observe, score, step } from '@mentisix/sim';
import type { ModelRef, RunEvent, RunOptions, RunStatus } from '@mentisix/types';
import { Injectable, Logger } from '@nestjs/common';
import { tokenToAction } from './action.schema.js';
import { SYSTEM_PROMPT, serializeObservation } from './prompts.js';
import type { ModelProvider } from './providers/index.js';

const DEFAULT_MAX_TOKENS = 200_000;
const DEFAULT_MAX_WALLCLOCK_MS = 5 * 60_000;

export type RunContext = {
  runId: string;
  seed: number;
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
   * Drive a model through a Treasure Hunt run. Emits a stream of events
   * via `ctx.emit`; resolves with the terminal status when the run ends.
   *
   * Stops on: world terminal (won/lost), step limit, token budget, wall
   * clock, or LLM error. Any caught error becomes a 'killed' run with the
   * message attached.
   */
  async run(ctx: RunContext): Promise<RunFinish> {
    const startedAt = Date.now();
    const maxTokens = ctx.options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const maxWallClockMs = ctx.options.maxWallClockMs ?? DEFAULT_MAX_WALLCLOCK_MS;

    let world: WorldState = createWorld(
      ctx.seed,
      ctx.options.maxSteps ? { maxSteps: ctx.options.maxSteps } : undefined,
    );

    ctx.emit({
      kind: 'hello',
      runId: ctx.runId,
      seed: ctx.seed,
      initialWorld: {
        seed: world.seed,
        width: world.config.width,
        height: world.config.height,
        maxSteps: world.config.maxSteps,
        visionRadius: world.config.visionRadius,
        agent: world.agent,
        grid: world.grid,
      },
    });

    let tokensUsed = 0;

    while (world.status === 'running') {
      if (Date.now() - startedAt > maxWallClockMs) {
        ctx.emit({ kind: 'error', message: 'wall-clock budget exhausted' });
        return finish('killed', 'wall-clock budget exhausted');
      }
      if (tokensUsed >= maxTokens) {
        ctx.emit({ kind: 'error', message: 'token budget exhausted' });
        return finish('killed', 'token budget exhausted');
      }

      const obs = observe(world);
      ctx.emit({ kind: 'observation', step: world.step, observation: obs });

      const thinkStart = Date.now();
      let resp: Awaited<ReturnType<ModelProvider['generate']>>;
      try {
        resp = await ctx.provider.generate({
          apiKey: ctx.apiKey,
          model: ctx.model.model,
          system: SYSTEM_PROMPT,
          user: serializeObservation(obs),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`provider failure on step ${world.step}: ${message}`);
        ctx.emit({ kind: 'error', message: `provider: ${message}` });
        return finish('error', message);
      }

      tokensUsed += resp.tokensUsed;
      const thinkMs = Date.now() - thinkStart;
      ctx.emit({
        kind: 'thinking',
        step: world.step,
        reasoning: resp.response.reasoning,
        tokensUsed: resp.tokensUsed,
        msUsed: thinkMs,
      });

      const simAction = tokenToAction(resp.response.action);
      world = step(world, simAction);
      const result = world.history.at(-1);
      if (result) {
        ctx.emit({
          kind: 'action',
          step: world.step,
          action: result.action,
          outcome: result.outcome,
        });
      }
      ctx.emit({
        kind: 'state',
        step: world.step,
        agent: world.agent,
        inventory: world.inventory,
        treasuresCollected: world.treasuresCollected,
        status: world.status,
      });
    }

    const breakdown = score(world);
    const status: RunStatus = world.status === 'won' ? 'passed' : 'failed';
    ctx.emit({
      kind: 'done',
      status,
      score: breakdown,
      tokensUsed,
      msUsed: Date.now() - startedAt,
    });

    return {
      status,
      finalScore: breakdown.score,
      tokensUsed,
      msUsed: Date.now() - startedAt,
      stepsUsed: world.step,
    };

    function finish(killStatus: RunStatus, message: string): RunFinish {
      return {
        status: killStatus,
        finalScore: 0,
        tokensUsed,
        msUsed: Date.now() - startedAt,
        stepsUsed: world.step,
        error: message,
      };
    }
  }
}
