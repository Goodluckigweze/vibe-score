# Vibe Score

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Vibe Score turns a Robinhood Chain Testnet wallet’s public activity into a compact, reputation-style score. Connect a wallet, verify its configured ERC-20 holding, and get a breakdown of the on-chain signals behind its score.

> **Testnet software:** Vibe Score is an experimental community project, not a financial product, credit rating, security audit, or endorsement. Use testnet wallets and assets only.

## What it measures

A connected wallet must hold a non-zero balance of the configured gating token to see its score. Eligible scores combine:

| Signal | Maximum | Source |
| --- | ---: | --- |
| Token balance | 30 | ERC-20 `balanceOf` and `decimals` reads |
| Wallet activity | 40 | Robinhood Chain Testnet explorer transaction count, or outgoing nonce when the explorer counter is unavailable |
| Contract interactions | 15 | Recent indexed activity for the configured token and any related contracts listed in the app configuration |
| Wallet signature | 15 | A deterministic value derived from the public address |

The total is capped at 100. Explorer indexing and public RPC availability affect what can be measured; the activity fallback is an approximation. The score is a playful snapshot of testnet activity, not a measure of a person or a prediction of financial outcomes.

## Wallets and network

- Supports named injected wallets discovered through EIP-6963 and a generic injected-browser-wallet fallback.
- WalletConnect is available when `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is configured.
- The app targets Robinhood Chain Testnet, chain ID `46630`.
- Scoring reads public chain and explorer data. It does not submit transactions or ask the user to sign a message for a score.

Wallet approvals and mobile WalletConnect pairing have not yet been verified end to end. Treat those flows as needing manual confirmation before relying on them.

## Getting started

### Requirements

- Node.js 24
- pnpm 10

### Install and run

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/vibe-score run dev
```

Open the local address printed by the development server.

### Enable WalletConnect (optional)

1. Create a project in [WalletConnect Cloud](https://cloud.reown.com/).
2. Copy `artifacts/vibe-score/.env.example` to `artifacts/vibe-score/.env.local`.
3. Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env.local`, then restart the development server.

The project ID is public configuration, not an application secret. Keep `.env.local` out of version control. Without the value, injected browser wallets remain available and the WalletConnect connector is omitted.

### Configure holder gating

Review `GATING_TOKEN_ADDRESS` in `artifacts/vibe-score/app/chain.ts` and verify that it is the intended ERC-20 contract on Robinhood Chain Testnet. Add any supported related contracts to `RELATED_VIBE_CONTRACTS` in the same file. Do not use this testnet configuration as a mainnet token configuration.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run typecheck` | Type-check the workspace |
| `pnpm --filter @workspace/vibe-score run typecheck` | Type-check the Vibe Score app |
| `pnpm --filter @workspace/vibe-score run build` | Create the static Next.js export in `artifacts/vibe-score/out/` |

## Repository layout

This repository preserves the pnpm workspace used by the Replit project:

- `artifacts/vibe-score/` — Next.js app, Robinhood Chain configuration, wallet connection, and score calculation
- `artifacts/api-server/` — shared Express API service
- `artifacts/mockup-sandbox/` — isolated component-preview workspace
- `lib/` — shared API, database, and generated client packages
- `scripts/` — workspace utilities

The Vibe Score web app reads the chain and explorer directly from the browser; it does not require the API Server or a database to display a score.

## Deployment

The app is configured for a static export. Run the build command above and serve the contents of `artifacts/vibe-score/out/` from a static host. Set `BASE_PATH` when hosting under a URL subpath. If enabling WalletConnect in a published build, provide `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to the build environment.

## Contributing

Bug reports, focused improvements, and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change, and see [SECURITY.md](SECURITY.md) for vulnerability reports.

## License

Vibe Score is released under the [MIT License](LICENSE).