# Bankr Mintbay deployment example

Prompt: `Deploy my Mintbay NFT collection on Robinhood Chain. Build ID: YOUR_BUILD_ID. Use the official Mintbay skill. Show deployment transaction and verified contracts.`

1. Run `node scripts/prepare-deploy.mjs YOUR_BUILD_ID --encode-only --out ./generated/YOUR_BUILD_ID` after pinned npm installation.
2. Read `transaction.json` creation `data` plus `StandardInput.json`, confirm code and wallet/fees, and send to Bankr's **native `deploy_contract`** on Robinhood Chain 4663 (CREATE2).
3. Show predicted address and gas; obtain user approval before broadcast.
4. Report successful receipt, actual deployed contract with bytecode, and explorer verification status. A CREATE2 factory receipt has no `contractAddress`; use factory result/events or predicted address and confirm on-chain code.
