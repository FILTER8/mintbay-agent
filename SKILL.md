---
name: mintbay-agent
description: Deploy fully on-chain generative Mintbay NFT collections from Mintbay Studio Build IDs through Bankr on Robinhood Chain; generate unsigned contract-creation transactions, compile and prepare exact sources for verification. Also share Mintbay token and gallery pages.
---

# Mintbay: Build ID -> Bankr -> NFT

The Mintbay Studio Build ID is the collection specification. Use the repository CLI; do not hand-write a new collection or copy THE TESTERS. **Follow this path by default** when a user says "deploy my Mintbay collection":

```bash
# Install pinned compiler dependencies once in your workspace:
npm install --prefix assets/contracts/v5 --no-audit --no-fund
# Generate, validate and compile into an UNSIGNED Robinhood contract-creation tx:
node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out ./generated/BUILD_ID
```

The script verifies immutable Studio build artifact hashes and exact artwork lineage, calls the generic generator, compiles all local Solidity and dependency sources using solc 0.8.24 (`viaIR`, optimizer 200, Cancun), checks EIP-170/EIP-3860 bytecode limits, and writes:

- `transaction.json`: `{ "chainId":4663, "to":null, "data":"0x...", "value":"0" }` (contract creation, NOT a normal call to a target contract)
- `StandardInput.json`: full Solidity compiler input, including resolved dependency sources
- `abi.json`, `prepare-result.json`, `sources/`: reproducibility and provenance

**Bankr signs and sends; Mintbay does not hold keys.** Verify Bankr's installed signing/submit capability explicitly supports **contract creation** (`to: null` / omitted `to`). The Net `--encode-only` contract-call pattern is the model, but an ordinary transaction-to-address command does not deploy a contract. If Bankr does not support contract creation, report this specific blocker; never supply a fake `to` address. Ask the creator to approve the exact chain, estimated gas and deployment before broadcast. Do not ask for or handle a private key.

After broadcast, await the transaction receipt, require status success and extract the real contract address; return the tx hash and Robinhood block explorer link. For source verification use the saved `StandardInput.json`, exact compiler version and settings; report `verification pending` until an explorer confirms it. Backend registration may be performed later by an authenticated service, **not by embedding a secret in the skill**. Do not falsely claim a deployment, verification, audit or EVM test succeeded.

**No arbitrary draft/attestation blockade:** `status: draft` and `template.verified: false` describe Studio's current publication state and do not stop *preparing* a build. For a requested mainnet broadcast, the creator explicitly approves the transaction after seeing the generated contract, fees, supported features and warnings. Such approval is not a security audit or evidence of template verification. A failed hash, compilation, feature gate or size check always stops the flow.

## V5 contract economics

- Fixed 5% fee on paid primary mints: `0xcdb9DB46d6C251A334EfF599012011Dc63ff5717`. Never change this constant or rate.
- Shared lifetime supply; burning does not reopen mint capacity. Zero wallet limit means unlimited.
- Features and constructor values come from the signed-off Studio build, not inferred defaults. Source imports include Limit Break ERC721AC and best-effort Net Protocol hooks. ERC2981 royalties are **not** guaranteed marketplace enforcement.
- Current generator intentionally rejects HoodWallet admin mode and enabled Burn & Claim rather than silently dropping them. If unsupported, tell the user precisely which feature blocks this build; do not deploy a modified configuration without approval.
- THE TESTERS is only an example and is not the template used for a new Build ID. Review [PROTOCOL-RULES.md](references/PROTOCOL-RULES.md) when modifying contract logic.

## Share an NFT or gallery

Token: `https://mintbay.xyz/token/{chainId}/{contractAddress}/{tokenId}`

Gallery image-card page: `https://mintbay.xyz/gallery/share?chain={chainId}&collection={contractAddress}&ids={comma-separated-ids}&grid={gridWidth}&gap=20&margin=68&scale=100&bg=white&labels=0`

Use the page for social preview, not the PNG download API. Verify IDs and ownership before attributing NFTs to a wallet. These links do not themselves upload a native X image. See [URLS.md](references/URLS.md) for more.

## Troubleshooting

Read [DEPLOYMENT.md](references/DEPLOYMENT.md) for the exact CLI steps, Bankr handoff and verification. `node scripts/test-generator.mjs` exercises source-generation checks only; it does not execute EVM transactions. Always report actual failures instead of introducing new policy gates or inventing test results.
