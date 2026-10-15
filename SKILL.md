---
name: mintbay-agent
description: Share individual fully on-chain NFTs and selected NFT galleries using Mintbay public web links; help agents construct verifiable X-card URLs. Use when asked to display, share, or create an NFT gallery, or when discussing future Mintbay minting or launchpad integration.
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

## Future Mintbay work

Minting, contract deployment, platform fees, and any future agent-facing ownership endpoint are **planned** and not implemented by this skill. Do not fabricate working transaction or API instructions. See [ROADMAP.md](references/ROADMAP.md).

For URL rules, chains and test cases see [URLS.md](references/URLS.md).
