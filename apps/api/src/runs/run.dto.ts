import { PROVIDERS } from '@mentisix/types';
import { z } from 'zod';

export const RunStartSchema = z.object({
  challenge: z.literal('treasure-hunt'),
  seed: z.number().int().nonnegative().optional(),
  model: z.object({
    provider: z.enum(PROVIDERS as readonly [string, ...string[]]),
    model: z.string().min(1).max(120),
  }),
  apiKey: z.string().min(1).max(512),
  options: z
    .object({
      maxSteps: z.number().int().positive().max(1000).optional(),
      maxTokens: z.number().int().positive().max(2_000_000).optional(),
      maxWallClockMs: z
        .number()
        .int()
        .positive()
        .max(30 * 60_000)
        .optional(),
      stepDelayMs: z.number().int().nonnegative().max(2000).optional(),
    })
    .optional(),
});

export type RunStartDto = z.infer<typeof RunStartSchema>;
