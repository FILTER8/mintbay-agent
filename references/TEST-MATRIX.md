# Mintbay canonical base — executable acceptance tests

The candidate source from Bankr's Oct 17 report is **not** the approved hash. Reconstruct the complete local project and test the *actual deployed-in-memory contracts*, not a simulated Solidity interpretation.

1. **Two Mintbay collections A and B:** A minted to cap 2,000; B cap 500 with Burn & Claim enabled and A approved. Owner of A token approves B. B burns source through A's standard `burn(uint256)` then mints exactly one B token. Assert A `totalSupply` -1, A `_totalMinted` unchanged, B `totalSupply` +1, B lifetime minted +1; event values and owner correct.
2. Missing approval; source owner mismatch; unapproved collection; source `burn()` revert; sold-out B; B with Burn & Claim disabled; ETH sent to free Burn & Claim; two different approved source contracts; add/remove sources owner-only; prove **full transaction rollback** on failed destination mint.
3. At max lifetime minted count, standard burn or One Shot cannot reopen supply. FCFS: public mint can consume full supply even if creator has unused allowance. One Shot consumes another lifetime slot, enforces one remint per lineage, handles token ID 0, is inaccessible when disabled.
4. Holder Claim: only configured source and contract-controlled prices; reject caller-selected arbitrary source/price, replay beyond global claimsPerToken, nonowner, under/overpayment; allow different approved source prices and authorized owner updates if feature enabled; deny feature when disabled.
5. Public `maxMintsPerWallet = 0` is unlimited; >0 enforced. Fee constant recipient `0xcdb9DB46d6C251A334EfF599012011Dc63ff5717`, rate 500; test paid public and claims, exact accounting, withdrawals, direct ETH received, reentrancy and independent recipient balances. No fee for free routes.
6. Creator allowance only, feature gates on/off for all optional routes and admin setters, supply reduction bounds, owner transfer when enabled, EOA and HoodWallet permissions separately.
7. Limit Break/ERC721AC validation hooks, ERC2981, post-deployment validator setup on supported environment; Net registration and mint/transfer/burn best-effort behavior when messaging reverts.
8. Exact artwork parity: 62 COOL DUDES traits, 7 layers, 25 exclusion pairs, 14 palette entries, every name, weight and pixel; render SVG and tokenURI on deployed EVM, compare source artwork. EIP-170 runtime, deployment gas, linker addresses and dependency versions.

Return full test files, executable commands, **real stdout logs**, checked dependency lockfile, all Solidity source files and contract hashes. If anything is unavailable, report NOT TESTED. Never claim PASS merely from reading code.

## Optional Unicode source header checks

Validate no-comment-breakout or Solidity source injection, no ABI/storage/behavior change, deterministic source hashes, bounded size, round-trip alignment of spaces/backslashes, and rejection of control/format/surrogate characters and acceptance of visible Unicode block art; see [ASCII-HEADER.md](ASCII-HEADER.md). Re-test 500 bps and immutable fee recipient after source changes.
