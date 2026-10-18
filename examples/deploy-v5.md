# Deployment prompt for Bankr

> Use the installed Mintbay agent skill to deploy my Mintbay NFT collection on Robinhood Chain. Build ID: `BUILD_ID`. Run `node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out ./generated/BUILD_ID`; show me the prepared deployment transaction and contract details. With my approval, use Bankr's **contract creation** signing/submit capability, wait for the confirmed receipt, and verify the Solidity source on the explorer using the saved `StandardInput.json`. Show the transaction, contract address and truthful verification status.

If the Bankr signing API does not support `to:null` contract creation, report the exact limitation rather than suggesting a normal `to:0x...` call deploys it.
