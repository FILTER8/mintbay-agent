# Bankr — new compiled-artwork V5 test (STRICTLY READ-ONLY)

@bankrbot reinstall/update the canonical Mintbay skill from https://github.com/FILTER8/mintbay-agent and load `references/BUILDS.md`, `references/NET-INTEGRATION.md`, `references/DEPLOYMENT.md` plus the official Net Protocol NFT collection reference.

Review **this** Mintbay V5 build: https://api.mintbay.xyz/v1/builds/ebd5e0d8-2919-4f8b-bce9-80ebc5ae00e9

1. Read the manifest and fetch **config, artwork, and compiledArtwork** from its exact URLs. Calculate SHA-256 on every raw response body and compare to manifest. Confirm `compiledArtwork.source.rawArtworkSha256` matches the raw artwork hash. This is an immutable **draft**, not authorization to deploy.
2. Audit every layer/trait order, ID, name, numeric weight, indexed palette color, pixel bytes, 25 symmetric incompatibility pairs and mask words against original source. Test byte-by-byte/pixel-by-pixel round-trip; fail on any substitution.
3. Generate collection-specific Net/ERC721A source using **verified compiledArtwork values** as Solidity constants. Select standard/HoodWallet base strictly from config. Do not reindex, change palette or invent traits. Preserve Net integration.
4. Compile, inspect EIP-170 runtime size, and **run local EVM tests against emitted Solidity**: deterministic selection, no forbidden pairs across seeds, exact SVG/metadata pixels and names, weights/rarity impacts. Test selected minting features and report every unsupported addon separately; don't silently omit or 'fix' choices.
5. Provide exact generated source file hashes, compilation/test logs, PASS/FAIL and discrepancies. If raw data or verification tools are unavailable, state exactly which check did not run. No claims based only on simulations divorced from emitted Solidity.

**STRICTLY READ-ONLY.** Do not sign, deploy, mint, broadcast transactions, register a deployment, or spend funds.
