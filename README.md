# Mintbay Agent — Bankr deploy_contract workflow

Deploy on-chain Mintbay Studio builds on Robinhood Chain (4663) using Bankr's native CREATE2 `deploy_contract` tool.

```bash
npm install --prefix assets/contracts/v5 --no-audit --no-fund
node scripts/prepare-deploy.mjs YOUR_BUILD_ID --encode-only --out ./generated/YOUR_BUILD_ID
```

This generates exact Solidity sources, ABI, complete `StandardInput.json`, and a `transaction.json` containing unsigned **creation** bytecode (`to:null`). Provide the bytecode and verification files to Bankr `deploy_contract`; do not use `submit_raw_transaction` for creation. Confirm predicted address, cost and settings, obtain creator approval before broadcast; wait for receipt and confirm deployed code and explorer verification.

See `SKILL.md` and `references/DEPLOYMENT.md`. The candidate V5 base and generator are included in this repository. Do not claim an audit or successful EVM behavior testing merely from compilation.
