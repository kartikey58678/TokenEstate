// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";



contract RWATokenization is ERC721, ReentrancyGuard, Ownable {

    

    struct Asset {
        address assetOwner;
        uint256 totalShares;
        uint256 pricePerShare;
        uint256 soldShares;
        bool active;
    }

    uint256 public assetCount;
    uint256 public nftId;

    mapping(uint256 => Asset) public assets;
    mapping(uint256 => uint256) public nftToAsset;
    mapping(uint256 => uint256) public nftToShares;

    event AssetAdded(uint256 assetId, address owner);
    event SharesBought(uint256 assetId, address buyer, uint256 shares);
    event OwnershipNFTMinted(address user, uint256 tokenId);

constructor()
    ERC721("RWA Ownership NFT", "RWANFT")
    Ownable(msg.sender)
{}
    // 1. Add a new Real World Asset
    mapping(uint256 => string) public assetMetadataCID;
    function addAsset(
    uint256 totalShares,
    uint256 pricePerShare,
    string calldata metadataCID
) external {
    require(totalShares > 0, "Invalid shares");
    require(pricePerShare > 0, "Invalid price");
    require(bytes(metadataCID).length > 0, "Empty metadata");

    assetCount++;

    assets[assetCount] = Asset({
        assetOwner: msg.sender,
        totalShares: totalShares,
        pricePerShare: pricePerShare,
        soldShares: 0,
        active: true
    });

    assetMetadataCID[assetCount] = metadataCID;

    emit AssetAdded(assetCount, msg.sender);
}

function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory)
{
    uint256 assetId = nftToAsset[tokenId];
    return string(abi.encodePacked("ipfs://", assetMetadataCID[assetId]));
}
    // 2. Buy fractional ownership
    function buyShares(
        uint256 assetId,
        uint256 shares
    ) external payable nonReentrant {
        Asset storage asset = assets[assetId];

        require(asset.active, "Asset inactive");
        require(shares > 0, "Zero shares");
        require(
            asset.soldShares + shares <= asset.totalShares,
            "Not enough shares"
        );

        uint256 cost = shares * asset.pricePerShare;
        require(msg.value == cost, "Incorrect ETH sent");

        asset.soldShares += shares;

        // Mint NFT as ownership proof
        nftId++;
        _mint(msg.sender, nftId);

        nftToAsset[nftId] = assetId;
        nftToShares[nftId] = shares;

        // Transfer ETH to asset owner
        payable(asset.assetOwner).transfer(msg.value);

        emit SharesBought(assetId, msg.sender, shares);
        emit OwnershipNFTMinted(msg.sender, nftId);
    }

    // 3. Disable asset sales
    function deactivateAsset(uint256 assetId) external {
        require(
            assets[assetId].assetOwner == msg.sender,
            "Not asset owner"
        );
        assets[assetId].active = false;
    }

    // 4. View helper
    function getAsset(uint256 assetId) external view returns (Asset memory) {
        return assets[assetId];
    }
}
