// SPDX-License-Identifier: MIT
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::                                                                                            ::
// ::  ████████╗██╗  ██╗███████╗    ████████╗███████╗███████╗████████╗███████╗██████╗ ███████╗   ::
// ::  ╚══██╔══╝██║  ██║██╔════╝    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██╔════╝██╔══██╗██╔════╝   ::
// ::     ██║   ███████║█████╗         ██║   █████╗  ███████╗   ██║   █████╗  ██████╔╝███████╗   ::
// ::     ██║   ██╔══██║██╔══╝         ██║   ██╔══╝  ╚════██║   ██║   ██╔══╝  ██╔══██╗╚════██║   ::
// ::     ██║   ██║  ██║███████╗       ██║   ███████╗███████║   ██║   ███████╗██║  ██║███████║   ::
// ::     ╚═╝   ╚═╝  ╚═╝╚══════╝       ╚═╝   ╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝   ::
// ::                                                                                            ::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
pragma solidity ^0.8.24;

import { MintbayNetIntegratedERC721A } from "./contracts/MintbayNetIntegratedERC721A.sol";
import { TheTestersData } from "./TheTestersData.sol";
import { TheTestersRenderer } from "./TheTestersRenderer.sol";

contract TheTesters is MintbayNetIntegratedERC721A {
    constructor()
        MintbayNetIntegratedERC721A(
            "THE TESTERS",
            "THETESTERS",
            0.001 ether, // price
            256,         // maxSupply
            0,           // maxMintsPerWallet (unlimited)
            20,          // creatorAllowance
            1,           // claimsPerToken
            true,        // holderClaimEnabled
            false,       // burnClaimEnabled (disabled)
            true,        // oneShotEnabled
            true,        // supplyReductionEnabled
            true,        // ownershipTransferEnabled
            0xb316e8ea7bc9b24ea5fd4ebd07051678c27ffe79, // initialOwner
            0xb316e8ea7bc9b24ea5fd4ebd07051678c27ffe79, // payoutRecipient
            0xb316e8ea7bc9b24ea5fd4ebd07051678c27ffe79, // royaltyReceiver
            600          // royaltyFeeNumerator (6%)
        )
    {
        // Source 1: OnChainHoodies
        approvedClaimCollections[0x9Ec6C5b9f572A9B02138E553BC5F5882Da735F45] = ApprovedClaim({
            approved: true,
            priceEth: 0
        });

        // Source 2: Net Protocol Test (8x8Portait)
        approvedClaimCollections[0x2eE6305804dD94F7ff695C5Ab1f3AE805f317653] = ApprovedClaim({
            approved: true,
            priceEth: 0
        });

        // Source 3: HoodFrame (64 Faces)
        approvedClaimCollections[0xC8E36aE47246e5943da2B228fbAff1Fb27a473B0] = ApprovedClaim({
            approved: true,
            priceEth: 0
        });
    }

    function getSeed(uint256 tokenId) external view returns (bytes32) {
        if (!_exists(tokenId)) revert OwnerQueryForNonexistentToken();
        return _tokenToSeed[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert OwnerQueryForNonexistentToken();
        return TheTestersRenderer.renderTokenURI(tokenId, _tokenToSeed[tokenId]);
    }
}
