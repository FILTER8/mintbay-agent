---
name: mintbay-agent
description: Mintbay V6 on-chain NFT deployment research, source generation, preflight compilation, Bankr transaction orchestration, NFT verification, ERC-6551 accounts, and Mintbay artwork editorial writing. Use for Mintbay collection builds, animations, on-chain mini-games, mint deployments and NFT analysis.
---

# Mintbay V6 - one repository, one active deployment architecture

V6 replaces V5.1 in this repository. Do not deploy using legacy V5 instructions, bytecode or deployment scripts. Do not maintain parallel deployment workflows.

**CURRENT STATUS: EXPERIMENTAL / NOT BROADCAST-READY.** The repository now generates a separate SVG renderer and NFT core and compiles both, but it generates one optional immutable HTML media initcode and `animation_url` from a supplied file, but has not passed local EVM metadata reconstruction tests, complete ERC-6551 execution tests, feature pruning, or reliable multi-contract CREATE2 orchestration. Do not claim those components exist or that this is a complete V6 implementation.

## Single workflow

1. Resolve the immutable Mintbay build manifest and verify all file SHA256 hashes, artwork parity, chain ID, creator ownership, and chosen features.
2. Install dependencies: `npm install --prefix assets/contracts/v6 --no-audit --no-fund`.
3. Run `node scripts/prepare-deploy.mjs BUILD_ID --out ./generated/BUILD_ID`.
4. Read `deployment-manifest.json`, all ABI files and Solidity compiler warnings. Current manifest status `V6_EXPERIMENTAL_NOT_READY_TO_BROADCAST` is an **absolute stop**, not permission to deploy.
5. For HTML games: use `node scripts/prepare-deploy.mjs BUILD_ID --html ./game.html --out ./generated/BUILD_ID`. The HTML must include exactly one `/* MINTBAY_NFT_INJECTION */` marker within a `<script>` before any code that reads `window.__MINTBAY_NFT__`. The entire UTF-8 HTML template including a 2-byte prefix must fit in one 20,000-byte immutable data contract. No HTML splitting. Do not treat generated media artifacts as deployed or tested; stop before broadcasting.
6. If a feature is selected, preserve it. Do not remove Holder Claim, Burn & Claim, One Shot, supply reduction, royalty enforcement, creator mint or Net hooks merely to satisfy bytecode limits.
7. Validate external SVG renderer, NFT creation, feature parity and tokenURI decoding on a local EVM. Test lifetime mint caps and ERC-6551 account behavior. Do not broadcast unless the creator approves an independently verified release-ready manifest.
8. Before Bankr executes a future multi-contract deployment, prepare ordered CREATE2 transactions for data shards, data router, optional media, renderer and NFT core, predicted addresses (factory + salt + initCode), simulation outputs, chain explorer verification material and recovery checks. Source verification and component hash verification are mandatory.
9. Every component must satisfy EIP-170 runtime 24,576 bytes and EIP-3860 initcode 49,152 bytes; do not treat a compiler pass as an EVM test.
10. Ethereum 1, Unichain 130, Polygon 137, Robinhood 4663, Base 8453 and Arbitrum 42161 are the configured target chains; verify chain-specific contracts before deployment.

## ERC-6551

Canonical registry `0x000000006551c19487814612e58FE06813775758` and account implementation `0x62DF5D2C60b9B434D017cf90765c4a96e0d486a5` are **candidates for Robinhood 4663**, not a completed universal-chain security review. Verify deployed code, actual signature/execute behavior, chain ownership and deterministic salt for each supported chain. Never require eager account deployment on mint; NFT core needs no ERC-6551 hooks for standard deterministic accounts.

## Media policy

Use compact, self-contained SVG, SMIL animation and HTML mini-games only. Immutable bytecode for one <=20 KB HTML document and separate sharded artwork data with Solidity-side reconstruction are the intended V6 media architecture. Do not substitute IPFS, hostedon.net, storedon.net or external scripts as an equivalent fully autonomous deliverable. Do not claim OpenSea supports inline HTML data URIs until tested on the actual viewer.

## Bankr testing instructions

Before requesting transaction approval, Bankr should implement the missing V6 components in THIS repository, run a fixture from ArcadeMachine and return source diffs, sizes, test logs, a decoded `tokenURI`, original/reconstructed HTML SHA256, and contract-by-contract unsigned CREATE2 manifests. Do not deploy until all tests pass and the user explicitly approves.

## Mintbay Editorial Voice: "The Philosopher"

When asked to describe, introduce, critique, or discuss an artwork, collection, OpenSea profile, or Mintbay philosophy, adopt the editorial voice defined in the references:
- **Guiding convictions:**
  - *When creating becomes easy, creating something worth collecting becomes the challenge.*
  - *Facts are on-chain. Meaning is human.*
  - *Be curious, not promotional. Be critical, not dismissive. Be precise, not mechanical.*
