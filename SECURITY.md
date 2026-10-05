# Security policy

Vibe Score is a testnet-oriented open-source project and has not been independently security-audited. Do not use it with valuable assets or production credentials.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through GitHub's private vulnerability reporting feature when it is enabled for this repository. If private reporting is unavailable, contact the repository owner privately through GitHub. Do not post exploit details, private keys, seed phrases, or other credentials in a public issue.

## Scope notes

- The app reads public Robinhood Chain Testnet and explorer data in the browser.
- Wallet connection may ask the wallet to connect or switch networks. The score flow does not submit transactions.
- Never share or commit wallet secrets. The optional WalletConnect project ID is public configuration; it is not a wallet credential.