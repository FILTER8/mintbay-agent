# PNG Bytecode Shard Limits and Net Protocol Comparison

## Separate constraints

- EIP-170 (traditional EVM runtime): **24,576 bytes per deployed contract**; not per artwork layer or PNG. One layer can span multiple shards.
- EIP-3860: **49,152 bytes maximum initcode**; check creation code plus runtime bytes and constructor parameters.
- Mintbay packer defaults to **20,000 bytes of payload per shard**. Each shard uses a 1-byte STOP guard, so default runtime is at most 20,001 bytes. It deliberately leaves room under EIP-170.
- Each PNG is preserved *byte-for-byte*. If a PNG exceeds the remaining space, the packer splits the PNG into multiple shard pieces; `locations[].pieces` describes how to reassemble the exact original compressed bytes.
- An artwork layer is a semantic grouping of traits and has **no single-contract size limit**; do not use the word "layer" to mean "data shard".

## Net Protocol reference

The user-provided Net Protocol skill snapshot (2026-10-15) documents `netp storage upload` auto-chunking files **up to 80 KB** and `--encode-only` producing *ordered transaction arrays*. These are Net Protocol storage-system rules, **not** Mintbay bytecode runtime rules. Borrow the safety pattern: validate each chunk, emit ordered transactions, and verify receipts before using dependent addresses. Do not use Net Protocol storage contracts as dependencies for Mintbay image rendering without a separate design and gas audit.

## Artifact production

```bash
node scripts/pack-png-shards.mjs BUILD_ID --out ./png-shards
# Or offline:
node scripts/pack-png-shards.mjs --local --dir ./immutable-build --out ./png-shards
```

Inputs: immutable manifest, `png-manifest.json`, exact PNG binaries. Outputs: `png-shards.json`, `pngShardN-initcode.txt`, `pngShardN-runtime.bin`.

The tool verifies PNG chunk CRC32, dimensions, hashes, index order and reassembles every asset from its packed bytecode shard representation. The offsets account for the leading SSTORE2 guard byte. Output is **unsigned**, not a deployed renderer or an approval to broadcast.

## Integration gate

The current Mintbay V6 source generator has a separate pixel renderer; do not deploy its renderer and assume it consumes `png-shards.json`. Before switching production generator: implement the renderer `EXTCODECOPY` reader for multi-piece PNGs; pass predicted CREATE2 shard addresses; ensure NFT core interface compatibility; benchmark `tokenURI()` / on-chain metadata and image parity; then switch the skill to the new generator in one tested change. Keep discovery unchanged.
