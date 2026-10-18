// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base64} from "solady/src/utils/Base64.sol";
import {LibString} from "solady/src/utils/LibString.sol";
import {TheTestersData} from "./TheTestersData.sol";

library TheTestersRenderer {
    using LibString for uint256;

    function renderSVG(bytes32 seed) public pure returns (string memory) {
        uint256[4] memory chosen = TheTestersData.getTraits(seed);
        uint8[144] memory grid;

        for (uint256 l = 0; l < 4; l++) {
            bytes memory px = TheTestersData.getTraitPixels(chosen[l]);
            for (uint256 i = 0; i < 144; i++) {
                uint8 c = uint8(px[i]);
                if (c > 0) {
                    grid[i] = c;
                }
            }
        }

        string memory rects = "";
        for (uint256 y = 0; y < 12; y++) {
            for (uint256 x = 0; x < 12; x++) {
                uint8 c = grid[y * 12 + x];
                if (c > 0) {
                    rects = string.concat(
                        rects,
                        '<rect x="',
                        x.toString(),
                        '" y="',
                        y.toString(),
                        '" width="1" height="1" fill="',
                        TheTestersData.getPaletteColor(c),
                        '"/>'
                    );
                }
            }
        }

        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" shape-rendering="crispEdges">',
            rects,
            '</svg>'
        );
    }

    function renderAttributes(bytes32 seed) internal pure returns (string memory) {
        uint256[4] memory chosen = TheTestersData.getTraits(seed);
        string memory attrs = "";
        for (uint256 l = 0; l < 4; l++) {
            attrs = string.concat(
                attrs,
                l > 0 ? "," : "",
                '{"trait_type":"',
                TheTestersData.getLayerName(l),
                '","value":"',
                TheTestersData.getTraitName(chosen[l]),
                '"}'
            );
        }
        return string.concat('[', attrs, ']');
    }

    function renderTokenURI(uint256 tokenId, bytes32 seed) public pure returns (string memory) {
        string memory svg = renderSVG(seed);
        string memory json = string.concat(
            '{"name":"THE TESTERS #',
            tokenId.toString(),
            '","description":"Fully on-chain 12x12 pixel collection generated on Robinhood Chain.",',
            '"image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '","attributes":',
            renderAttributes(seed),
            '}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
}
