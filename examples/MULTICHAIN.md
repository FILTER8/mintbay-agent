# Mintbay V6: six-chain deployment

The chain is fixed by the immutable Studio Build ID. Never alter the chain in the generated transaction or switch chains when submitting it.

| Chain ID | Bankr slug | Native currency | Net hooks |
| --- | --- | --- | --- |
| 1 | mainnet | ETH | enabled |
| 130 | unichain | ETH | enabled |
| 137 | polygon | POL | disabled |
| 4663 | robinhood | ETH | enabled |
| 8453 | base | ETH | enabled |
| 42161 | arbitrum | ETH | disabled |

The shared Net messaging address on the four enabled networks is `0x00000000B24D62781dB359b07880a105cD0b64e6`. Constructor registration, mint, transfer and burn hooks are skipped on Polygon and Arbitrum. If deployment to a chain outside this list is requested, stop.

Use the exact `transaction.json` initcode with Bankr `deploy_contract` on the matching network; save and verify `StandardInput.json` on that network. ERC721C / ERC2981 royalties remain part of the generated collection, but configuring marketplace transfer-validator enforcement may require a separate post-deployment transaction. Never claim enforced royalties are active until confirmed. Holder-claim and burn-and-claim source contracts must exist on the target chain. Do not treat an EVM-only compilation check as a chain deployment test. Native-token prices and 5% platform fees use POL on Polygon and ETH elsewhere; ensure all mint UI and Bankr fee estimates use the target chain native currency. Net post-launch announcements run only on chains where hooks are enabled; failures must not be conflated with deployment failures.
