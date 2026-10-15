# Mintbay Agent

**On-chain creation, minting and sharing infrastructure for humans and AI agents.**

This public repository is an integration reference for AI agents using [Mintbay](https://mintbay.xyz), beginning with links for **individual NFT artwork** and **on-chain NFT galleries** that can display large image previews on X.

It is designed to **complement**, not replace, Mintbay's existing NFT launchpad and smart contracts.

## What works now (v0.1)

- Individual NFT token pages with on-chain artwork and X preview metadata.
- Individual PNG export through a public Mintbay URL for supported on-chain collections.
- Mintbay's visual gallery exporter, including wallet view, collection exploration and trait filtering.
- Shareable selected-token galleries whose X preview cards have been tested using Mintbay.

> An X card is a **website preview**. It is not an uploaded X image. The public `@bankrbot` account has **not** been confirmed to include Mintbay URLs reliably, even when prompted. Installing instructions into a private/configured agent does not change the public bot automatically.

## Agent entry point

See [`SKILL.md`](./SKILL.md). For supported URL formats and examples, see [`references/URLS.md`](./references/URLS.md).

**Single token example:**

https://mintbay.xyz/token/4663/0x2eE6305804dD94F7ff695C5Ab1f3AE805f317653/68

**Gallery example:**

https://mintbay.xyz/gallery/share?chain=4663&collection=0x2eE6305804dD94F7ff695C5Ab1f3AE805f317653&ids=13%2C57%2C60%2C78%2C86%2C91%2C106%2C113%2C150&grid=3&gap=20&margin=68&scale=100&bg=white&labels=0

## Repository contents

- `SKILL.md`: primary instructions for compatible agents.
- `references/URLS.md`: documented URL formats and tested examples.
- `references/CHAINS.md`: supported-chain considerations.
- `references/ROADMAP.md`: minting and deployment roadmap; proposed features clearly labeled.
- `examples/`: sample agent prompts and example responses.

## Test with Bankr

Provide `SKILL.md` to a **Bankr agent configured to load custom skills**, according to the agent's supported installation process. First test with a **known NFT token ID** to isolate whether the agent can output the URL. Then test wallet lookups only when the agent has verified ownership tools. The public `@bankrbot` account on X is a separate integration and is not guaranteed to load this repository.

## Related projects

- [Mintbay Studio](https://studio.mintbay.xyz) — on-chain pixel-art creator.
- [Mintbay](https://mintbay.xyz) — collection discovery, minting and gallery sharing.
- [Mintbay NET collection template](https://github.com/FILTER8/mintbay-net-collection-template) — separate example of AI-assisted NET collection deployment.

## Safety

This repository contains documentation only in v0.1. It does not accept wallet secrets, host a signing service, deploy contracts or promise ownership verification without data access. Review any future code and fee structures before deploying mainnet contracts.
