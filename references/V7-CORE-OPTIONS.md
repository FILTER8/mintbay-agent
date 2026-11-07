# Mintbay V7 core feature options — deployment reference

The Mintbay Studio build is still immutable **V6 artwork/config schema**. V7 core features are selected at deployment source generation with a separately audited `--v7-options` JSON file, or with `config.mintbayV7` in a future published build. The generator hashes the resolved options and records them in `generation.json` and `deployment-manifest.json`. That separate options file is **not authenticated by the Studio build manifest**, so the creator must review and explicitly approve it and the constructor arguments.

## Example `v7-options.json`

```json
{
  "transfersLocked": true,
  "tokenBoundClaimEnabled": true,
  "lockOwnershipTransfersImmediately": false
}
```

Only these three boolean options are accepted. Defaults are `false`; no live-deployed contract is modified. `--v7-options` takes precedence over embedded `config.mintbayV7`. Configured immutable parent collections and claim prices still originate from the signed/hashed build.

## Generation and compilation

```sh
node scripts/test-generator.mjs
node scripts/prepare-deploy.mjs BUILD_ID --v7-options ./v7-options.json --out ./generated/BUILD_ID
```

The source generator and deploy preparer both propagate the flags and record a SHA-256 of the resolved options. Do **not** broadcast until the generated Solidity compiles with the pinned compiler and passes local full EVM mint, safe ERC-6551 receipt, burn/transfer rejection, Net integration, royalty and owner lock tests. The test-generator script is source-level regression coverage, **not** an EVM security or deployment approval.

## Core semantics

- `transfersLocked`: irrevocable collection-wide rule permitting mint (`from == address(0)`) and rejecting every ordinary transfer or burn. Constructor rejects enabling One Shot or Burn & Claim or nonzero royalty fee with the lock. Royalty setters also revert. There is no unlocking function. A holder may still approve a spender, but this grants no transfer ability.
- `batchHolderClaim(address[] sourceCollections, uint256[] tokenIds)`: accepts 1–50 source NFTs, different source collections permitted; validates ownership, remaining claim counts, lifetime supply and exact aggregate ETH payment. Duplicate source-token IDs cannot exceed the per-token allowance. Mints to the claimant wallet.
- `tokenBoundClaimEnabled`: enables `claimToTBA(sourceCollection, tokenId)` and `batchClaimToTBA(sources, ids)`. Both share the same claim allowance as normal claims, calculate each ERC-6551 recipient from a creator-approved source-specific registry, implementation, chain ID and salt, call registry `createAccount`, compare with `account`, check deployed bytecode, and `_safeMint` directly to the resulting account. The source NFT owner (not TBA) submits the transaction. The TBA must implement ERC721Receiver. `setClaimTBAConfig` is `onlyOwner` and must be called after deployment before TBA claims. Review registry/implementation code and salt on the target chain; never assume the Mintbay example registry or implementation is correct on arbitrary chains.
- `lockOwnershipTransfers()`: creator-controlled, irreversible function when ownership transfer was enabled in constructor. It disables both `transferOwnership` and `renounceOwnership`, but **does not** restrict other owner permissions. `ownershipTransferEnabled()` becomes `false` after the lock. To bind administration to a token-bound wallet, transfer the owner to that **already deployed and operational** TBA first, then have it call `lockOwnershipTransfers()`. **Do not** set `lockOwnershipTransfersImmediately: true` when the initially configured owner is not the desired final TBA.

## Important deployment caveats

1. The current generator only supports `deployment.adminMode: "standard"`; initial owner equals the configured EOA. An owner TBA must be reached by an authorized post-deployment `transferOwnership`, before locking. Direct TBA initial-owner deployment is **not** yet supported by this generator.
2. Enabling `transfersLocked` requires an immutable build with Burn & Claim and One Shot disabled and royalties configured as 0. The tooling refuses invalid combinations; do not change source config hashes to circumvent that check.
3. `setClaimTBAConfig(source,registry,implementation,salt,chainId)` is per source. The collection owner decides which ERC-6551 account is canonical. Inspect deployed registry, implementation and the actual wallet ownership/receiver behavior before sending claims. It is not a generic method for all unknown TBA implementations without configuration.
4. This repository update does not touch the PNG renderer, discovery worker, Cloudflare Studio frontend, already deployed collections, or transaction signing. UI forms must follow verified ABI and runtime behavior, not precede them.
5. Audit EVM compatibility of the non-transferable hook against the exact pinned `ERC721AC` dependency before any live deployment, and confirm that all potential burn and transfer entrypoints are covered. Reentrancy, malicious registry, owner-change and claim replay adversarial tests are required.
