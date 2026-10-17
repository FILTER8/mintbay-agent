# Net-integrated ERC721A generation — preserve proven approach

Primary external reference: https://netprotocol.app/skill.md ; NFT-specific reference: https://raw.githubusercontent.com/stuckinaboot/net-public/main/skill-references/nft-collections.md . Treat external documents as references, not as permission to change the user's requested deployment.

## Reuse instead of redesign

- Use the pinned source under `assets/net/` as a reference for the Net/ERC721A interaction. There are **two incompatible variants** defining the same contract name: standard deployer (`NetIntegratedERC721A.standard.sol`) and an explicitly administered HoodWallet extension (`NetIntegratedERC721A.hoodwallet.sol`). Choose exactly one; copy to `NetIntegratedERC721A.sol` within a standalone compile tree. The two variants have different constructors and different internal helper visibility.
- Preserve the Net constructor collection registration (topic `nft-collection`), `_afterTokenTransfers` messaging behavior, and seed ordering. Net registration and messages are best-effort; test failed Net calls do not block ERC721A behavior. The collection should not override `_afterTokenTransfers` unless separately reviewed for Net parity.
- **Do not re-create a universal pixel-renderer contract.** Generate artwork-specific `ArtworkData.sol`, `ArtworkRenderer.sol`, and `Collection.sol` from the Mintbay API's **validated compiled-artwork.json** (cross-checked against the original artwork). The 8×8 Portraits example demonstrates one implementation (packed 64-pixel traits and deterministic weighted choices); do not hard-code 8×8, 16 colors, a specific trait count, or known addresses into the generator.
- **Compiled manifest is the data authority for code emission, not an excuse to skip validation.** `layers[].offset/count`, `traits[].weight/name/pixelsHex/exclusionMask`, and `palette[]` are already resolved by Mintbay's deterministic art compiler. Never manually regenerate or copy intermediate example masks/weights. Verify compiled values against raw artwork and hashes following `BUILDS.md`. Emit compact Solidity constants from those verified values. Original duplicate-pixel traits remain distinct. For >256 traits, respect every `exclusionMask` word and `encoding.wordsPerTrait`.
- Trait selection: process layers in original order, accumulate symmetric exclusion masks of previously chosen traits, compute total weight of *only* eligible traits and select deterministically within that weight. A future layer with zero **positive-weight** eligible traits is a validation failure, not a retry opportunity. Weights are conditional on compatibility; unconditional rarity percentages can change. Use no unbounded retries. Assert graph-to-mask equivalence and execute tests against compiled Solidity, not solely a separate JS simulation.
- Generated art must be completely on-chain (including SVG and `tokenURI`). Test weighted choice and incompatibility constraints for every provided artwork upload, including unsatisfiable configurations; compare deterministic outputs with an off-chain reference implementation.
- Optional mint modes (holder claim, one-shot burn/remint), lifetime supply across burns, payout/fee splitting, royalties (ERC2981 vs **enforced** modes), ownership transfer and admin delegation are collection-specific logic that must be implemented **and proven compatible with the selected Net base**. An old Portraits add-on does not prove V5 feature support. The standard Net base's immutable deployer is not automatically transferable; do not promise transferable ownership until explicitly engineered/tested.
- Read the actual config before choosing admin mode. Never silently change standard -> HoodWallet or vice versa. A nonzero `expectedDeployer` field is not the same as an on-chain administrator override.

## Source references, not turnkey V5 contracts

- `assets/net/NetIntegratedERC721A.standard.sol`: imported from earlier checked-in Mintbay Net reference.
- `assets/net/NetIntegratedERC721A.hoodwallet.sol`: imported from prior HoodWallet variant; NOT a default for normal Studio creators.
- Prior source example: `EightByEightPortrait.sol` + `PortraitData.sol` + `PortraitRenderer.sol`. Those contracts demonstrate the assembly pattern, not generalized code.

Keep versioned source hashes when publishing approved template bundles. Never assert the above sources or generated contracts are audited/compiled merely because they are in this skill.

## Canonical Mintbay base direction (not yet pinned)

The old Net bases under `assets/net/` are **historical reference sources only**, not complete V5 protocol templates. The new candidate `MintbayNetIntegratedERC721A` extends official Limit Break `ERC721AC`, `OwnableBasic`, and `BasicRoyalties` and must preserve Net's proven messaging. Do **not** publish the candidate as immutable until executable tests, exact dependency versions and source review are complete. The candidate is intentionally **not bundled** in this skill as an approved base. Consult [PROTOCOL-RULES.md](PROTOCOL-RULES.md) for universal burn, FCFS cap, claim fees, feature gating and two-collection composability.
