# Roadmap (proposed, not live API contracts)

## v0.1 — NFT sharing (now)

Public token pages, public gallery share pages, PNG endpoints, on-chain token rendering for supported formats. Documentation and tested examples.

## v0.2 — Agent ownership lookup

Build and document a stable Mintbay API allowing agents to query NFT IDs currently held by a wallet for a specified chain/collection. Include pagination, clear errors and rate limits. **No endpoint in this repo should be interpreted as a live ownership API yet.**

## v0.3 — Agent gallery composition

Optional safe, rate-limited API for validated token selections and deterministic public share URLs; caching for fast X card retrieval. Support agent-created galleries without requiring an image upload.

## v0.4 — Minting integration

Introduce audited/verified ABI adapters for existing Mintbay contracts and compatible third-party collections, with explicit transaction simulation and wallet authorization. Never sign or spend on behalf of users without appropriate user-controlled approval.

## v0.5+ — Mintbay AI launchpad

Review Mintbay's existing V4 contract architecture first; then design versioned, audited launch templates, documented creator controls, verified deployment, and any transparent Mintbay platform fees. AI should configure approved contracts rather than freely rewriting payment and ownership logic.

## V5 development — actual current state (2026-10-17)

Studio -> API immutable drafts are operational; first test build is on Robinhood Chain. Discovery Worker GET `/v1/collections` returned `{"collections":[],"count":0}` before any deployments. Private deployment registration and first-mint detection are under development/testing. The expanded Mintbay skill supports read-only build interpretation and Bankr generation guidance. No general V5 verified/compiled deployable bundle has been published in this package. See BUILDS.md, NET-INTEGRATION.md and DEPLOYMENT.md.
