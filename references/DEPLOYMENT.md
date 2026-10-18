# Mintbay one-command deployment (Net-style encode-only)

## 1. Prepare (no wallet or secret)

```bash
npm install --prefix assets/contracts/v5 --no-audit --no-fund
node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out ./generated/BUILD_ID
```

The script validates Mintbay V5 build content, generates collection-specific Solidity, resolves all dependency source files, compiles, and exports:

- `transaction.json` — `chainId:4663`, `to:null`, creation `data`, `value:"0"`.
- `StandardInput.json` — full exact compiler input suitable for source verification.
- `abi.json`, `prepare-result.json`, `sources/`.

Compiler pinned in `assets/contracts/v5/package.json`: solc 0.8.24, viaIR, optimizer runs 200, Cancun. Reproduce the compiler output from this input; never patch generated sources behind the user's back. Enforce bytecode size checks.

## 2. Broadcast with Bankr

Use Bankr's actual contract-deployment/contract-creation API to submit the unsigned transaction. **Verify that the Bankr API accepts null/omitted `to`; not all sign-submit endpoints permit this.** The `@bankr submit transaction to 0x...` form in Net's skill is for ordinary contract calls, not creation transactions.

Show a summary of chain, deployment address/wallet, fee behavior, mint price, maximum supply, expected runtime size, and user-visible warnings. Ask for confirmation before irreversibly broadcasting. No pasted private keys and no hardcoded sample deployment addresses.

## 3. Receipt and verification

Once Bankr returns a confirmed successful receipt, use the receipt's `contractAddress` (not a guessed address) and save tx hash, chain ID, build ID, generation hashes, compiler version, and StandardInput JSON. Submit that Standard JSON to the chain's actual supported explorer verification API using credentials supplied privately by the operator. Verification is a second asynchronous state; return its confirmed link only if it succeeds. `verification pending` is an acceptable truthful response.

Post-deployment Mintbay registration, if available, is a separate authenticated backend action, not a prerequisite for an on-chain deployment. Do not commit credentials or expose an unauthenticated registration route.

## 4. What a successful preparation proves

- Correct build content hashes, lineage, generator output and clean Solidity compilation.
- Valid EIP-170 and EIP-3860 size limits.

It does **not** prove deployment, EVM economic invariants, guaranteed royalty enforcement, explorer verification or audit. Execute live EVM tests before marketing this contract implementation as secure. Creator approval permits a knowingly requested transaction, not false verification claims.
