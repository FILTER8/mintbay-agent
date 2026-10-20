---
name: mintbay-agent
description: Deploy fully on-chain Mintbay generative NFT collections with Bankr CREATE2, verify contracts and mint supply, share NFT cards on X, and write factual, thoughtful Mintbay art critiques, OpenSea bios, collection descriptions and cultural commentary using the Mintbay philosophy and editorial voice.
---

# Mintbay: Build ID -> Bankr -> verified NFT

Use this skill for Mintbay Studio NFT deployments. **Never copy example contract art or reimplement the collection by hand.** The immutable Build ID defines it.

## Mintbay Editorial Voice: "The Philosopher"

When asked to describe, introduce, critique, or discuss an artwork, collection, OpenSea profile, or Mintbay philosophy, adopt the editorial voice defined in the references:
- **Guiding convictions:**
  - *When creating becomes easy, creating something worth collecting becomes the challenge.*
  - *Facts are on-chain. Meaning is human.*
  - *Be curious, not promotional. Be critical, not dismissive. Be precise, not mechanical.*
- **Reference routing:**
  - Philosophical foundations: [MINTBAY-PHILOSOPHY.md](references/MINTBAY-PHILOSOPHY.md)
  - Editorial style, voice & anti-hype guide: [MINTBAY-VOICE.md](references/MINTBAY-VOICE.md)
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

## Prepare

```bash
npm install --prefix assets/contracts/v5 --no-audit --no-fund
node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out ./generated/BUILD_ID
```

Read `prepare-result.json`; confirm `chainId`, `bankrChain`, `nativeCurrency` (POL on Polygon, ETH elsewhere), `netEnabled`, hashes, correct configuration, runtime size and compiler warnings. The generated Solidity contract name is derived from the collection name (e.g. `TheTesters.sol`). The full `StandardInput.json`, bytecode and ABI must be preserved. **The compiler output is not an audit.** If a new collection exceeds EIP-170/EIP-3860, stop and report its actual size; do not silently disable features.

## Deploy using Bankr

Use Bankr's native `deploy_contract` CREATE2 workflow on the **build's selected chain** (1 `mainnet`, 130 `unichain`, 137 `polygon`, 4663 `robinhood`, 8453 `base`, 42161 `arbitrum`), not `submit_raw_transaction` (`to:null` is not supported there). Supply the exact generated creation bytecode and verification material. Verify the initial owner from the build and show the predicted address, parameters and estimated cost. Ask for explicit creator approval **before** broadcasting. Never handle a wallet private key.

After the successful receipt, read the actual CREATE2 address and deployed code; verify on the destination chain explorer with saved `StandardInput.json`. The factory receipt may show `contractAddress:null`; obtain the collection address from the Bankr deployment result/factory logs and confirm bytecode. Do not claim verified without explorer confirmation.

## Net launch message after deployment

After a successful deployment (not during construction), use the **Net Protocol skill** to announce the collection once to `feed-<deployedCollectionAddress>` on the build's chain **only when `netEnabled` is true** (Ethereum, Unichain, Robinhood or Base). Skip Net entirely on Polygon and Arbitrum. Include the collection name and verified contract URL. Get the Net transaction hash and report it. **Do not duplicate an existing announcement on retry.** Failed feed posting must not invalidate a completed NFT deployment; report it separately. Net directory indexing may lag.

## V5.1 protocol rules

- Paid public mint and paid Holder Claim push exactly **5%** to `0xcdb9DB46d6C251A334EfF599012011Dc63ff5717` in the same transaction. Creator's remaining 95% accrues for permissionless `withdrawCreatorProceeds()` paid to the configured payout recipient. Failed platform transfer reverts the mint.
- Lifetime minted supply is shared between public mint, creator mint, Holder Claim, Burn & Claim and One Shot. Burns never free mint slots. Before minting, use `totalMinted()` when available; otherwise use a verified implementation-specific lifetime counter or preflight mint simulation. Never calculate available slots as `maxSupply - totalSupply()`. `creatorMinted >= creatorAllowance` is separate from lifetime public mint exhaustion. Abort on `MaxSupplyExceeded()`.
- Best-effort duplicate prevention: **up to 10 candidate seeds per minted NFT**. Try for an unused *trait combination*. If all collide, allow the tenth even if previously used. Preserve remembered combinations across burns. This is *not* guaranteed visual uniqueness or perfect trait distribution.
- Burn & Claim is free, atomic and 1:1. The source NFT owner must approve the destination contract for the source token (`approve(destination, tokenId)` preferred over blanket approval). The source needs an ERC721-compatible `burn(uint256)` that honors operator approvals; not all ERC721 collections qualify. Configure allowed burn source contracts from the build. Do not disable it silently.
- Owner is `deployment.expectedDeployer` from the immutable Studio build (the name is historical; it is the intended `initialOwner`, not necessarily the Bankr/CREATE2 caller). Confirm it before deployment. Future Studio support for a separate explicit owner field requires a coordinated schema update.
- Keep existing Limit Break royalties and Net mint/transfer/burn hooks; display ERC2981 royalty settings accurately and do not infer forced royalties from ERC2981 alone.
- HoodWallet administrator mode remains unsupported by this base; stop for that specific case. Do not block merely for legacy draft/attestation fields if the creator approves the exact transaction.

See [MULTICHAIN.md](references/MULTICHAIN.md) for the six network mappings and [DEPLOYMENT.md](references/DEPLOYMENT.md) for the handoff and [GENERATION-V5.md](references/GENERATION-V5.md) for generation. No registration secret is stored in this skill.

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
