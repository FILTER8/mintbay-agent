# Example: individual NFT

**Prompt (known ID):**

> Show 8x8Portait #68 on Mintbay on Robinhood Chain. Return the entire NFT page URL so X can show the artwork.

**Expected response:**

8x8Portait #68 on Mintbay:
https://mintbay.xyz/token/4663/0x2eE6305804dD94F7ff695C5Ab1f3AE805f317653/68

**Prompt (ownership-dependent):**

> Find an 8x8Portait I own and share it on Mintbay.

This second prompt **requires a trusted ownership lookup**, otherwise the agent must ask for the wallet/token ID or direct the user to https://mintbay.xyz/gallery. Never invent token ownership.
