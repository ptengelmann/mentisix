/**
 * Per-token pricing for the models we run, in GBP per token.
 *
 * Sourced from each provider's published prices. Numbers are approximate
 * blended input/output rates (70/30 split, the rough mix Mentisix runs see)
 * to keep the leaderboard's "cost per success" column a single value
 * rather than two. Real billing varies by request shape; this is for
 * comparative ranking only.
 *
 * GBP figures use 1 USD = 0.79 GBP, rounded to 6 decimals.
 */
export type PriceEntry = {
  /** Approx blended GBP per 1M tokens. */
  gbpPerMillionTokens: number;
};

export const MODEL_PRICES: Record<string, PriceEntry> = {
  // OpenAI
  'gpt-4o': { gbpPerMillionTokens: 4.345 },
  'gpt-4o-mini': { gbpPerMillionTokens: 0.261 },
  'gpt-4.1': { gbpPerMillionTokens: 3.55 },
  'gpt-4.1-mini': { gbpPerMillionTokens: 0.71 },
  'gpt-4.1-nano': { gbpPerMillionTokens: 0.142 },
  'o3-mini': { gbpPerMillionTokens: 3.16 },

  // Anthropic
  'claude-sonnet-4-6': { gbpPerMillionTokens: 5.925 },
  'claude-opus-4-7': { gbpPerMillionTokens: 23.7 },
  'claude-haiku-4-5-20251001': { gbpPerMillionTokens: 1.382 },
  'claude-3-5-sonnet-20241022': { gbpPerMillionTokens: 5.925 },

  // Gemini
  'gemini-2.5-flash': { gbpPerMillionTokens: 0.158 },
  'gemini-2.5-pro': { gbpPerMillionTokens: 4.345 },

  // Groq
  'llama-3.3-70b-versatile': { gbpPerMillionTokens: 0.474 },
  'llama-3.1-8b-instant': { gbpPerMillionTokens: 0.087 },
  'mixtral-8x7b-32768': { gbpPerMillionTokens: 0.158 },

  // OpenRouter routes; the meta-provider's prices vary but these are the
  // common ones Mentisix users pick.
  'x-ai/grok-3': { gbpPerMillionTokens: 4.345 },
  'anthropic/claude-sonnet-4-6': { gbpPerMillionTokens: 5.925 },
  'deepseek/deepseek-v3': { gbpPerMillionTokens: 0.395 },

  // Solver and Mock cost nothing.
  'solver-1': { gbpPerMillionTokens: 0 },
  'mock-1': { gbpPerMillionTokens: 0 },
};

export function priceFor(model: string): PriceEntry | undefined {
  return MODEL_PRICES[model];
}

export function tokensToGBP(model: string, tokens: number): number | undefined {
  const price = priceFor(model);
  if (!price) return undefined;
  return (tokens / 1_000_000) * price.gbpPerMillionTokens;
}
