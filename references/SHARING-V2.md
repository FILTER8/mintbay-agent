# Share the existing Mintbay profile card

No new share endpoint is needed.

- Website: `https://mintbay.fun/profile/{wallet}`
- Existing 1200x630 share-card image: `https://mintbay.fun/profile/{wallet}/opengraph-image`
- Existing profile JSON: `https://mintbay.fun/api/mintbay/profile/{wallet}`

The profile card takes the first 16 NFTs returned by `ownerTokens`. The updated library asks Alchemy for transfer-time ordering, fetches uncached ownership data, and prefers timestamps when available. This means 16 recently acquired NFTs **currently owned by the wallet**, not necessarily the newest 16 original mint events. A separately ranked, platform-wide latest-mints card would be another feature, not part of this change.

To post on X: write a post with the profile URL so X can generate the Open Graph card. Whether X displays it depends on its crawler and cache; do not promise a guaranteed preview. If the user explicitly wants image media, attach the existing image through an X tool that supports it.

Example user prompt: `Post my Mintbay.fun profile card on X showing my latest 16 collected NFTs. Wallet: 0x...`
