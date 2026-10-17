# Mintbay V5 Bankr workflow — gated, development stage

## Read-only development (current)

**Stop gate:** Do not deploy if canonical `MintbayNetIntegratedERC721A.sol` has not been approved and full-file SHA-256 pinned with independently executed EVM tests. Current skill has no such approved base. Verify all protocol rules in [PROTOCOL-RULES.md](PROTOCOL-RULES.md) and [TEST-MATRIX.md](TEST-MATRIX.md).


1. Fetch build manifest, config, original artwork and compiled artwork by build ID; hash exact response bytes, check `compiledArtwork.source.rawArtworkSha256` lineage, schema, bitmasks and pixel round-trip (see BUILDS.md). Reject missing compiled file for the new V5 workflow.
2. Fetch the official Net NFT integration reference and pinned Mintbay Net base. Identify constructor/admin semantics; pick exactly one base.
3. Generate collection-specific data, renderer and Collection.sol using verified compiled art values exactly; cross-check against original artwork. Enforce all selected mint modes/limits, platform fee and payout settings, royalty semantics, and ownership requirements **or block deployment**.
4. Compile with pinned compiler/dependency versions, run automated tests against the **actual compiled Solidity in a local EVM** (minting, public/creator/holder, fee accounting, exclusions, burn/remint, caps, admin transfer, Net failure cases, tokenURI/SVG pixel and metadata round-trip, fuzz/edge cases); record gas usage and EIP-170 bytecode size.
5. Return explicit PASS/FAIL and all unsupported configurations with exact source/bytecode hashes. Don't deploy or upload chain transactions.

## Future, only after production bundle is reviewed

A future deployment requires **separate explicit user permission for the exact chain, contract sources, gas spending and mint privileges**, verified template version and passing tests. Then Bankr may submit deployment, wait for confirmed receipt and explorer source verification. The agent must stop on any mismatched source, owner, chain, fee, payout or missing verification; never deploy an improvised substitute.

## Silent registration only after success

The API Worker has a private `POST /v1/deployments` and public `GET /v1/collections`. On confirmed deployment an authorized backend integration registers `{buildId, chainId, contractAddress, deploymentTxHash}`. Worker verifies deployment evidence and persists registration. **Do not put `DEPLOYMENT_REGISTER_TOKEN` or any bearer token in public GitHub skills, X prompts, static Next.js pages or artwork/config.** The agent can receive a short-lived server-issued authorization or call an approved server-side Bankr bridge. Merely knowing the HTTP endpoint is not access to its secret.

Registered, not-yet-minted collections remain hidden. Worker looks for the first genuine ERC721 mint, then publishes the token's on-chain image in `GET /v1/collections`. The 5-minute cron is an early development implementation; costs and scale should be reviewed before public launch.

**Important**: as of this reference update, the V5 contract bundle is not approved for production. Existing built-in build API endpoints do not prove deployment, source verification or feature parity.
