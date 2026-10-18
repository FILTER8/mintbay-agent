# Mintbay V5 generic generation

The normal single command is `node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out ./generated/BUILD_ID`. It internally runs `scripts/generate-collection.mjs` and compiles the result.

The generator consumes immutable config, artwork and compiled-artwork raw bytes from `api.mintbay.fun`; validates SHA-256 values, compiler lineage, pixel indices, trait weights, exclusions and layer counts; emits Solidity for dynamic grid sizes, palettes and multiword exclusion masks. Source contracts are unique to the Build ID, not hard-coded to THE TESTERS.

To diagnose generator output without compilation: `node scripts/generate-collection.mjs BUILD_ID --out ./generated/sources`.

Limits: only standard EOA administration; Burn & Claim-enabled builds are unsupported; royalty enforcement is not automatically activated. The EIP-170 maximum deployed runtime size is 24576 bytes and the EIP-3860 maximum creation initcode size is 49152 bytes. Build manifests may retain `status:draft` and `template.verified:false`; those values do not assert audited or certified status and do not affect the raw hash checks. Never substitute unverifiable or altered artwork.
