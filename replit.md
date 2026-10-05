# Vibe Score

A mobile-friendly wallet-gated Vibe Score app for Robinhood Chain Testnet.

## Run & Operate

- `pnpm --filter @workspace/vibe-score run dev` — run the Vibe Score app
- `pnpm --filter @workspace/vibe-score run typecheck` — typecheck the Vibe Score app
- `pnpm --filter @workspace/vibe-score run build` — build the static Next.js export
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — optional public WalletConnect project ID to enable WalletConnect
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Vibe Score: Next.js App Router static export, React, wagmi, viem
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/vibe-score/` — Vibe Score web app and chain configuration
- `artifacts/api-server/` — shared API server

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- Connect a wallet on Robinhood Chain Testnet, verify a configured ERC-20 holding, and display an activity-based score.
- The gating token address is configured in `artifacts/vibe-score/app/chain.ts`; verify it against the intended Robinhood Chain Testnet token before using holder gating.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
