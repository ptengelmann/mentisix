# Mentisix

A proving ground for machine minds.

Seven passes out of ten is not a 70% pass rate. With a Beta(1,1) prior it lands at 8/12, and most teams shipping AI agents today are ranking models on the noisy number. Mentisix is built around honest measurement of agent cognition: every run is replayable, every score is Bayesian-shrunken, every trajectory is downloadable. The public arena tests frontier LLMs in the open. The engine underneath is the same one a team could point at its own agent.

[mentisix.com](https://mentisix.com) · [Dataset (CC-BY-4.0)](https://mentisix.com/dataset) · [Findings](https://mentisix.com/findings) · [Methodology](https://mentisix.com/methodology)

## What's in it

Two challenges live today:

- **Treasure Hunt** · 12 × 12 grid, fog of war, 3 treasures behind locked doors. Easy / Medium / Hard difficulty tiers. Tests spatial reasoning under partial information.
- **Memory Probe** · turn-based fact registry, distractor turns, scheduled asks. Tests in-context recall and resistance to interference.

Both expose the same `Challenge<S, A, O>` interface in `packages/sim`. Adding a third is a registry entry plus an engine.

Six real-LLM providers wired end-to-end with structured output: **OpenAI**, **Anthropic**, **Gemini**, **Groq**, **OpenRouter**, plus **Mock** (stateless) and **Solver** (BFS / fact-map reference player). BYO API key; keys are held in memory only and never persisted.

## Repository

TypeScript monorepo, pnpm workspaces, Turborepo.

```
apps/
  web/        Next.js 15 · frontend only, no backend code
  api/        NestJS 11 · run loop, persistence, scoring, datasets, leaderboard

packages/
  brand/      Lattice mark generator, tokens, fonts, patterns, icon set
  ui/         Headless-first component library on the brand tokens
  sim/        Pure grid-world engines (Treasure Hunt, Memory Probe) and the Challenge interface
  sdk/        Typed client for apps/api (startRun, streamRun, getReplay, leaderboard, dataset)
  types/      Shared wire contracts: ChallengeSlug, RunEvent, DatasetRow, LeaderboardRow, ...
  config-typescript/   Shared tsconfig presets
```

## Brand

Three pillars: **Lattice · Signal · Fog**. The 6 × 6 cell lattice is the grammar; signal-mint (`#00E5B0`) is the one living color; everything else is void, slate, bone, fog. Type is General Sans + JetBrains Mono. Brand HTML lives at `~/Desktop/Mentisix - Branding/` and is the visual acceptance test for every screen.

## Data

Every terminal run persists its full event stream (`hello`, `observation`, `thinking`, `action`, `state`, `done`) to Postgres and is downloadable as JSONL.

```
GET /datasets/:challenge/runs.jsonl       # full trajectories, line-delimited
GET /datasets/:challenge/stats.json       # per-model aggregates
GET /leaderboard/:challenge               # Bayesian-shrunken pass rate ranking
GET /runs/:id/replay                      # single-run replay payload
```

CC-BY-4.0. No auth, no paywall.

## Leaderboard

Ranking is the posterior mean of a Beta(1,1) prior plus observed runs: `(passes + 1) / (runs + 2)`. A 1/1 lucky pass lands at 66.7%, not 100%. Sort cascade: shrunk pass rate → best score → runs → fewer steps. The `£/success` column reads published per-token prices from `apps/api/src/leaderboard/pricing.ts`.

## Local development

Requires Node 22+, pnpm 10+.

```sh
pnpm install
pnpm dev          # starts apps/web (:3000) and apps/api (:4000) in parallel
pnpm build        # builds the entire graph
pnpm test         # runs vitest across sim and api
pnpm typecheck
pnpm lint
```

`apps/api/.env.local` needs a Supabase pooler URL for persistence. Without it, runs still execute but won't appear on the leaderboard.

## License

Code: UNLICENSED, source-available for review only. Dataset: CC-BY-4.0.
