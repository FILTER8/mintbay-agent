---
name: mintbay-agent
description: Mintbay V6 on-chain NFT deployment research, source generation, preflight compilation, Bankr transaction orchestration, NFT verification, ERC-6551 accounts, and Mintbay artwork editorial writing. Use for Mintbay collection builds, animations, on-chain mini-games, mint deployments and NFT analysis.
---

# Mintbay V6 - one repository, one active deployment architecture

V6 replaces V5.1 in this repository. Do not deploy using legacy V5 instructions, bytecode or deployment scripts. Do not maintain parallel deployment workflows.

**CURRENT STATUS: CREATOR-APPROVED DEPLOYMENTS ENABLED.** The repository now generates a separate SVG renderer and NFT core and compiles both, but it generates one optional immutable HTML media initcode and `animation_url` from a supplied file, and generates unsigned CREATE2 predicted addresses and ABI-linked calldata, but has not passed local EVM metadata reconstruction tests, full ERC-6551 execution tests or safe runtime bytecode recovery verification. Do not claim local EVM, ERC-6551 execution or marketplace HTML compatibility tests have passed without evidence. The official agent may prepare and, following explicit creator authorization and on-chain preflight checks, submit deployment transactions via Bankr.

## Single workflow

1. Resolve the immutable Mintbay build manifest and verify all file SHA256 hashes, artwork parity, chain ID, creator ownership, and chosen features.
2. Install dependencies: `npm install --prefix assets/contracts/v6 --no-audit --no-fund`.
3. Run `node scripts/prepare-deploy.mjs BUILD_ID --out ./generated/BUILD_ID`.
4. Read `deployment-manifest.json`, all ABI files and Solidity compiler warnings. Manifest status `V6_UNSIGNED_DEPLOYMENT_PREPARED` allows Bankr to request explicit creator approval for an ordered deployment; the preparer itself never sends transactions.
5. For HTML games: use `node scripts/prepare-deploy.mjs BUILD_ID --html ./game.html --out ./generated/BUILD_ID`. The HTML must include exactly one `/* MINTBAY_NFT_INJECTION */` marker within a `<script>` before any code that reads `window.__MINTBAY_NFT__`. The entire UTF-8 HTML template including a 2-byte prefix must fit in one 20,000-byte immutable data contract. No HTML splitting. Do not treat generated media artifacts as already deployed or tested; obtain approval before submitting each live transaction.
6. If a feature is selected, preserve it. Do not remove Holder Claim, Burn & Claim, One Shot, supply reduction, royalty enforcement, creator mint or Net hooks merely to satisfy bytecode limits.
7. Validate external SVG renderer, NFT creation, feature parity and tokenURI decoding on a local EVM. Test lifetime mint caps and ERC-6551 account behavior. Do not claim a test passed unless executed. Creator-approved live deployment may proceed after Bankr verifies chain, deployed CREATE2 factory code, addresses, constructor arguments and all transaction dependencies; prominently disclose any untested runtime functionality.
8. Before Bankr executes a future multi-contract deployment, prepare ordered CREATE2 transactions for data shards, data router, optional media, renderer and NFT core, predicted addresses (factory + salt + initCode), simulation outputs, chain explorer verification material and recovery checks. Source verification and component hash verification are mandatory.
9. Every component must satisfy EIP-170 runtime 24,576 bytes and EIP-3860 initcode 49,152 bytes; do not treat a compiler pass as an EVM test.
10. Ethereum 1, Unichain 130, Polygon 137, Robinhood 4663, Base 8453 and Arbitrum 42161 are the configured target chains; verify chain-specific contracts before deployment.

## Renderer upgrades, animations and interactive HTML

When asked to change NFT artwork, attach animation, build a playable on-chain HTML page, or upgrade a deployed Mintbay renderer, read [RENDERERS-AND-HTML.md](references/RENDERERS-AND-HTML.md) before proposing transactions.

