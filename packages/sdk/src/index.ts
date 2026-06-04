/**
 * @mentisix/sdk — typed client for apps/api.
 *
 * Used by apps/web for both server-component data fetching and browser-side
 * SSE consumption (for live runs).
 */

import type {
  LeaderboardRow,
  RunEvent,
  RunStartRequest,
  RunStartResponse,
  RunSummary,
} from '@mentisix/types';

export type ClientOptions = {
  baseUrl: string;
  fetch?: typeof fetch;
};

export type HealthResponse = {
  status: 'ok';
  service: 'mentisix-api';
  version: string;
  uptimeMs: number;
  startedAt: string;
};

export class MentisixClient {
  readonly baseUrl: string;
  readonly #fetch: typeof fetch;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.#fetch = options.fetch ?? globalThis.fetch;
  }

  async health(): Promise<HealthResponse> {
    const res = await this.#fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`mentisix: health ${res.status}`);
    return res.json() as Promise<HealthResponse>;
  }

  async startRun(req: RunStartRequest): Promise<RunStartResponse> {
    const res = await this.#fetch(`${this.baseUrl}/runs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`mentisix: startRun ${res.status}`);
    return res.json() as Promise<RunStartResponse>;
  }

  async getRun(id: string): Promise<RunSummary> {
    const res = await this.#fetch(`${this.baseUrl}/runs/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`mentisix: getRun ${res.status}`);
    return res.json() as Promise<RunSummary>;
  }

  /**
   * Open an SSE stream for a run. Yields parsed `RunEvent` objects as they
   * arrive. Use in an `async for` loop. Caller is responsible for breaking
   * out / aborting if needed.
   */
  async *streamRun(id: string, signal?: AbortSignal): AsyncGenerator<RunEvent, void, void> {
    const url = `${this.baseUrl}/runs/${encodeURIComponent(id)}/stream`;
    const res = await this.#fetch(url, { headers: { accept: 'text/event-stream' }, signal });
    if (!res.ok || !res.body) throw new Error(`mentisix: streamRun ${res.status}`);

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const events = splitEvents(buf);
        buf = events.tail;
        for (const raw of events.frames) {
          const parsed = parseFrame(raw);
          if (parsed) yield parsed as RunEvent;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async leaderboard(challenge: string): Promise<LeaderboardRow[]> {
    const res = await this.#fetch(`${this.baseUrl}/leaderboard/${encodeURIComponent(challenge)}`);
    if (!res.ok) throw new Error(`mentisix: leaderboard ${res.status}`);
    return res.json() as Promise<LeaderboardRow[]>;
  }
}

function splitEvents(buf: string): { frames: string[]; tail: string } {
  const frames: string[] = [];
  const parts = buf.split(/\n\n/);
  const tail = parts.pop() ?? '';
  for (const p of parts) if (p.trim().length > 0) frames.push(p);
  return { frames, tail };
}

function parseFrame(frame: string): unknown | null {
  let data = '';
  for (const line of frame.split('\n')) {
    if (line.startsWith('data:')) data += line.slice(5).trimStart();
    else if (line.startsWith('data: ')) data += line.slice(6);
  }
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export type {
  LeaderboardRow,
  RunEvent,
  RunStartRequest,
  RunStartResponse,
  RunSummary,
} from '@mentisix/types';
