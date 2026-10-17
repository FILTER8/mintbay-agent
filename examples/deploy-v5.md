# Bankr — protocol adherence test for Mintbay draft (READ-ONLY)

@bankrbot reinstall the canonical skill from https://github.com/FILTER8/mintbay-agent and read `SKILL.md`, `references/PROTOCOL-RULES.md`, `references/TEST-MATRIX.md`, `references/BUILDS.md`, `references/NET-INTEGRATION.md`, `references/DEPLOYMENT.md`.

Build: https://api.mintbay.xyz/v1/builds/ebd5e0d8-2919-4f8b-bce9-80ebc5ae00e9

**Do not generate/deploy a supposedly final or audited Mintbay base.** There is not yet an approved/pinned base hash. Treat the last candidate contract report as unverified source, not proof of tests.

1. Run `node scripts/validate-build.mjs <build-url>`. Report literal output. Independently check full original/compiled artwork parity including pixel decoding, palette, masks, incompatibility graph and deadlocks (script only provides baseline validation).
2. Summarize the permanent protocol: immutable 500 bps fee to `0x04084943Dea97044de6feE8fA9adEfC2DC41f6A5`; one FCFS lifetime minted cap; no reserved creator supply; universal authorized burn; optionally enabled free atomic 1:1 Burn & Claim to approved source collection; owner-managed multiple sources, no Solidity maximum 5; Holder Claim separate (can be paid, never burns); optional One Shot must be gated.
3. Audit candidate `MintbayNetIntegratedERC721A.sol` **only if its complete source is available**. For each optional config flag in this build, produce an exact check table: enabled state, constructor/immutable gate, callable function and negative test. Distinguish compulsory `burn()` from optional `burnAndClaim()`.
4. Design and run actual local EVM tests with two Mintbay collections A (source) and B (destination). Check source approval/real burn, source circulating supply decrease with lifetime minted unchanged, destination 1:1 mint, cap 500 never refills, atomic rollback, owner gates, fees and transfer hooks. Show full runnable test files, package lockfile, commands and *real* output. If unavailable, write NOT TESTED, not PASS.
5. Explain exactly which portions can be pinned now and which remain unverified. Do not change any fee constants, artwork traits, claim prices or protocol rules. Identify unsupported configurations, never substitute them silently.

**STRICTLY READ-ONLY**: no blockchain deployment, signatures, mint transactions, registration or funds spent.
