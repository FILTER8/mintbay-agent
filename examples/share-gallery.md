# Example: gallery

**Prompt (known IDs):**

> Create a Mintbay 3x3 share gallery for token IDs 13, 57, 60, 78, 86, 91, 106, 113, 150 in the 8x8Portait collection on Robinhood Chain. Reply with the full page URL.

**Expected response:**

View this 9-NFT Mintbay gallery:
https://mintbay.xyz/gallery/share?chain=4663&collection=0x2eE6305804dD94F7ff695C5Ab1f3AE805f317653&ids=13%2C57%2C60%2C78%2C86%2C91%2C106%2C113%2C150&grid=3&gap=20&margin=68&scale=100&bg=white&labels=0

**Prompt (wallet gallery):**

> Create a Mintbay gallery from 9 NFTs owned by my wallet.

The agent must verify current holdings first; a gallery URL is not proof of ownership. If the agent has no ownership lookup integration, direct the user to https://mintbay.xyz/gallery for manual selection and sharing.
