# Mintbay V5 protocol rules (compact)

The **compiled collection** must preserve these fixed rules:

- 5% primary paid-mint fee (`500` basis points), immutable recipient `0xcdb9DB46d6C251A334EfF599012011Dc63ff5717`. Creator cannot redirect this portion.
- Global lifetime minted count never decreases after burn. Public, creator mint, holder claim and one-shot consume the same supply. No protected creator reserve.
- Real ERC721A-compatible owner/approved `burn(uint256)`; burned IDs cannot be minted again.
- Enabled Holder Claim requires ownership of configured source ERC721 tokens, configured price and remaining per-token allowance. Disable when absent.
- One Shot can burn and mint a fresh lifetime slot only once per original lineage, when enabled.
- Disabled features must reject use. Burn & Claim and HoodWallet mode are currently rejected by the generator, not silently removed.
- ERC2981 royalty information is not a guarantee of marketplace-enforced royalties; do not claim ERC721-C validator enforcement without verified configuration.
- Net activity hooks are best-effort; external Net failure should not break mint or transfer.
- Respect owner and payout addresses from the verified build, never invent them.

The V5 source under `assets/contracts/v5/` is an executable *candidate reference*, not a security audit or claim of prior EVM acceptance tests. Before mainnet broadcast, show the creator the reviewed sources and transaction, make unsupported modes explicit, and seek explicit confirmation. A clean compiler result does not prove the absence of economic bugs.
