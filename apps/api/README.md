# @mentisix/api

The Mentisix backend. All business logic lives here: the agent harness, the run orchestrator, scoring, and (later) persistence + leaderboard. `apps/web` is a frontend client that talks to this service over HTTP.

## Endpoints

| Method | Path | What |
|---|---|---|
| `GET`  | `/health` | Liveness + version + uptime |
| `POST` | `/runs` | Start a run. Returns `{ runId, seed, challenge }`. API key is held in memory only. |
| `GET`  | `/runs/:id` | Run summary — status, score, steps, tokens, ms |
| `GET`  | `/runs/:id/stream` | Server-Sent Events feed of the run (see event types below) |

### `POST /runs` request

```json
{
  "challenge": "treasure-hunt",
  "seed": 42,
  "model": { "provider": "anthropic", "model": "claude-sonnet-4-6" },
  "apiKey": "sk-…",
  "options": {
    "maxSteps": 200,
    "maxTokens": 200000,
    "maxWallClockMs": 300000
  }
}
```

`provider` ∈ `openai` | `anthropic` | `groq` | `mock`. `seed` is optional — omit for a random one.

### SSE event types

The stream emits one frame per loop turn plus a terminal frame:

- `hello` — `{ runId, seed, initialWorld }` (sent once on connect)
- `observation` — `{ step, observation }` (the agent's 3×3 view)
- `thinking` — `{ step, reasoning, tokensUsed, msUsed }` (LLM response just landed)
- `action` — `{ step, action, outcome }` (sim applied it)
- `state` — `{ step, agent, inventory, treasuresCollected, status }` (post-step snapshot)
- `done` — `{ status, score, tokensUsed, msUsed }` (terminal)
- `error` — `{ message }` (provider failure, budget exceeded, kill)

## Architecture

```
src/
├── main.ts                 Bootstrap, CORS
├── app.module.ts           Wires HealthModule + RunsModule
├── health/                 Liveness controller
├── runs/                   HTTP layer
│   ├── runs.controller.ts  POST /runs, GET /runs/:id, GET /runs/:id/stream (SSE)
│   ├── runs.service.ts     In-memory run registry + ReplaySubject per run
│   └── run.dto.ts          Zod-validated request body
└── harness/                The run loop
    ├── action.schema.ts    Zod schema for the agent's structured output
    ├── prompts.ts          System prompt + observation serializer
    ├── harness.service.ts  observe → think → act loop + budget enforcement
    └── providers/          One adapter per LLM API
        ├── openai.provider.ts      Strict JSON Schema
        ├── anthropic.provider.ts   Tool use with forced tool choice
        ├── groq.provider.ts        OpenAI-compatible at api.groq.com
        └── mock.provider.ts        Deterministic, for tests
```

## Key safety

User API keys never touch persistence. They arrive in the `POST /runs` body, get captured in the run's execution closure, and are dropped when the run completes. The `RunRecord` in the registry contains no credential.

## Budget enforcement

Every run is bounded on three axes:
- **Steps** — hard sim cap (default 200)
- **Tokens** — total LLM tokens across all turns (default 200 000)
- **Wall clock** — total elapsed ms (default 5 minutes)

Hitting any cap kills the run with status `killed` and an `error` event.

## Local dev

```sh
pnpm --filter @mentisix/api dev    # NestJS watch mode on :4000
pnpm --filter @mentisix/api test   # 14 tests, ~1s
```

`CORS_ORIGIN` env var controls the allowed web origin (default `http://localhost:3000`).
