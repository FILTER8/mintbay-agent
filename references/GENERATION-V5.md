# V5 source generation: normal workflow

For a Mintbay Build ID, use the repository script instead of inventing collection-specific Solidity.

```bash
node scripts/generate-collection.mjs BUILD_UUID --out ./generated/BUILD_UUID
# or for already-downloaded, exact raw JSON bytes:
node scripts/generate-collection.mjs --local --dir ./fixture --out ./generated/fixture
```

The generator verifies raw-byte SHA-256 hashes of config, artwork, compiled artwork, verifies lineage, trait IDs, weights, every pixel, symmetric multi-word exclusions, grid and layer offsets, fee configuration, and emits collection-specific `Data.sol`, `Renderer.sol`, `Collection.sol`, the copied candidate base and `generation.json` recording provenance. Names are derived from the Build ID, not from THE TESTERS. Sources are deterministic for identical artifacts and script version. The implementation supports up to the current compiled-artwork palette and layer schema, dynamic grid sizes, and masks spanning multiple 256-bit words. Compilation size limits may still reject large builds.

## Important limits / fail closed

- Candidate V5 base supports **standard EOA mode only**. The generator rejects HoodWallet mode rather than pretending it is supported.
- **Burn & Claim enabled** is refused until destination-side source burning can be safely implemented and tested. Other features reflect the config, but live EVM tests are still required.
- Ownership transfer enabled means an owner can also renounce ownership in the candidate base. Review the base before approval.
- Existing Net calls are unbounded. Review for gas griefing and make any necessary fixes *before* approving the base.
- ERC721-C `enforcementRequested` is not the same as configured validator enforcement; no auto-activation of validation.
- The generator produces **candidate Solidity source**, not bytecode, a compiler Standard JSON input, deployment receipts, or explorer verification.
- `status: draft` and `template.verified: false` remain unchanged. Never claim a release is certified without a separate server-side, authenticated attestation linked to immutable build hashes and an approved base SHA.

## Future work required for normal production one-command deployment

1. Reproduce compilation using pinned dependencies and exact Standard JSON, and run real EVM invariant tests. Record reviewed canonical V5 base hash and generator version.
2. Implement authenticated release attestation (do not mutate R2 build contents).
3. Implement approved wallet transaction broadcast, authenticated explorer source verification and secure backend registration. Protect all secrets outside the public skill repository.
4. On confirmation return deployed address, transaction hash, verified source links and separate status for registration and verification. No false success claims.

Do not allow generator success to override the existing mainnet stop gates.
