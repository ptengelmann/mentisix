/**
 * @mentisix/sdk — typed client for apps/api.
 *
 * Used by apps/web for both server-component data fetching and browser-side
 * SSE consumption (for live runs). v0: a thin wrapper around fetch that
 * preserves @mentisix/types contracts.
 */

import type { LeaderboardRow, RunSummary } from '@mentisix/types';

export type ClientOptions = {
  baseUrl: string;
  fetch?: typeof fetch;
};

export class MentisixClient {
  readonly baseUrl: string;
  readonly #fetch: typeof fetch;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.#fetch = options.fetch ?? globalThis.fetch;
  }

  async health(): Promise<{ status: 'ok'; version: string; uptimeMs: number }> {
    const res = await this.#fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`mentisix: health ${res.status}`);
    return res.json() as Promise<{ status: 'ok'; version: string; uptimeMs: number }>;
  }

  async listRuns(): Promise<RunSummary[]> {
    const res = await this.#fetch(`${this.baseUrl}/runs`);
    if (!res.ok) throw new Error(`mentisix: listRuns ${res.status}`);
    return res.json() as Promise<RunSummary[]>;
  }

  async leaderboard(challenge: string): Promise<LeaderboardRow[]> {
    const res = await this.#fetch(`${this.baseUrl}/leaderboard/${challenge}`);
    if (!res.ok) throw new Error(`mentisix: leaderboard ${res.status}`);
    return res.json() as Promise<LeaderboardRow[]>;
  }
}
