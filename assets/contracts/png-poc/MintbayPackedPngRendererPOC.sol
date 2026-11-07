// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base64} from "solady/src/utils/Base64.sol";
import {LibString} from "solady/src/utils/LibString.sol";

/**
 * @notice Mintbay PNG artwork proof of concept, based on Indelible's immutable
 * bytecode artwork and Base64 encoding but using SVG <image> elements.
 * @dev This is deliberately NOT a production NFT renderer: trait IDs are supplied
 * explicitly, and this prototype does not implement weighted selection, metadata
 * attributes, tokenURI(uint256,bytes32), or the Mintbay core integration.
 * Pieces can cross shard boundaries; offsets include the STOP guard at byte 0.
 */
contract MintbayPackedPngRendererPOC {
    using LibString for uint256;

    struct Piece {
        uint16 shardIndex;
        uint32 offset;
        uint32 length;
    }

    uint256 public immutable gridSize;
    address[] public shards;
    Piece[] private pieces;
    uint32[] private traitStarts;

    constructor(
        uint256 gridSize_,
        address[] memory shards_,
        Piece[] memory pieces_,
        uint32[] memory traitStarts_
    ) {
        require(gridSize_ >= 2 && gridSize_ <= 128, "Grid");
        require(shards_.length > 0 && shards_.length <= 65535, "Shards");
        require(traitStarts_.length >= 2 && traitStarts_[0] == 0, "Starts");
        require(traitStarts_[traitStarts_.length - 1] == pieces_.length, "Last start");
        gridSize = gridSize_;
        for (uint256 i; i < shards_.length; ++i) {
            require(shards_[i].code.length > 1, "Missing shard code");
            shards.push(shards_[i]);
        }
        for (uint256 i; i < pieces_.length; ++i) {
            Piece memory p = pieces_[i];
            require(p.shardIndex < shards_.length && p.offset >= 1 && p.length > 0, "Piece");
            require(uint256(p.offset) + p.length <= shards_[p.shardIndex].code.length, "Out of shard");
            pieces.push(p);
        }
        for (uint256 i; i < traitStarts_.length; ++i) {
            require(i == 0 || traitStarts_[i] >= traitStarts_[i - 1], "Start order");
            traitStarts.push(traitStarts_[i]);
        }
    }

    function traitCount() public view returns (uint256) { return traitStarts.length - 1; }
    function shardCount() external view returns (uint256) { return shards.length; }

    function traitPng(uint256 traitId) public view returns (bytes memory data) {
        require(traitId < traitCount(), "Trait id");
        uint256 from = traitStarts[traitId];
        uint256 to = traitStarts[traitId + 1];
        uint256 total;
        for (uint256 i = from; i < to; ++i) total += pieces[i].length;
        data = new bytes(total);
        uint256 copied;
        for (uint256 i = from; i < to; ++i) {
            Piece memory p = pieces[i];
            address shard = shards[p.shardIndex];
            uint256 offset = uint256(p.offset);
            uint256 length = uint256(p.length);
            assembly {
                extcodecopy(shard, add(add(data, 0x20), copied), offset, length)
            }
            copied += length;
        }
    }

    /** IDs must be supplied in *bottom-to-top* layer order. */
    function svgFromTraits(uint256[] memory ids) public view returns (string memory) {
        string memory g = gridSize.toString();
        bytes memory result = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ', g, ' ', g,
            '" width="', g, '" height="', g, '">'
        );
        for (uint256 i; i < ids.length; ++i) {
            result = abi.encodePacked(
                result,
                '<image x="0" y="0" width="', g, '" height="', g,
                '" preserveAspectRatio="none" image-rendering="pixelated" href="data:image/png;base64,',
                Base64.encode(traitPng(ids[i])), '"/>'
            );
        }
        return string(abi.encodePacked(result, '</svg>'));
    }

    function tokenURIFromTraits(uint256 tokenId, uint256[] calldata ids) external view returns (string memory) {
        bytes memory image = bytes(svgFromTraits(ids));
        bytes memory json = abi.encodePacked(
            '{"name":"Mintbay PNG POC #', tokenId.toString(),
            '","description":"Local renderer proof of concept; not a production NFT",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(image), '"}'
        );
        return string(abi.encodePacked('data:application/json;base64,', Base64.encode(json)));
    }
}
