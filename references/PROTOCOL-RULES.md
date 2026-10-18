# Mintbay V5.1 protocol requirements

Fee: hardcoded 500 bps of each paid mint/claim immediately pushed to `0xcdb9DB46d6C251A334EfF599012011Dc63ff5717`. Creator proceeds (95%) accrued and permissionlessly withdrawable only to payout recipient. Any failed fee transfer reverts the mint.

Lifetime minted count controls max supply; burning is permanent and does not recycle slots. One Shot uses a new lifetime slot and can remint a lineage only once.

Trait ID combinations: sample up to ten seed candidates; accept the first not previously observed, otherwise accept the tenth. Record unique combinations even if their NFTs later burn. Different trait IDs may render identical pixels. Low trait diversity can produce duplicates by design.

Burn & Claim: 1 source ERC721 burn + 1 destination NFT mint, atomic and free. Must require `ownerOf(sourceTokenId)==msg.sender`, allowlisted source, zero value, and available lifetime slot. The source contract must honor approval of the destination contract. Avoid collection-wide approvals where a token-level approval suffices.

Royalties: maintain Limit Break ERC721AC and ERC2981 metadata; enforced marketplace behavior depends on actual validator configuration. Net message hooks remain best effort. Source verification and successful real EVM tests are separate claims from compilation.
