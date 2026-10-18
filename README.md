# Mintbay Agent

Use this skill to deploy fully on-chain generative NFT collections from [Mintbay Studio](https://mintbay.fun/studio) Build IDs via Bankr, following Net Protocol's simple **encode-only -> sign -> submit** pattern. It also supports sharing Mintbay NFT token/gallery links.

## One-command preparation

From the cloned repository (Node.js 18+):

```bash
npm install --prefix assets/contracts/v5 --no-audit --no-fund
node scripts/prepare-deploy.mjs YOUR_BUILD_ID --encode-only --out ./generated/YOUR_BUILD_ID
```

This validates the immutable build, generates collection-specific Solidity, compiles with pinned solc 0.8.24 + dependencies, checks contract size, and creates unsigned `transaction.json` plus full `StandardInput.json` for explorer verification. **It does not send a transaction.** Use Bankr to sign and broadcast a **contract-creation** transaction only if its API supports an absent/null `to` field.

## Example request

> Bankr, deploy my Mintbay NFT collection on Robinhood Chain. Build ID: YOUR_BUILD_ID. Use the official Mintbay skill. Show my deployment transaction, contract address, and verified contracts (or verification-pending status).

The user confirms an irreversible transaction before sending. Do not put private keys or verification credentials in this repository. This skill does not assert that the V5 Solidity implementation has been audited or independently EVM-tested.

## Test source generation

```bash
node scripts/test-generator.mjs
```

See [SKILL.md](SKILL.md) and [references/DEPLOYMENT.md](references/DEPLOYMENT.md) for usage, limitations and links.
