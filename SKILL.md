---
name: mintbay-agent
description: Deploy fully on-chain Mintbay generative NFT collections from Studio Build IDs on Robinhood Chain with Bankr CREATE2; prepare exact Solidity source and bytecode, verify deployment, and share token/gallery links.
---

# Mintbay: Build ID -> Bankr -> verified NFT

Use this skill for Mintbay Studio NFT deployments. **Never copy example contract art or reimplement the collection by hand.** The immutable Build ID defines it.

## Prepare

```bash
npm install --prefix assets/contracts/v5 --no-audit --no-fund
node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out ./generated/BUILD_ID
```

Read `prepare-result.json`; confirm hashes, correct configuration, runtime size and compiler warnings. The generated Solidity contract name is derived from the collection name (e.g. `TheTesters.sol`). The full `StandardInput.json`, bytecode and ABI must be preserved. **The compiler output is not an audit.** If a new collection exceeds EIP-170/EIP-3860, stop and report its actual size; do not silently disable features.

## Deploy using Bankr

Use Bankr's native `deploy_contract` CREATE2 workflow on Robinhood (chain 4663), not `submit_raw_transaction` (`to:null` is not supported there). Supply the exact generated creation bytecode and verification material. Verify the initial owner from the build and show the predicted address, parameters and estimated cost. Ask for explicit creator approval **before** broadcasting. Never handle a wallet private key.

After the successful receipt, read the actual CREATE2 address and deployed code; verify on Robinhood Etherscan with saved `StandardInput.json`. The factory receipt may show `contractAddress:null`; obtain the collection address from the Bankr deployment result/factory logs and confirm bytecode. Do not claim verified without explorer confirmation.

## Net launch message after deployment

After a successful deployment (not during construction), use the **Net Protocol skill** to announce the collection once to `feed-<deployedCollectionAddress>` on chain 4663. Include the collection name and verified contract URL. Get the Net transaction hash and report it. **Do not duplicate an existing announcement on retry.** Failed feed posting must not invalidate a completed NFT deployment; report it separately. Net directory indexing may lag.

## V5.1 protocol rules

- Paid public mint and paid Holder Claim push exactly **5%** to `0xcdb9DB46d6C251A334EfF599012011Dc63ff5717` in the same transaction. Creator's remaining 95% accrues for permissionless `withdrawCreatorProceeds()` paid to the configured payout recipient. Failed platform transfer reverts the mint.
- Lifetime minted supply is shared between public mint, creator mint, Holder Claim, Burn & Claim and One Shot. Burns never free mint slots.
- Best-effort duplicate prevention: **up to 10 candidate seeds per minted NFT**. Try for an unused *trait combination*. If all collide, allow the tenth even if previously used. Preserve remembered combinations across burns. This is *not* guaranteed visual uniqueness or perfect trait distribution.
- Burn & Claim is free, atomic and 1:1. The source NFT owner must approve the destination contract for the source token (`approve(destination, tokenId)` preferred over blanket approval). The source needs an ERC721-compatible `burn(uint256)` that honors operator approvals; not all ERC721 collections qualify. Configure allowed burn source contracts from the build. Do not disable it silently.
- Owner is `deployment.expectedDeployer` from the immutable Studio build (the name is historical; it is the intended `initialOwner`, not necessarily the Bankr/CREATE2 caller). Confirm it before deployment. Future Studio support for a separate explicit owner field requires a coordinated schema update.
- Keep existing Limit Break royalties and Net mint/transfer/burn hooks; display ERC2981 royalty settings accurately and do not infer forced royalties from ERC2981 alone.
- HoodWallet administrator mode remains unsupported by this base; stop for that specific case. Do not block merely for legacy draft/attestation fields if the creator approves the exact transaction.

See [DEPLOYMENT.md](references/DEPLOYMENT.md) for the handoff and [GENERATION-V5.md](references/GENERATION-V5.md) for generation. No registration secret is stored in this skill.

## Share

Token: `https://mintbay.xyz/token/{chainId}/{contractAddress}/{tokenId}`

Gallery: `https://mintbay.xyz/gallery/share?chain={chainId}&collection={contractAddress}&ids={comma-separated-ids}&grid={gridWidth}&gap=20&margin=68&scale=100&bg=white&labels=0`

See [URLS.md](references/URLS.md). `node scripts/test-generator.mjs` only checks generation, not EVM execution.
