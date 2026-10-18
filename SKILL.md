---
name: mintbay-agent
description: Use Mintbay to share fully on-chain NFTs and galleries, inspect Mintbay V5 Studio builds with original and compiled artwork, and guide a Bankr agent through read-only Net-integrated ERC721A generation, compilation and testing. Use for Mintbay collection builds, Bankr integration, deployment planning and gallery links.
---

# Mintbay Agent

Use Mintbay's public NFT token pages and gallery share pages to show NFT artwork. These create **link preview cards**, not native uploaded X images. Do not claim that public `@bankrbot` has installed this skill, can include links reliably, or can publish images. The agent must be explicitly configured to use this skill.

## Individual NFT

The public token URL is:

`https://mintbay.xyz/token/{chainId}/{contractAddress}/{tokenId}`

Working example (Robinhood Chain, chain 4663):

`https://mintbay.xyz/token/4663/0x2eE6305804dD94F7ff695C5Ab1f3AE805f317653/68`

For downloading an individual PNG (not the best X sharing target):

`https://mintbay.xyz/api/art/{chainId}/{contractAddress}/{tokenId}.png?size=800`

## Gallery image card

Use the **page**, not the PNG API, when sharing on X:

`https://mintbay.xyz/gallery/share?chain={chainId}&collection={contractAddress}&ids={comma-separated-token-ids}&grid={gridWidth}&gap=20&margin=68&scale=100&bg=white&labels=0`

Example with 9 tokens:

`https://mintbay.xyz/gallery/share?chain=4663&collection=0x2eE6305804dD94F7ff695C5Ab1f3AE805f317653&ids=13%2C57%2C60%2C78%2C86%2C91%2C106%2C113%2C150&grid=3&gap=20&margin=68&scale=100&bg=white&labels=0`

For verified social previews, use 1–16 positive integer token IDs and a grid width matching selection (2, 3 or 4). URL encode query parameters. For manual creation and trait filtering use `https://mintbay.xyz/gallery`.

## Ownership and validation

- **Never guess tokens owned by a wallet.** Resolve the wallet address and verify current ownership of each selected token with an available, trusted NFT ownership data tool or on-chain lookup. A previously named ID is not proof of ownership.
- Mintbay's user-facing gallery offers wallet lookups; a stable, agent-facing ownership API is **not yet documented as available**. If your agent cannot verify holdings, ask for token IDs or direct the user to the manual gallery rather than inventing results.
- A gallery share URL records **selected IDs**, not a permanent guarantee of current ownership.
- Check the requested chain, collection address, token IDs and that the output page/image can be loaded, if your environment offers fetching.
- Output the **complete, literal HTTPS URL**, never placeholders or truncated addresses. Place URL on a separate line in plain text for X replies. Don't end replies with a colon or just the NFT name.
- X may choose whether and when to generate cards; a valid Mintbay URL doesn't guarantee a preview. No native image posting is implied.

## Mintbay protocol invariants (binding requirements; candidate code unapproved)

**Before generating, compiling or reviewing a Mintbay collection**, load [PROTOCOL-RULES.md](references/PROTOCOL-RULES.md), [TEST-MATRIX.md](references/TEST-MATRIX.md) and the relevant build references. NEVER treat an AI-generated Solidity report, SHA-256 assertion or textual test table as an approved protocol base.

- Immutable 5% paid-primary Mintbay fee to `0xcdb9DB46d6C251A334EfF599012011Dc63ff5717`. The fee address/rate must not be creator-configurable or agent-changeable. **Stop any prospective deployment** if approved bytecode/source deviates; the final audited base SHA-256 is **not pinned yet**.
- All Mintbay collections expose authorized real `burn(uint256)`; burned supply is *not* remintable. Burn & Claim is an optional **free**, atomic 1-for-1 route into a destination collection, accepting owner-managed approved Mintbay source collections (no Solidity five-source limit). Every mint consumes the same FCFS lifetime supply; no protected creator reserve.
- Honor all disabled feature gates. In particular One Shot must not run unless enabled; standard burn is always enabled. Holder Claim accepts only configured eligible sources and contract-owned pricing. Public wallet limit 0 means unlimited.
- Use official Limit Break ERC721AC/BasicRoyalties and preserve tested Net hooks. Do not fabricate a custom validator. See [NET-INTEGRATION.md](references/NET-INTEGRATION.md).
- Run `node scripts/validate-build.mjs <build-url>` for baseline raw-payload integrity (Node 18+), **then** independently test all pixel/mask/deadlock invariants and Solidity/EVM behavior. Script output is not a complete audit.

## Canonical platform links and source-code art

- Mintbay.fun: `https://mintbay.fun` — Studio: `https://mintbay.fun/studio` — Docs: `https://mintbay.fun/docs` — canonical new build API: `https://api.mintbay.fun/v1/builds/{id}`. Existing `api.mintbay.xyz` immutable manifest file links remain valid. Legacy `mintbay.xyz` token/gallery previews are **not** interchangeable with the new Mintbay.fun placeholder collection pages; retain working legacy links.
- Mintbay V5 is designed to integrate [Net Protocol](https://www.netprotocol.app/) best-effort on-chain messaging; read [NET-INTEGRATION.md](references/NET-INTEGRATION.md) before changing its hooks.
- Optional Studio creator-message/Unicode source comment can be present in published config, but Solidity insertion is **NOT AUTOMATED**. See [ASCII-HEADER.md](references/ASCII-HEADER.md). Do not invent a field in existing builds; render creator Unicode text only as harmless, individually prefixed `//` comment lines; never change contracts' behavior or fee economics.

## Mintbay V5 Studio builds and Bankr (development / read-only)

- **Do not use the retired `mintbay-net-collection-template` GitHub repository as a required input.** Use the immutable Mintbay Studio build URL as the source of collection-specific artwork and configuration.
- For any `/v1/builds/{id}` URL, read [BUILDS.md](references/BUILDS.md) and download the *actual* manifest, `/config`, `/artwork`, and `/compiled-artwork` when declared. For new V5 compiled-artwork builds, require all three files and verify raw response-byte SHA-256 hashes and compiler source lineage; fail closed on any missing/mismatching data. A build with `status: draft` and `template.verified: false` is **not deployable by default**.
- To generate source, follow [NET-INTEGRATION.md](references/NET-INTEGRATION.md), then [DEPLOYMENT.md](references/DEPLOYMENT.md). Preserve the pinned Net integration. Generate Solidity constants only from *verified* `compiled-artwork.json` with original artwork/config as independent verification; never guess, reindex, deduplicate, rename, recolor, reweight, or reconstruct traits. Do not silently change supply, fee recipient, royalties, chain, ownership, mint privileges, artwork or trait selection. Check every optional feature or report unsupported.
- Until tested V5 sources and compatible ABI are published, work **STRICTLY READ-ONLY**: generate, compile, test, estimate, review and debug without submitting, signing, deploying, minting or spending funds. If user separately approves later deployment, check that the required reviewed bundle, verification and Bankr workflow actually exist first.
- After an explicitly approved and confirmed future deployment, registration with Mintbay is an internal backend action described in [DEPLOYMENT.md]; **never** expose registration credentials in a browser, public prompt, skill or social message. Discovery requires the first minted NFT.
- For a concrete safe prompt use [deploy-v5.md](examples/deploy-v5.md). Existing token/gallery sharing instructions above remain valid.
- No stable public wallet-ownership API has been documented in this skill. Never invent holdings. See [ROADMAP.md](references/ROADMAP.md).

For URL rules, chains and test cases see [URLS.md](references/URLS.md).
