# Mintbay Agent

**On-chain creation, minting and sharing infrastructure for humans and AI agents.**

This public repository is an integration reference for AI agents using [Mintbay legacy gallery](https://mintbay.xyz), beginning with links for **individual NFT artwork** and **on-chain NFT galleries** that can display large image previews on X.

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
- [Mintbay legacy gallery](https://mintbay.xyz) — collection discovery, minting and gallery sharing.
- [Mintbay NET collection template](https://github.com/FILTER8/mintbay-net-collection-template) — separate example of AI-assisted NET collection deployment.

## Safety

This repository contains documentation only in v0.1. It does not accept wallet secrets, host a signing service, deploy contracts or promise ownership verification without data access. Review any future code and fee structures before deploying mainnet contracts.

## V5 Studio builds (new, development)

This is the **single canonical Mintbay agent skill**. The separate `mintbay-net-collection-template` repository is historical reference only, not a required creator-facing step. Collection-specific source is generated from an immutable Mintbay API build using Net/ERC721A conventions. See `references/BUILDS.md`, `references/NET-INTEGRATION.md`, `references/DEPLOYMENT.md`, and `examples/deploy-v5.md`. Currently read-only; do not use the draft build to initiate deployment.

## Compiled-artwork V5 build workflow (October 2026)

New Studio uploads now publish an additional immutable `compiled-artwork.json` alongside `config.json` and `artwork.json`. Example draft: https://api.mintbay.fun/v1/builds/ebd5e0d8-2919-4f8b-bce9-80ebc5ae00e9 . Agents must fetch all three, verify raw-body SHA-256 hashes and compiler source lineage, validate every trait/weight/pixel/exclusion mask against the original, then generate Solidity constants from the compiled file. See `references/BUILDS.md` and `examples/deploy-v5.md`. This feature enables safer read-only code generation; it **does not** mean the Mintbay V5 minting addons or contract bundle have passed production review.

## Mintbay protocol freeze candidate (October 2026)

See [`references/PROTOCOL-RULES.md`](references/PROTOCOL-RULES.md) and [`references/TEST-MATRIX.md`](references/TEST-MATRIX.md) for agreed platform invariants and executable acceptance criteria. The canonical `MintbayNetIntegratedERC721A` contract is **not yet security-approved or pinned**; `assets/net/` remain earlier reference implementations.

Run `node scripts/validate-build.mjs https://api.mintbay.fun/v1/builds/ebd5e0d8-2919-4f8b-bce9-80ebc5ae00e9` for a *baseline* integrity verification, not a full pixel/mask or EVM audit.

## Mintbay.fun deployment ecosystem (new)

- [Mintbay.fun](https://mintbay.fun) / [Studio](https://mintbay.fun/studio) / [Docs](https://mintbay.fun/docs)
- Immutable V5 build API: `https://api.mintbay.fun/v1/builds/{id}`; older immutable manifests may still reference `api.mintbay.xyz`. Do not rewrite them.
- Permanent immutable 5% primary-mint fee recipient for **future canonical V5 contracts**: `0xcdb9DB46d6C251A334EfF599012011Dc63ff5717`. The deployed or approved V5 contract base is not bundled/pinned; documentation updates do not change any existing on-chain contract.
- [Net Protocol](https://www.netprotocol.app/) messaging integration; Bankr remains the intended agent-assisted flow, not an assertion that public `@bankrbot` can auto-install this skill.
- Optional source-code ASCII-art header is planned, not currently supported by Studio/Worker; see `references/ASCII-HEADER.md`.

Legacy NFT token and gallery share URLs remain on `mintbay.xyz` until new share pages exist.