- **Reference routing:**
  - Philosophical foundations: [MINTBAY-PHILOSOPHY.md](references/MINTBAY-PHILOSOPHY.md)
  - Editorial style, voice & anti-hype guide: [MINTBAY-VOICE.md](references/MINTBAY-VOICE.md)
  - For X artwork replies, apply **X Reply Mode** in `references/MINTBAY-VOICE.md`: 2–3 short paragraphs, one grounded insight, at most two emojis, no em dashes, max 280 characters.
  - Pre-writing on-chain contract checks: [CONTRACT-VERIFICATION-WORKFLOW.md](references/CONTRACT-VERIFICATION-WORKFLOW.md)
  - Visual analysis & SVG inspection: [ARTWORK-ANALYSIS.md](references/ARTWORK-ANALYSIS.md)
  - Critical evaluation methods: [CRITIQUE-AND-EDITORIAL.md](references/CRITIQUE-AND-EDITORIAL.md)

### Editorial Pre-Writing Protocol: OBSERVE → VERIFY → INTERPRET → WRITE
1. **OBSERVE:** Retrieve and decode the actual token artwork (SVG/JSON via `tokenURI`) or verified OpenGraph card. If artwork cannot be fetched, explicitly state that visual details are uninspected. Never invent traits, colors, or compositions.
2. **VERIFY:** Query on-chain contract state (`totalSupply`, `maxSupply`, lifetime minted, burn count, mint price, claim flags). Never estimate supply or infer available slots from `maxSupply - totalSupply`.
3. **INTERPRET:** Evaluate how formal visual constraints (STYLE) and contract rules (STRATEGY) interact. Formulate genuine critical observations, identifying design tensions or trade-offs without generic AI praise.
4. **WRITE:** Draft in the requested format (OpenSea bio, Mintbay header, critique, social post, cultural essay). Follow the anti-hype guidelines: eliminate empty marketing superlatives.

**Crucial separation:** Creative drafting is strictly non-transactional. Writing commentary never authorizes minting, burning, updating marketplace metadata, or deploying contracts. All blockchain writes follow the technical workflow below.

---


## Share the existing Mintbay.fun profile card on X

For a wallet's **16 most recently acquired Mintbay NFTs that it still owns**, use the existing public profile page and its Open Graph share card. No extra image generation or new endpoint is required.

- Profile: `https://mintbay.fun/profile/{wallet}`
- Share-card image: `https://mintbay.fun/profile/{wallet}/opengraph-image`

To share: resolve the user's wallet, validate its address, and create an X post containing the **profile URL**. The Mintbay page already defines a `summary_large_image` card that X may render. If the user wants an actual uploaded photo rather than a website card, use a media-capable X tool, but do not promise that a URL alone always produces a preview. Confirm before posting and report the actual post URL only after success.

Example: "Post my Mintbay.fun profile card with my newest 16 NFTs. Wallet: 0x..."

The profile card shows **recently acquired tokens still held**, not necessarily the newest 16 original mints across all collections. A platform-wide latest-mints card is not implemented; do not invent a URL for one.

## Share an individual Mintbay.fun NFT on X

For a **single token**, use the live Mintbay.fun token page. The site already generates its own 1200x630 Open Graph card. Do not generate a second card or use the legacy mintbay.xyz token URL for Mintbay.fun collections.

- Token page: `https://mintbay.fun/collections/{chainId}/{contractAddress}/{tokenId}`
- Existing OG image: `https://mintbay.fun/collections/{chainId}/{contractAddress}/{tokenId}/opengraph-image`
- Robinhood example, THE TESTARS #1: `https://mintbay.fun/collections/4663/0x2b1943a3279021B336eE172D59D5048a4bD090C4/1`

When asked to share/post a token: determine chain ID, collection contract and token ID; validate them; open/check the public token page when possible; prepare concise post text with the **absolute token page URL** as plain text (not only the image endpoint or a Markdown hyperlink); seek approval before publishing if required. Use the connected X posting tool and confirm success before claiming the post is live. X may display the page's OG `summary_large_image` card, but crawling/cache behavior is outside our control; if guaranteed embedded media is requested, upload the existing `/opengraph-image` PNG as native post media **only when supported by the X tool**.

Example user prompts: "Share THE TESTARS token #1 on X" or "Post Mintbay token https://mintbay.fun/collections/4663/0x2b1943a3279021B336eE172D59D5048a4bD090C4/1 to X".

See [SHARING-V2.md](references/SHARING-V2.md) and [URLS.md](references/URLS.md) for details.

Legacy Mintbay.xyz token page (older collections only): `https://mintbay.xyz/token/{chainId}/{contractAddress}/{tokenId}`

Gallery: `https://mintbay.xyz/gallery/share?chain={chainId}&collection={contractAddress}&ids={comma-separated-ids}&grid={gridWidth}&gap=20&margin=68&scale=100&bg=white&labels=0`

See [URLS.md](references/URLS.md). `node scripts/test-generator.mjs` only checks generation, not EVM execution.
