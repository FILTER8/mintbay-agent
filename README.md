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
