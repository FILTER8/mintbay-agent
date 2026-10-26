# Mintbay V6 - single active repository

V6 replaces V5.1 as the active generator. This is a development-only migration, **not yet production-safe**.

## Prepare

```bash
npm install --prefix assets/contracts/v6 --no-audit --no-fund
node scripts/prepare-deploy.mjs BUILD_ID --out ./generated/BUILD_ID
```

The output currently includes an experimental two-component renderer + NFT core manifest. **Do not broadcast** until HTML, ERC-6551, simulation, CREATE2 orchestration and feature-parity testing are completed.

The existing build API still provides V5 configuration fields; the generator reads those fields as transitional input. Full V6 studio/schema integration is not yet implemented.

See `SKILL.md` for safety gates and work instructions.

## V6 optional fully on-chain HTML media (experimental)

Keep a single V6 deployment architecture. To attach small self-contained HTML artwork, add **exactly one** `/* MINTBAY_NFT_INJECTION */` marker inside an existing `<script>` element, before any JavaScript that reads `window.__MINTBAY_NFT__`. The generator inserts `id`, `seed` and `chosenTraits` at that marker. The game code must actually use these values; merely embedding the injected object is not enough.

```bash
node scripts/prepare-deploy.mjs BUILD_ID --html ./game.html --out ./generated/BUILD_ID
```

The generator keeps the original HTML bytes without unsafe regex-based JavaScript minification. Each side of the marker must be at most 20,000 UTF-8 bytes. It creates two SSTORE2-compatible creation-bytecode artifacts, plus the separately compiled renderer and NFT core. Existing static SVG builds do not require chunks. `deployment-manifest.json` remains **NOT_READY_TO_BROADCAST** until local EVM tests validate the entire dependency graph and `tokenURI` execution. Nothing is broadcast by these scripts.

Run `node scripts/test-generator.mjs` to check both static and media code-generation invariants. Full Solidity compiler dependencies require `npm install --prefix assets/contracts/v6`, then local EVM verification before approving any mainnet transaction.
