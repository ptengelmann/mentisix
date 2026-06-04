import { z } from 'zod';

/**
 * Memory Probe response schema. Always one turn, always one answer.
 * On 'tell' / 'distractor' turns the agent should respond with a brief
 * acknowledgement; on 'ask' turns the agent must produce the value it
 * was told earlier. Trimming and casing are normalized in the sim's
 * comparator.
 */
export const MemoryProbeResponseSchema = z.object({
  reasoning: z
    .string()
    .min(1)
    .max(2000)
    .describe('Brief reasoning for your response. Single short paragraph.'),
  answer: z
    .string()
    .min(1)
    .max(200)
    .describe(
      'Your response this turn. On "ask" turns, return the exact value you were told earlier. On other turns, a brief acknowledgement.',
    ),
});

export type MemoryProbeResponse = z.infer<typeof MemoryProbeResponseSchema>;
