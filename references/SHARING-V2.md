# Share the existing Mintbay profile card

No new share endpoint is needed.

- Website: `https://mintbay.fun/profile/{wallet}`
- Existing 1200x630 share-card image: `https://mintbay.fun/profile/{wallet}/opengraph-image`
- Existing profile JSON: `https://mintbay.fun/api/mintbay/profile/{wallet}`

The profile card takes the first 16 NFTs returned by `ownerTokens`. The updated library asks Alchemy for transfer-time ordering, fetches uncached ownership data, and prefers timestamps when available. This means 16 recently acquired NFTs **currently owned by the wallet**, not necessarily the newest 16 original mint events. A separately ranked, platform-wide latest-mints card would be another feature, not part of this change.

To post on X: write a post with the profile URL so X can generate the Open Graph card. Whether X displays it depends on its crawler and cache; do not promise a guaranteed preview. If the user explicitly wants image media, attach the existing image through an X tool that supports it.

Example user prompt: `Post my Mintbay.fun profile card on X showing my latest 16 collected NFTs. Wallet: 0x...`

## Individual token share card (already live on Mintbay.fun)

- Token page: `https://mintbay.fun/collections/{chainId}/{contractAddress}/{tokenId}`
- Direct OG image: `https://mintbay.fun/collections/{chainId}/{contractAddress}/{tokenId}/opengraph-image`
- Example: `https://mintbay.fun/collections/4663/0x2b1943a3279021B336eE172D59D5048a4bD090C4/1` (THE TESTARS #1)
- Supplied website implementation: `app/collections/[chainId]/[address]/[tokenId]/page.tsx`, `opengraph-image.tsx` and `components/mintbay/share-token.tsx`.
- OG card: 1200x630 PNG, dark backdrop, square pixelated token art, collection title/ID and Mintbay.fun branding.

Use the **token page URL**, not just the OG image URL, in an X post to allow X to scrape the card. X controls whether and when its preview appears. If X media posting is available and the user requests an attached image, reuse the existing image endpoint; do not regenerate the artwork. Never assert the post succeeded until its URL/ID is returned.

Examples:
- `Share THE TESTARS token #1 on X.`
- `Post Mintbay token https://mintbay.fun/collections/4663/0x2b1943a3279021B336eE172D59D5048a4bD090C4/1 to X.`
