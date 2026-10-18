# Deploy Mintbay collection using Bankr (CREATE2)

1. From the Mintbay skill repository root install `npm install --prefix assets/contracts/v5 --no-audit --no-fund` and run `node scripts/prepare-deploy.mjs BUILD_ID --encode-only --out ./generated/BUILD_ID`.
2. Read `prepare-result.json`. Confirm verified artifact hashes, chain 4663, correct fee recipient, constructor values and EIP-170/EIP-3860 checks. Use `transaction.json` `data` as **creation bytecode**, not a normal contract-call payload.
3. Use Bankr's installed **`deploy_contract`** tool. Bankr uses a CREATE2 proxy `0x4e59b44847b379578588920cA78FbF26c0B4956C`; its `submit_raw_transaction` expects a non-null `to` and is unsuitable for creation. Provide exact initcode and preserved `StandardInput.json`/sources according to the tool interface. Do not invent tool arguments or broadcast manually to the proxy.
4. Show predicted contract address, creator wallet, chain, parameters, gas/cost estimate and bytecode headroom. Get explicit approval **before broadcast**.
5. Submit with `deploy_contract`. Require a successful receipt, recover deployed address from Bankr result or factory event/prediction, check live code and relevant state. Factory transaction receipt `contractAddress` may be null — that is normal for CREATE2. Report tx hash, address and Robinhood explorer URL.
6. Ask Bankr's deployment tool to verify source on Etherscan/Blockscout using preserved compiler input. Report a confirmed verified status only when explorer has confirmed it; otherwise `verification pending`. Backend registration is optional and needs separate authorized credentials.

Do not block solely on `status:draft` or `template.verified:false`; these are not separate authenticated permission gates. But never bypass content hash, feature compatibility, compilation, bytecode or parameter checks. The reference Solidity has not been independently audited or EVM-tested merely because compilation succeeds.
