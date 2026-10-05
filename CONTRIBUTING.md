# Contributing

Thanks for helping improve Vibe Score. Contributions should preserve the project's testnet-only scope and make scoring inputs and limitations clear.

## Before opening a pull request

1. Open an issue for substantial changes so the scope can be discussed first.
2. Keep changes focused and explain the user-facing impact.
3. Never commit wallet private keys, recovery phrases, API credentials, or local `.env` files.
4. Verify any chain addresses and explorer assumptions against Robinhood Chain Testnet.

## Local checks

Use Node.js 24 and pnpm 10. From the repository root, run:

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm --filter @workspace/vibe-score run build
```

Wallet approval and mobile WalletConnect behavior require manual testing with a test wallet; a successful build does not verify those flows.

## Pull requests

- Describe the change and why it is needed.
- Include relevant screenshots for visual changes.
- Note any changes to scoring, chain configuration, environment variables, or static hosting requirements.
- Keep generated output and local build caches out of pull requests.