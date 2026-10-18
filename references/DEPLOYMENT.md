# Mintbay deployment through Bankr CREATE2

1. Run `npm install --prefix assets/contracts/v5 --no-audit --no-fund` and `node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out ./generated/BUILD_ID`.
2. Inspect `prepare-result.json` and sources: collection name/initial owner, source hashes, 5% fee destination, enabled options, Burn & Claim source allowlist, initcode and runtime size. A previous build's bytecode is never a substitute.
3. Use the native Bankr **`deploy_contract`** tool with exact initcode and the saved Solidity Standard JSON for verification. Do not send initcode through `submit_raw_transaction` or assume a CREATE2 proxy address is an ordinary call destination.
4. Show gas/cost, chain 4663, predicted contract address and current owner from build; obtain explicit user approval before broadcast.
5. After receipt, verify deployed bytecode at actual CREATE2 address and verify source via Robinhood Etherscan. Return the deployment hash and verification link. If verification is not complete, say pending.
6. On successful deployment, check whether launch feed `feed-<contractAddress>` already has the announcement; post once with the Net Protocol skill if not. Failure to post doesn't undo deployment. Give the Net transaction hash if successful.
7. Mintbay discovery registration is a separate authenticated operation, never a precondition for deploying and never performed with secrets embedded in the repo.

The `deployment.expectedDeployer` address is passed as the **initial owner**, even though the CREATE2 factory is the actual deployment caller. Confirm it is the intended final owner; ownership transfer need not be a separate deployment step.

Burn & Claim: source ERC721 must authorize the destination contract to `burn(tokenId)`. Prefer token-level `approve(destination, tokenId)`; exercise the atomic action only after the source NFT owner explicitly approves.

Do not claim fee payout, distinct artwork, code verification or Net posting succeeded before the respective real transaction/check confirms it.
