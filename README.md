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

The generator keeps the original HTML bytes without unsafe regex-based JavaScript minification. The entire template (plus a 2-byte marker offset) must fit in 20,000 UTF-8 bytes. It creates one immutable media bytecode artifact. Artwork trait records are separately partitioned into 32-trait Solidity shard contracts; the generated data router delegates reads to those shards, and the external renderer queries the router. Each component has its own EIP-170 limit; the full compilation must still pass. Existing static SVG builds do not require chunks. `deployment-manifest.json` now reports **V6_UNSIGNED_DEPLOYMENT_PREPARED**. Bankr may submit the ordered CREATE2 transactions after the creator explicitly approves them and the chain, CREATE2 factory, dependency addresses, and any deployed runtime code are verified. The preparer itself does not broadcast. Local EVM mint/metadata tests are strongly recommended and must not be represented as completed if they have not run. ArcadeGamingVault and paid gameplay are independent of the Mintbay V6 deployment flow.

Run `node scripts/test-generator.mjs` to check both static and media code-generation invariants. Full Solidity compiler dependencies require `npm install --prefix assets/contracts/v6`, then local EVM verification before approving any mainnet transaction.

## V6 Studio / Worker compatibility (October 2026)

New Studio uploads must contain `mintbayV6: { schemaVersion: 6, ... }` and `deployment.baseContract: "assets/contracts/v6/MintbayCoreERC721A.sol"`. Old V5.1 build records remain read-only. The prep tool writes an offline CREATE2 ordered `deployment-manifest.json` and role-specific calldata files; no broadcasting is implemented. This is still **not live deployment ready** until local EVM mint/metadata tests and runtime code checks pass.

## Renderer upgrades, animation and playable NFTs

Generated V6 collections include owner-controlled `setRenderer(address)` and irreversible `lockRenderer()`; inspect `isRendererLocked()` before any update. The optional `--html` path provides a self-contained on-chain `animation_url` for small HTML pages or games (single 20 KB media chunk). SVG media can also be animated using self-contained SVG features, subject to marketplace support. Large multi-chunk interactive projects such as ArcadeMachine require custom, separately verified renderer/game contracts. See [Renderer and HTML workflow](references/RENDERERS-AND-HTML.md).

## PNG artwork migration — proof first (November 2026)

Studio/Worker now publish `png-manifest.json` and compressed PNG trait assets. The agent's current V6 generator **does not yet consume those assets**; it still uses indexed pixels and SVG rectangles. The target is to replace this renderer, not keep a permanent V1 fallback. Before asking Bankr to deploy it, run the asset audit:

```bash
node scripts/test-png-verifier.mjs
node scripts/verify-png-build.mjs e599e303-bd44-464d-85ab-fc3c21144b6c --report png-audit.json
# Or: node scripts/verify-png-build.mjs --local --dir ./downloaded-build
```

See [PNG renderer migration and acceptance gates](references/PNG-RENDERER-MIGRATION.md). **No production generator or CREATE2 deployment behavior has changed in this audit-only repository update.** Discovery is separate and must remain untouched.

## PNG bytecode storage preflight (new)

Run `node scripts/pack-png-shards.mjs BUILD_ID --out ./png-shards` to independently validate PNG hashes, bytecode shards and all 24 KiB / 48 KiB boundaries. See `references/PNG-SHARD-LIMITS.md`. This step does not change the V6 production renderer or broadcast transactions.
