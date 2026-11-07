# Mintbay universal PNG renderer: isolated proof of concept

## Reference and decision

Review the supplied `IndelibleGenerative.sol`: `hashToSVG()` uses SSTORE2 bytecode and Base64 but layers image data through CSS `background-image`. Mintbay retains immutable-bytecode and Base64 principles, **not** CSS composition, original Indelible token selection or mint flow. Use SVG `<image>` in natural bottom-to-top Studio layer order.

## Build proven vs unproven

- Bankr reported `PASS_PNG_ARTWORK_PARITY` for `8c117dfd-ebcd-48e4-aa05-0b63a64acce4` with 25 assets, 8 layers, 3,437 bytes and no changed pixels. We have not independently downloaded its 25 PNGs in this environment.
- We implemented `MintbayPackedPngRendererPOC.sol`: multi-shard EXTCODECOPY reader (including trait bytes split across shard boundaries), SVG `<image>` and fully on-chain base64 JSON metadata for **explicit trait IDs**.
- Local Node and CairoSVG/Pillow fixture tests pass for RGB values, transparency, image stacking and shard splitting; **Solidity compilation, EVM execution, real tokenURI gas and marketplace compatibility are NOT yet verified**.
- `MintbayPackedPngRendererPOC.sol` intentionally has no weighted trait selection, fingerprinting, royalty/minter wiring or `tokenURI(uint256,bytes32)` interface. Do not point a real collection at it.

## Reproduce with the actual immutable build

```bash
node scripts/verify-png-build.mjs 8c117dfd-ebcd-48e4-aa05-0b63a64acce4
node scripts/pack-png-shards.mjs 8c117dfd-ebcd-48e4-aa05-0b63a64acce4 --out ./png-shards
node scripts/test-png-renderer-poc.mjs ./png-shards ./png-shards/renderer-poc
```

Open `png-shards/renderer-poc/sample.svg` in a browser. Its PNG layers must exactly correspond to the selected trait IDs in `sample-selection.json` and `png-shards.json`; it is a deterministic sample, not `Data.choose(seed)`.

## Local Solidity/Foundry or Hardhat validation before integration

1. Install npm contract dependencies in `assets/contracts/v6` (includes `solady` and `solc@0.8.24`), or use a locally installed Foundry toolchain. Compile `assets/contracts/png-poc/MintbayPackedPngRendererPOC.sol` with `solc 0.8.24` and resolve the `solady` imports. **Do not claim compiler success unless run.**
2. Deploy the generated `pngShard0-initcode.txt` (and any additional shard initcodes) on a local EVM using CREATE2; confirm `eth_getCode` hashes against `png-shards.json` and check byte 0 is the STOP guard.
3. Run `node scripts/prepare-png-renderer-poc-args.mjs ./png-shards ADDR0 [ADDR1 ...]` using **confirmed** local shard contract addresses. Deploy the POC renderer with `png-renderer-poc-args.json` as its constructor inputs.
4. Compare `traitPng(id)` for every trait against the manifest SHA-256; call `svgFromTraits(ids)` for representative selections; decode `tokenURIFromTraits(0, ids)` and independently rasterize. Check exact artwork parity and transparency.
5. Measure actual shard deployment gas, renderer deployment gas, `traitPng` gas and `tokenURIFromTraits` gas. Check EIP-170/EIP-3860, RPC image support, and large multi-shard behavior.
6. **Only after these pass**, integrate `Data.choose(seed)`, exclusions, `fingerprint(seed)`, metadata attributes and the unchanged core renderer interface `tokenURI(uint256,bytes32)` into the production generator and deploy planner; keep all Net Protocol and collection minting features intact.

## Design notes

- Solidity constructor currently stores piece descriptors and shard addresses in state for flexibility; this is not gas-optimal for many traits. Benchmark against generated immutable descriptors before choosing final layout.
- SVG Base64 output size is greater than raw PNG size. Total on-chain data-deposition gas is not negligible (200 gas per runtime byte under EIP-170-era EVMs).
- If a PNG crosses shards, its pieces must be concatenated **before** Base64 encoding. Encoding each shard independently would corrupt the PNG.
- `prepare-deploy.mjs` and `generate-collection.mjs` are still unchanged. `discovery.ts` is unrelated and not modified.
- Never deploy POC on mainnet or imply that an untested contract is deployment-ready.