- **Standard V6 generator:** `setRenderer(address)` and `lockRenderer()` exist in generated collections; the owner can replace the renderer only while `isRendererLocked() == false`. The generated collection calls the renderer's `tokenURI(uint256,bytes32)` and `fingerprint(bytes32)`. Verify both and preserve the original token seeds and traits. `lockRenderer()` is irreversible.
- **HTML:** the standard `--html` media path accepts a single self-contained 20 KB chunk (including two prefix bytes) with exactly one `/* MINTBAY_NFT_INJECTION */` marker. It injects `id`, `seed`, `chosenTraits`; it does not inject canonical gameplay armour or token-bound wallet access by default.
- **Advanced custom renderers:** ArcadeMachine's multi-chunk HTML, 8x8 boss, paid $OCH game and ERC-6551 wallets were implemented with additional custom contracts. Do not claim the stock generator or skill automatically produces this system.
- **Safe upgrade:** inspect the live collection and renderer; prepare the replacement source and component pointers; verify all bytecode/chunk boundaries; decode representative tokenURI samples; run the HTML in a browser, including free play and wallet-bridge checks if applicable; then request explicit approval before `setRenderer`. Never silently lock the renderer.

## ERC-6551

Canonical registry `0x000000006551c19487814612e58FE06813775758` and account implementation `0x62DF5D2C60b9B434D017cf90765c4a96e0d486a5` are **candidates for Robinhood 4663**, not a completed universal-chain security review. Verify deployed code, actual signature/execute behavior, chain ownership and deterministic salt for each supported chain. Never require eager account deployment on mint; NFT core needs no ERC-6551 hooks for standard deterministic accounts.

## Media policy

Use compact, self-contained SVG, SMIL animation and HTML mini-games only. Immutable bytecode for one <=20 KB HTML document and separate sharded artwork data with Solidity-side reconstruction are the intended V6 media architecture. Do not substitute IPFS, hostedon.net, storedon.net or external scripts as an equivalent fully autonomous deliverable. Do not claim OpenSea supports inline HTML data URIs until tested on the actual viewer.

## Bankr testing instructions

Before requesting transaction approval, Bankr must provide exact build/config hashes, component bytecode sizes, CREATE2 predicted addresses and ordered unsigned transaction details. Recommend local EVM and decoded tokenURI tests and disclose when these are unavailable; do not falsely represent unexecuted tests as passed. The creator may explicitly approve a live deployment after reviewing the risks. ArcadeGamingVault or any paid gameplay contracts are completely independent of the Mintbay V6 NFT deployment pipeline; never auto-deploy, auto-enable, or block the collection on account of gaming contracts.

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

## Canonical Studio V6 build format

New builds use `config.mintbayV6` with `schemaVersion: 6`, retaining the previously agreed minting feature keys and protocol settings. The deploy base contract path is `assets/contracts/v6/MintbayCoreERC721A.sol`. Do not generate new builds with `mintbayV5`. Old published builds remain immutable historical records.

`prepare-deploy.mjs` now emits `steps[]` with CREATE2 predicted addresses, constructor arguments, exact unsigned calldata and dependencies. The sole supported CREATE2 factory is `0x4e59b44847b379578588920ca78fbf26c0b4956c`. Bankr may broadcast these outputs only after the creator explicitly approves live deployment. Before submission, verify the target chain and CREATE2 factory code, and ensure each constructor is tied to the verified dependency address; for already deployed components, compare runtime code and immutable configuration rather than accepting nonempty code alone. Address existence alone is insufficient to resume any partially deployed collection. The Net integration records final NFT cores only, not helper data contracts.

Strongly recommended before any live collection launch: locally mint and decode `tokenURI`, validate shard boundaries and HTML reconstruction, and exercise configured mint features and ERC-6551 ownership. If the creator elects to deploy before these tests, explicitly mark them unverified; never skip mandatory chain/factory verification, transaction approval, or checking already-deployed dependencies. ArcadeGamingVault is external to Mintbay V6 and must not appear in the V6 collection deployment manifest unless separately and explicitly requested.
