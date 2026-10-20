# Contract Verification Workflow (Pre-Writing Protocol)

Before drafting any collection bio, reflection, social post, or critique, perform an on-chain verification pass. **Never invent or estimate contract numbers.**

---

## Step 1: Identify Chain and Contract
- Resolve contract address and chain ID (e.g. `4663` Robinhood, `8453` Base, `1` Ethereum, `130` Unichain, `137` Polygon, `42161` Arbitrum).
- Confirm contract deployment on the target network using view calls or explorer checks.

---

## Step 2: Query On-Chain Supply Metrics
Mintbay contracts use ERC721A optimizations. Supply and burn dynamics must be calculated with rigorous methods:

### 1. Lifetime Minted Supply vs. Existing Tokens
- **CRITICAL RULE:** A failed `tokenURI(id)` or `ownerOf(id)` call **NEVER** proves that a token was never minted. In standard ERC721/ERC721A implementations, burning an NFT makes `ownerOf` and `tokenURI` revert (`Nonexistent token` / `0xdf2d9b42`).
- **NEVER** estimate lifetime minted supply by counting currently existing, callable `tokenURI` results.

### 2. Reliable Methods for Lifetime Minted Count
- **Modern Mintbay contracts:** Call `totalMinted()` if the deployed ABI exposes it. Do not call `_totalMinted()` as though it were a public getter; it is an internal Solidity method.
- **Legacy contracts:** Verify the exact deployed implementation and inherited storage layout using source code before interpreting any raw storage. ERC721A `_currentIndex` and `_burnCounter` may occupy different slots in modified or inherited contracts. Subtract the verified starting token ID from `_currentIndex` where appropriate.
- **Historical mint events:** Fetch complete ERC-721 `Transfer` logs with `from == address(0)` starting from contract deployment. Verify event completeness and account for ERC721A batch-mint event behavior. Count minted token IDs rather than relying on current `ownerOf`/`tokenURI` calls.
- **Historical burn events:** Independently fetch complete `Transfer` logs with `to == address(0)`; reconcile them with a verified burn counter if available. Do not classify transfers to the zero address as a burn without checking the relevant contract semantics.
- If none of these is possible, do not report an exact lifetime count; simulate the intended mint only where appropriate and explain any limitations.

### 3. Circulating Supply
- Query `totalSupply() view returns (uint256)`.
- `totalSupply()` strictly represents unburned tokens currently in circulation (`lifetimeMinted - tokensBurned`).

### 4. Available Public Mint Slots
- `remainingSlots = max(0, maxSupply - lifetimeMinted)` when both counters are reliably verified; this is supply capacity, not proof that a particular caller is eligible to mint.
- **NEVER calculate remaining slots as `maxSupply - totalSupply()`**. Burning tokens permanently consumes slots; it never restores public mint capacity.

---

## Step 3: Query Mechanics and Economic Rules
Check pricing and mechanic flags **only if the actual deployed ABI exposes these exact getters**; names differ across contract versions:
- `price() view returns (uint256)`: Public mint price in native wei (ETH or POL).
- `burnClaimEnabled() view returns (bool)`: Is Burn & Claim active?
- `holderClaimEnabled() view returns (bool)`: Is Holder Claim active?
- `oneShotEnabled() view returns (bool)`: Is One-Shot reminting active?
- `creatorMinted()` vs `creatorAllowance()`: Has creator allowance been exhausted?
- `PLATFORM_FEE_BPS()`: Confirm 5% (500 bps) fee split.

---

## Step 4: Fallback Protocol
If RPC or event log access is unavailable:
- State explicitly: *"Contract event logs / storage unverified. Citing known parameters from build manifest pending on-chain confirmation."*
- Never state unverified numbers as verified facts.
