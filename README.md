# Mintbay Agent — V5.1

One standard path: **Studio Build ID → deterministic Solidity generation → solc compilation → Bankr CREATE2 → Etherscan verification → optional Net launch feed**.

## Prepare (no wallet needed)

```bash
npm install --prefix assets/contracts/v5 --no-audit --no-fund
node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out ./generated/BUILD_ID
```

Bankr's `deploy_contract` submits the exact initcode. The creator approves before broadcast. See `SKILL.md`.

V5.1 includes automatic 5% platform fee push, best-effort ten-attempt trait combination de-duplication, readable Solidity filenames and Burn & Claim source configuration. Existing live contracts such as THE TESTERS are **unchanged**.

Run generator checks: `node scripts/test-generator.mjs`.

**Important:** On-chain contract-size, gas and full EVM feature tests must be checked with a real compilation/test environment before treating a new collection as production ready.
