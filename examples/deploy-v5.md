# Bankr — safe initial V5 compile/review prompt

@bankrbot review Mintbay V5 build https://api.mintbay.xyz/v1/builds/acca1ae6-8078-4315-82eb-d0866aba54b4 using the Mintbay skill. Fetch the manifest, config and artwork; verify SHA256 hashes and validate all selected features. Use the pinned Net-integrated ERC721A source (from the Mintbay skill), choose the correct administration variant, generate collection-specific artwork data/renderer/contract and compile/test them. Report any missing dependencies, unsupported features, incorrect Net behavior, contract-size limits or misconfigured options. Do not modify the collection settings to make the build pass. STRICTLY READ-ONLY: do not sign, deploy, mint, broadcast transactions, register an unconfirmed deployment or spend funds. Report source hashes and actual test status.

Note: The example build is intentionally still a `draft`. Do not treat this prompt as a deployment authorization.
