---
name: mintbay-agent
description: Deploy fully on-chain generative Mintbay NFT collections from immutable Mintbay Studio Build IDs through Bankr deploy_contract on Robinhood Chain. Generate and compile the exact Solidity source, submit the creation bytecode through Bankr CREATE2, and report deployment and verification. Also share Mintbay NFTs and galleries.
---

# Mintbay: Build ID -> Bankr deploy_contract -> NFT

Use this skill when asked to deploy a Mintbay Studio collection. The Build ID is the specification. Do not hand-code a collection or reuse sample artwork.

## 1. Prepare the deployable bytecode

From the repository root:

```bash
npm install --prefix assets/contracts/v5 --no-audit --no-fund
node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out ./generated/BUILD_ID
```

The command validates immutable build hashes and artwork lineage, generates the collection-specific Solidity, compiles with pinned solc 0.8.24 (viaIR, optimizer runs 200, Cancun), and checks runtime and initcode size. Outputs: `transaction.json` (creation bytecode in `data`, `to:null`), `StandardInput.json`, `abi.json`, `prepare-result.json`, `sources/`. Treat these outputs as the exact deployment artifacts; do not substitute example contract source or alter code without the creator's approval.

## 2. Deploy using Bankr's native contract tool

**Use Bankr `deploy_contract`, not `submit_raw_transaction`.** Bankr's raw submit interface requires a recipient address and rejects `to:null`. Its native `deploy_contract` route supports CREATE2 deployment through `0x4e59b44847b379578588920cA78FbF26c0B4956C` on Robinhood Chain (4663). Supply the **exact generated creation bytecode** from `transaction.json` and the matching Solidity/Standard JSON verification material as supported by the installed Bankr tool. Do not send the creation bytecode as an ordinary call to the proxy address unless Bankr's own deployment interface explicitly specifies that encoding.

Confirm the deployed owner is the Studio `expectedDeployer` / initial owner set in generated Solidity; CREATE2 proxy's caller is not necessarily the owner. Check any deployment tool schema and review the tool's predicted address and cost. Tell the creator the exact chain, wallet, fees, mint price, supply, claim sources, contract size and any relevant warnings. **Ask for explicit approval before the irreversible broadcast.** No private keys in chat or repo.

Do **not** add a separate draft-status or release-attestation prerequisite. `status:draft` or `template.verified:false` alone should not prevent a creator-approved first deployment. Still stop on failed hashes, compile failures, unsupported collection features, oversize bytecode, incorrect fee address, or mismatched parameters. An approved transaction is not an audit.

## 3. Confirm and verify

After Bankr deployment, require a successful transaction receipt, obtain the *actual deployed contract address* from the Bankr `deploy_contract` response / CREATE2 factory event or computed address, and verify deployed bytecode exists at that address. **A CREATE2 factory call receipt commonly has `contractAddress:null`; do not mistake it for failure.** Cross-check the resulting address with the tool's prediction, read on-chain owner, maxSupply, price, mint fee and other material settings where possible, and give the real tx hash and explorer link.

Use the saved `StandardInput.json`, compiler version and settings for Bankr's built-in explorer verification if available. Confirm verification status before claiming 'verified'; otherwise report 'verification pending' with the actual deployment address. Mintbay backend registration is a separate optional authenticated step, never a condition for deploying and never a secret stored in this skill.

## V5 invariants

- Protocol fee fixed to **5%** of paid primary mints, receiver `0xcdb9DB46d6C251A334EfF599012011Dc63ff5717`. Do not change either value.
- One shared lifetime max supply. Burns do not free slots; public wallet limit 0 means unlimited.
- Studio build defines mint price, supply, features, royalty receiver and amounts, owner, payment recipient and holder claim sources. Best-effort Net hooks. ERC2981 royalty information is **not** proof of forced royalty enforcement.
- Generator intentionally rejects unsupported HoodWallet-admin and Burn & Claim configurations; disclose a genuine incompatibility rather than silently omit it.
- The existing reference is candidate software. Compilation does not prove economic correctness, EVM test coverage, or security. Never invent test, verification or deployment success.

## NFT and gallery sharing

Token: `https://mintbay.xyz/token/{chainId}/{contractAddress}/{tokenId}`

Gallery: `https://mintbay.xyz/gallery/share?chain={chainId}&collection={contractAddress}&ids={comma-separated-ids}&grid={gridWidth}&gap=20&margin=68&scale=100&bg=white&labels=0`

See [DEPLOYMENT.md](references/DEPLOYMENT.md) for detailed handoff and [URLS.md](references/URLS.md) for sharing. `node scripts/test-generator.mjs` checks source generation only, not EVM behavior.
