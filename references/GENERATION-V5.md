# Mintbay V5 collection generation and ordinary deployment

## Requested user entry point

`@bankrbot deploy my Mintbay NFT collection on Robinhood Chain. Build ID: YOUR_BUILD_ID. Use the official Mintbay skill. Show deployment transaction and verified contracts.`

This is the **normal** deployment path, not an experimental exception. The repository currently contains **candidate** base Solidity and a fully materialized THE TESTERS example; it does **not** yet contain an approved deterministic generator or passing EVM tests. Do not misrepresent it as a ready-to-run one-command deployer.

## Generating from ANY build (never hard-code the example)

1. Fetch manifest and all three immutable artifact URLs. Check raw-byte SHA-256, compiledArtwork lineage, actual `chainId`, collection config and original trait order. Refuse mismatch.
2. Start with `assets/contracts/v5/MintbayNetIntegratedERC721A.sol` after acceptance/review. Do not duplicate or hand-wave base behavior. Inspect source for feature parity and known issues in `assets/contracts/v5/README.md`.
3. Generate a **new collection-specific** Data.sol using compiled-artwork `layers`, `traits`, ordered weights, palette, pixels and all exclusion mask words. Validate numeric limits and bitwise semantics. Do not truncate masks over 256 bits; the current example's single-word mask approach works only for its 26 traits.
4. Generate Renderer.sol from verified data: actual grid dimensions, pixels, palette, trait types/names, escaped metadata, on-chain SVG + base64 JSON. Do not embed example collection name or 12x12 assumptions.
5. Generate Collection.sol with accurate constructor arguments and feature booleans from config, deployer mode/owner/payout/royalties, all configured Holder Claim source contracts and their individual prices, and optional Unicode header as one `//` comment per line. The platform fee address and 500 bps must stay immutable in base.
6. Generate exact complete Standard JSON input including **all imported dependency contents**, pin solc/optimizer/viaIR and compile the actual sources. Record all SHA-256 hashes, bytecode size, constructor args and deployment simulation/tests.
7. Resolve mismatches: the candidate base calls `creatorMint(address,uint256)`; do not claim `mintToCreator` exists. Verify and use actual ABI. Preserve all relevant Net hooks and keep features correctly gated.
8. Only when the canonical base is approved, EVM tests pass, and an authoritative release/certification mechanism attests the build to that template, request explicit user approval for deployment on the manifest chain. Broadcast through the authorized Bankr account, wait for receipt, verify exact Standard JSON contract source on explorer, then return tx + verified contract links. Report failure transparently.

## Release-state truth

Current Mintbay API manifests use `status: draft` and `template.verified: false`. No server-side certification endpoint was provided. An immutable build cannot be certified by editing its R2 bytes in place; use a separate, authenticated, verifiable release attestation linked to immutable build ID/artifact hashes and approved template SHA. Until that exists, remain read-only. Never self-assert `template.verified: true`, bypass the gate on user enthusiasm, or deploy a copied example for another collection.
