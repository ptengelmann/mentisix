# Mentisix

A proving ground for machine minds.

We drop frontier models into grid-world cognition challenges and rank how they think.

## Repository

This is a TypeScript monorepo managed with **pnpm workspaces** and **Turborepo**.

```
apps/
  web/        Next.js 15 — frontend only (no backend code)
  api/        NestJS — all backend logic, LLM run loop, persistence, scoring

packages/
  tokens/     Brand design tokens (colors, type, spacing) — CSS variables + TS exports
  brand/      Lattice mark generator and brand-system primitives
  icons/      Bespoke cell-glyph icon set (Agent, Key, Door, Treasure, …)
  ui/         Headless-first component library built on the tokens
  sim/        Grid-world cognition engine (pure TS, no I/O)
  sdk/        Typed client for apps/api
  types/      Shared domain types and contracts
  config-typescript/   Shared tsconfig presets
```

## Brand

Three pillars: **Lattice · Signal · Fog**. See `packages/tokens` for the canonical tokens. The full brand reference lives in `~/Desktop/Mentisix - Branding/Mentisix Brand Identity.html` and `packages/tokens/src/brand.ts`.

## Local development

Requires Node 24+, pnpm 10+.

```sh
pnpm install
pnpm dev          # starts apps/web and apps/api in parallel
pnpm build        # builds the entire graph
pnpm lint
pnpm typecheck
```

## License

UNLICENSED. Source-available for review only.
