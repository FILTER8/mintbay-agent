// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@limitbreak/creator-token-standards/src/access/OwnableBasic.sol";
import "@limitbreak/creator-token-standards/src/erc721c/ERC721AC.sol";
import "@limitbreak/creator-token-standards/src/programmable-royalties/BasicRoyalties.sol";
import { LibString } from "solady/src/utils/LibString.sol";
import { ReentrancyGuard } from "solady/src/utils/ReentrancyGuard.sol";

interface INet {
    function sendMessage(
        string calldata text,
        string calldata topic,
        bytes calldata data
    ) external;
    function sendMessageViaApp(
        address sender,
        string calldata text,
        string calldata topic,
        bytes calldata data
    ) external;
}

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IBurnableMintbay {
    function burn(uint256 tokenId) external;
}

/// @title MintbayNetIntegratedERC721A
/// @notice Canonical Net-integrated ERC721A base with Limit Break ERC721AC royalties and immutable feature gating.
abstract contract MintbayNetIntegratedERC721A is OwnableBasic, ERC721AC, BasicRoyalties, ReentrancyGuard {
    using LibString for uint256;

    // --- Errors ---
    error Unauthorized();
    error MaxSupplyExceeded();
    error MintLimitExceeded();
    error IncorrectPayment();
    error InvalidSupplyReduction();
    error LineageExhausted();
    error AlreadyClaimed();
    error NotTokenOwner();
    error TransferFailed();
    error NoAccruedFunds();
    error UnauthorizedCollection();
    error HolderClaimDisabled();
    error BurnClaimDisabled();
    error OneShotDisabled();
    error SupplyReductionDisabled();
    error OwnershipTransferDisabled();

    // --- Events ---
    event SupplyReduced(uint256 newMaxSupply);
    event PlatformFeesPaid(address indexed to, uint256 amount);
    event CreatorProceedsWithdrawn(address indexed to, uint256 amount);
    event PayoutRecipientUpdated(address indexed newRecipient);
    event ApprovedClaimCollectionSet(address indexed collection, bool approved, uint256 priceEth);
    event BurnClaimCollectionSet(address indexed sourceCollection, bool approved);
    event TokenClaimed(address indexed sourceContract, uint256 indexed sourceTokenId, uint256 indexed mintedTokenId);
    event BurnAndClaim(address indexed sourceCollection, uint256 indexed sourceTokenId, uint256 indexed mintedTokenId);
    event OneShotReminted(uint256 indexed burnedTokenId, uint256 indexed newTokenId, uint256 indexed lineageRoot);

    // --- Net Protocol Constants ---
    INet public constant NET = INet(0x00000000B24D62781dB359b07880a105cD0b64e6);
    string internal constant TOPIC_MINT = "mint";
    string internal constant TOPIC_TRANSFER = "transfer";
    string internal constant TOPIC_BURN = "burn";
    string internal constant TOPIC_COLLECTION = "nft-collection";

    // --- Immutable Mintbay Protocol Constants ---
    address public constant PLATFORM_FEE_RECIPIENT = 0xcdb9DB46d6C251A334EfF599012011Dc63ff5717;
    uint256 public constant PLATFORM_FEE_BPS = 500; // exactly 5%

    // --- Collection State ---
    uint256 public price;
    uint256 public maxSupply;
    uint256 public immutable maxMintsPerWallet; // 0 = unlimited

    address public payoutRecipient;

    // --- Creator Mint Allowance (FCFS, no protected supply) ---
    uint256 public creatorAllowance;
    uint256 public creatorMinted;

    // --- Exact Accounting State ---
    uint256 public accruedCreatorProceeds;

    // --- Per-Token Seed Storage ---
    mapping(uint256 => bytes32) internal _tokenToSeed;

    // --- Per-Wallet Public Mint Tracking ---
    mapping(address => uint256) public publicMintsCount;

    // --- Immutable Feature Gates ---
    bool public immutable holderClaimEnabled;
    bool public immutable burnClaimEnabled;
    bool public immutable oneShotEnabled;
    bool public immutable supplyReductionEnabled;
    bool public immutable ownershipTransferEnabled;

    // --- Holder Claim Configuration & State ---
    struct ApprovedClaim {
        bool approved;
        uint256 priceEth;
    }
    mapping(address => ApprovedClaim) public approvedClaimCollections;
    uint256 public immutable claimsPerToken;
    mapping(bytes32 => uint256) public claimsUsed;

    // --- Burn & Claim Configuration & State ---
    mapping(address => bool) public approvedBurnClaimCollections;

    // --- One Shot Lineage State ---
    uint256 public constant MAX_REMINTS_PER_LINEAGE = 1;
    mapping(uint256 => uint256) private _tokenToLineage;
    mapping(uint256 => uint256) public remintsByLineage;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 price_,
        uint256 maxSupply_,
        uint256 maxMintsPerWallet_,
        uint256 creatorAllowance_,
        uint256 claimsPerToken_,
        bool holderClaimEnabled_,
        bool burnClaimEnabled_,
        bool oneShotEnabled_,
        bool supplyReductionEnabled_,
        bool ownershipTransferEnabled_,
        address initialOwner_,
        address payoutRecipient_,
        address royaltyReceiver_,
        uint96 royaltyFeeNumerator_
    )
        ERC721AC(name_, symbol_)
        BasicRoyalties(royaltyReceiver_, royaltyFeeNumerator_)
    {
        price = price_;
        maxSupply = maxSupply_;
        maxMintsPerWallet = maxMintsPerWallet_;
        creatorAllowance = creatorAllowance_;
        claimsPerToken = claimsPerToken_;

        holderClaimEnabled = holderClaimEnabled_;
        burnClaimEnabled = burnClaimEnabled_;
        oneShotEnabled = oneShotEnabled_;
        supplyReductionEnabled = supplyReductionEnabled_;
        ownershipTransferEnabled = ownershipTransferEnabled_;

        payoutRecipient = payoutRecipient_;

        if (initialOwner_ != _msgSender()) {
            _transferOwnership(initialOwner_);
        }

        try NET.sendMessage(
            string.concat("Deployed ", name_, " (", symbol_, ")"),
            TOPIC_COLLECTION,
            abi.encode(address(this), name_, symbol_, maxSupply_, price_)
        ) {} catch {}
    }

    // --- ERC165 Disambiguation ---
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721AC, ERC2981)
        returns (bool)
    {
        return ERC721AC.supportsInterface(interfaceId) || ERC2981.supportsInterface(interfaceId);
    }

    // --- Royalty Configuration (Owner-Controlled) ---
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    // --- Ownership Transfer with Gate ---
    function transferOwnership(address newOwner) public virtual override onlyOwner {
        if (!ownershipTransferEnabled) revert OwnershipTransferDisabled();
        super.transferOwnership(newOwner);
    }

    function renounceOwnership() public virtual override onlyOwner {
        if (!ownershipTransferEnabled) revert OwnershipTransferDisabled();
        super.renounceOwnership();
    }

    // --- Admin Configuration ---
    function setPayoutRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert Unauthorized();
        payoutRecipient = newRecipient;
        emit PayoutRecipientUpdated(newRecipient);
    }

    function setApprovedClaimCollection(address collection, bool approved, uint256 priceEth) external onlyOwner {
        if (!holderClaimEnabled) revert HolderClaimDisabled();
        approvedClaimCollections[collection] = ApprovedClaim({
            approved: approved,
            priceEth: priceEth
        });
        emit ApprovedClaimCollectionSet(collection, approved, priceEth);
    }

    function setBurnClaimCollection(address sourceCollection, bool approved) external onlyOwner {
        if (!burnClaimEnabled) revert BurnClaimDisabled();
        approvedBurnClaimCollections[sourceCollection] = approved;
        emit BurnClaimCollectionSet(sourceCollection, approved);
    }

    function reduceMaxSupply(uint256 newMaxSupply) external onlyOwner {
        if (!supplyReductionEnabled) revert SupplyReductionDisabled();
        if (newMaxSupply >= maxSupply || newMaxSupply < _totalMinted()) {
            revert InvalidSupplyReduction();
        }
        maxSupply = newMaxSupply;
        emit SupplyReduced(newMaxSupply);
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
    }

    // --- Payment & Withdrawal Logic ---
    function _accruePayment(uint256 payment) internal {
        if (payment > 0) {
            uint256 fee = (payment * PLATFORM_FEE_BPS) / 10000;
            uint256 proceeds = payment - fee;
            accruedCreatorProceeds += proceeds;
            if (fee != 0) {
                (bool paid, ) = PLATFORM_FEE_RECIPIENT.call{value: fee}("");
                if (!paid) revert TransferFailed();
                emit PlatformFeesPaid(PLATFORM_FEE_RECIPIENT, fee);
            }
        }
    }

    function withdrawCreatorProceeds() external nonReentrant {
        uint256 amount = accruedCreatorProceeds;
        if (amount == 0) revert NoAccruedFunds();
        accruedCreatorProceeds = 0;
        (bool success, ) = payoutRecipient.call{value: amount}("");
        if (!success) revert TransferFailed();
        emit CreatorProceedsWithdrawn(payoutRecipient, amount);
    }

    // --- Optional per-collection seed selection (V5.1) ---
    function _selectMintSeed(uint256, bytes32 candidate) internal virtual returns (bytes32) {
        return candidate;
    }

    // --- Internal Minting & Seeding ---
    function _mintSeeded(address to, uint256 quantity) internal returns (uint256 startTokenId) {
        if (_totalMinted() + quantity > maxSupply) revert MaxSupplyExceeded();

        startTokenId = _nextTokenId();
        for (uint256 i = 0; i < quantity; i++) {
            _tokenToSeed[startTokenId + i] = _selectMintSeed(startTokenId + i, keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    to,
                    startTokenId + i,
                    address(this)
                )
            ));
        }
        _mint(to, quantity);
    }

    // --- Public Mint ---
    function mint(uint256 quantity) external payable nonReentrant {
        if (quantity == 0) revert IncorrectPayment();
        if (maxMintsPerWallet > 0 && publicMintsCount[msg.sender] + quantity > maxMintsPerWallet) {
            revert MintLimitExceeded();
        }
        if (msg.value != price * quantity) revert IncorrectPayment();

        if (maxMintsPerWallet > 0) {
            publicMintsCount[msg.sender] += quantity;
        }
        _accruePayment(msg.value);
        _mintSeeded(msg.sender, quantity);
    }

    // --- Creator Mint (Allowance, FCFS) ---
    function creatorMint(address to, uint256 quantity) external onlyOwner nonReentrant {
        if (quantity == 0) revert IncorrectPayment();
        if (creatorMinted + quantity > creatorAllowance) revert MintLimitExceeded();

        creatorMinted += quantity;
        _mintSeeded(to, quantity);
    }

    // --- Holder Claim ---
    function holderClaim(address sourceContract, uint256 sourceTokenId) external payable nonReentrant {
        if (!holderClaimEnabled) revert HolderClaimDisabled();
        ApprovedClaim memory claimConfig = approvedClaimCollections[sourceContract];
        if (!claimConfig.approved) revert UnauthorizedCollection();
        if (IERC721(sourceContract).ownerOf(sourceTokenId) != msg.sender) revert NotTokenOwner();

        bytes32 claimKey = keccak256(abi.encode(sourceContract, sourceTokenId));
        if (claimsUsed[claimKey] >= claimsPerToken) revert AlreadyClaimed();
        if (msg.value != claimConfig.priceEth) revert IncorrectPayment();

        claimsUsed[claimKey]++;
        _accruePayment(msg.value);
        uint256 newTokenId = _mintSeeded(msg.sender, 1);
        emit TokenClaimed(sourceContract, sourceTokenId, newTokenId);
    }

    // --- Burn & Claim (1:1, Free) ---
    function burnAndClaim(address sourceCollection, uint256 sourceTokenId) external payable nonReentrant {
        if (!burnClaimEnabled) revert BurnClaimDisabled();
        if (!approvedBurnClaimCollections[sourceCollection]) revert UnauthorizedCollection();
        if (IERC721(sourceCollection).ownerOf(sourceTokenId) != msg.sender) revert NotTokenOwner();
        if (msg.value != 0) revert IncorrectPayment();

        // 1. Pre-flight check on destination capacity BEFORE external call
        if (_totalMinted() + 1 > maxSupply) revert MaxSupplyExceeded();

        // 2. Burn source token
        IBurnableMintbay(sourceCollection).burn(sourceTokenId);

        // 3. Mint destination token
        uint256 newTokenId = _mintSeeded(msg.sender, 1);

        emit BurnAndClaim(sourceCollection, sourceTokenId, newTokenId);
    }

    // --- One Shot Remint ---
    function oneShotRemint(uint256 tokenId) external nonReentrant {
        if (!oneShotEnabled) revert OneShotDisabled();
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        uint256 root = _tokenToLineage[tokenId] == 0 ? (tokenId + 1) : _tokenToLineage[tokenId];
        if (remintsByLineage[root] >= MAX_REMINTS_PER_LINEAGE) revert LineageExhausted();

        remintsByLineage[root]++;
        _burn(tokenId, true);

        uint256 newTokenId = _mintSeeded(msg.sender, 1);
        _tokenToLineage[newTokenId] = root;
        emit OneShotReminted(tokenId, newTokenId, root);
    }

    // --- Universal Burn Interface ---
    function burn(uint256 tokenId) external {
        _burn(tokenId, true);
    }

    // --- Net Protocol Hooks Chained with Limit Break ERC721AC ---
    function _afterTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal virtual override {
        super._afterTokenTransfers(from, to, startTokenId, quantity);

        if (from == address(0)) {
            for (uint256 i = 0; i < quantity; i++) {
                uint256 tId = startTokenId + i;
                try NET.sendMessageViaApp(
                    to,
                    string.concat("Minted #", tId.toString()),
                    TOPIC_MINT,
                    abi.encode(to, tId, _tokenToSeed[tId])
                ) {} catch {}
            }
        } else if (to == address(0)) {
            for (uint256 i = 0; i < quantity; i++) {
                uint256 tId = startTokenId + i;
                try NET.sendMessageViaApp(
                    from,
                    string.concat("Burned #", tId.toString()),
                    TOPIC_BURN,
                    abi.encode(from, tId)
                ) {} catch {}
            }
        } else {
            for (uint256 i = 0; i < quantity; i++) {
                uint256 tId = startTokenId + i;
                try NET.sendMessageViaApp(
                    from,
                    string.concat("Transferred #", tId.toString()),
                    TOPIC_TRANSFER,
                    abi.encode(from, to, tId)
                ) {} catch {}
            }
        }
    }
}
