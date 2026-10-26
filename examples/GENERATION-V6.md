> V6 migration note: this document contains historical steps; the single active V6 workflow is governed by SKILL.md. Do not deploy from an old example.

# V6 collection generation

Run `node scripts/generate-collection.mjs BUILD_ID --out DIR`, or `node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out DIR` for full compilation.

The Build ID is immutable and its config, raw art and compiled-artwork bytes are SHA-256 verified. The generator emits PascalCase collection filenames derived from the Studio collection name, the reusable V6 base and a `generation.json` with `contractName` and hashes. This is a source-generation tool, not a blockchain deployment command.

V6 differences: immediate 5% platform fee push; a bounded 10-seed *best effort* de-duplication check on trait IDs (last collision allowed, burned combinations remembered); configurable Burn & Claim source allowlist. Native ERC721 burn approvals are required. For a first V6 Burn & Claim test, a collection may list THE TESTERS `0x4e68e1F912d5D9c3fb6795B2af87FfaC87882575` as an allowed source.

The generator reads `mintbayV6.burnAndClaim.sourceCollections` as a list of address strings or `{contract:address}` when Burn & Claim is enabled. Studio must export this field; if a build requests Burn & Claim without approved sources, generation fails explicitly instead of silently changing the collection.

Runtime-size limits are real: external art and uniqueness logic may exceed EIP-170 for large collections. Always compile and check. `test-generator.mjs` is not a local EVM acceptance suite.
