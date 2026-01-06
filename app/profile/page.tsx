'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { useWallet } from '../../src/hooks/useWallet';
import { useRWATokenization } from '../../src/hooks/useRWATokenization';
import { getIPFSUrl, uploadFileToIPFS, uploadJSONToIPFS } from '../../src/utils/pinata';

interface NFTOwnership {
  tokenId: number;
  assetId: number;
  shares: number;
  owner: string;
  asset?: {
    assetOwner: string;
    totalShares: number;
    pricePerShare: number;
    soldShares: number;
    active: boolean;
  };
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
}

export default function ProfilePage() {
  const { address, isConnected } = useWallet();
  const { getNftToAsset, getNftToShares, getAsset, addAsset, getLastNftId, getTokenURI, getTokenOwner } = useRWATokenization();

  const [nfts, setNfts] = useState<NFTOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [checkingToken, setCheckingToken] = useState(false);

  // localStorage key for persisting NFTs
  const NFT_STORAGE_KEY = 'user_nfts';

  // Load NFTs from localStorage on component mount
  useEffect(() => {
    if (address) {
      const stored = localStorage.getItem(`${NFT_STORAGE_KEY}_${address}`);
      if (stored) {
        try {
          const parsedNFTs = JSON.parse(stored);
          setNfts(parsedNFTs);
        } catch (error) {
          console.error('Error loading NFTs from localStorage:', error);
        }
      }
    }
  }, [address]);

  // Save NFTs to localStorage whenever nfts state changes
  useEffect(() => {
    if (address && nfts.length > 0) {
      localStorage.setItem(`${NFT_STORAGE_KEY}_${address}`, JSON.stringify(nfts));
    }
  }, [nfts, address]);

  // Asset creation states
  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [totalShares, setTotalShares] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [propertyImage, setPropertyImage] = useState<File | null>(null);
  const [creatingAsset, setCreatingAsset] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMetadata, setUploadingMetadata] = useState(false);
  const [imageCID, setImageCID] = useState<string>('');
  const [metadataCID, setMetadataCID] = useState<string>('');

  const checkTokenOwnership = async () => {
    if (!tokenIdInput.trim() || !address || !isConnected) return;

    const tokenId = parseInt(tokenIdInput.trim());
    if (isNaN(tokenId) || tokenId <= 0) {
      setError('Please enter a valid token ID');
      return;
    }

    try {
      setCheckingToken(true);
      setError(null);

      // Check if this token ID is already in our list
      if (nfts.some(nft => nft.tokenId === tokenId)) {
        setError('This token is already in your list');
        return;
      }

      // Verify ownership first
      const owner = await getTokenOwner(tokenId);
      if (owner.toLowerCase() !== address.toLowerCase()) {
        setError('You do not own this NFT token');
        return;
      }

      // Get NFT data from contract
      const [assetId, shares] = await Promise.all([
        getNftToAsset(tokenId),
        getNftToShares(tokenId)
      ]);

      const assetData = await getAsset(Number(assetId));

      // Get metadata from tokenURI
      let metadata = null;
      try {
        const tokenURI = await getTokenURI(tokenId);
        console.log('Token URI for token', tokenId, ':', tokenURI);

        if (tokenURI && tokenURI !== '') {
          // Handle IPFS URIs
          let metadataUrl = tokenURI;
          if (tokenURI.startsWith('ipfs://')) {
            metadataUrl = getIPFSUrl(tokenURI.replace('ipfs://', ''));
          } else if (!tokenURI.startsWith('http')) {
            // If it's not an IPFS URI and not an HTTP URL, assume it's an IPFS hash
            metadataUrl = getIPFSUrl(tokenURI);
          }

          console.log('Fetching metadata from URL:', metadataUrl);

          const response = await fetch(metadataUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const rawMetadata = await response.json();
            console.log('Raw metadata fetched:', rawMetadata);

            // Process the metadata to handle IPFS image URLs
            metadata = {
              ...rawMetadata,
              image: rawMetadata.image?.startsWith('ipfs://')
                ? getIPFSUrl(rawMetadata.image.replace('ipfs://', ''))
                : rawMetadata.image
            };

            console.log('Processed metadata:', metadata);
          } else {
            console.error('Failed to fetch metadata. Status:', response.status, response.statusText);
          }
        } else {
          console.warn('Empty or invalid tokenURI');
        }
      } catch (metadataError) {
        console.error('Could not fetch metadata from tokenURI:', metadataError);
      }

      const nftData: NFTOwnership = {
        tokenId,
        assetId: Number(assetId),
        shares: Number(shares),
        owner,
        asset: {
          assetOwner: assetData.assetOwner,
          totalShares: Number(assetData.totalShares),
          pricePerShare: Number(assetData.pricePerShare),
          soldShares: Number(assetData.soldShares),
          active: assetData.active,
        },
        metadata: metadata || {
          name: `Asset #${assetId} Ownership`,
          description: `Ownership certificate for ${shares} shares of Asset #${assetId}`,
          image: '', // Will be set from metadata if available
          attributes: [
            { trait_type: "Asset ID", value: Number(assetId) },
            { trait_type: "Shares Owned", value: Number(shares) },
            { trait_type: "Token Type", value: "RWA Ownership NFT" }
          ]
        }
      };

      setNfts(prev => [...prev, nftData]);
      setTokenIdInput('');
    } catch (err) {
      console.error('Failed to check token:', err);
      setError('Failed to verify token ownership. Please check the token ID.');
    } finally {
      setCheckingToken(false);
    }
  };

  const removeToken = (tokenId: number) => {
    setNfts(prev => prev.filter(nft => nft.tokenId !== tokenId));
  };

  const handleCreateAsset = async () => {
    // Validate all inputs
    if (!assetName.trim() || !assetDescription.trim() || !totalShares.trim() || !pricePerShare.trim() || !propertyImage) {
      setError('Please fill in all fields and select a property image');
      return;
    }

    const totalSharesNum = parseInt(totalShares);
    const pricePerShareNum = parseFloat(pricePerShare);

    if (isNaN(totalSharesNum) || totalSharesNum <= 0) {
      setError('Total shares must be a positive number');
      return;
    }

    if (isNaN(pricePerShareNum) || pricePerShareNum <= 0) {
      setError('Price per share must be a positive number');
      return;
    }

    try {
      setError(null);

      // Step 1: Upload property image to Pinata
      setUploadingImage(true);
      const imageCIDResult = await uploadFileToIPFS(propertyImage);
      setImageCID(imageCIDResult);
      setUploadingImage(false);

      // Step 2: Create and upload asset metadata
      setUploadingMetadata(true);
      const assetMetadata = {
        name: assetName,
        description: assetDescription,
        image: `ipfs://${imageCIDResult}`,
        attributes: [
          {
            trait_type: "Total Shares",
            value: totalSharesNum
          },
          {
            trait_type: "Price per Share",
            value: pricePerShareNum,
            display_type: "number"
          },
          {
            trait_type: "Asset Type",
            value: "Real World Asset"
          }
        ],
        properties: {
          totalShares: totalSharesNum,
          pricePerShare: pricePerShareNum,
          imageCID: imageCIDResult
        }
      };

      const metadataCIDResult = await uploadJSONToIPFS(assetMetadata);
      setMetadataCID(metadataCIDResult);
      setUploadingMetadata(false);

      // Step 3: Create asset on blockchain
      setCreatingAsset(true);
      const priceInWei = ethers.parseEther(pricePerShareNum.toString());

      await addAsset(totalSharesNum, priceInWei, metadataCIDResult);

      // Clear form and reset states
      setAssetName('');
      setAssetDescription('');
      setTotalShares('');
      setPricePerShare('');
      setPropertyImage(null);
      setImageCID('');
      setMetadataCID('');

      // Reset file input
      const fileInput = document.getElementById('property-image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      alert(`Asset created successfully! Image CID: ${imageCIDResult}, Metadata CID: ${metadataCIDResult}`);
    } catch (err: any) {
      console.error('Failed to create asset:', err);
      setError(`Failed to create asset: ${err.message || 'Unknown error'}`);
    } finally {
      setCreatingAsset(false);
      setUploadingImage(false);
      setUploadingMetadata(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center min-h-[400px] flex items-center justify-center">
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">Connect Your Wallet</h1>
              <p className="text-xl text-gray-300 mb-8">
                🔗 Connect your wallet to view your NFT ownership certificates.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 mb-4">Your NFT Portfolio</h1>
          <p className="text-xl text-gray-300">
            View your real world asset ownership certificates.
          </p>
        </div>

      {/* Token ID Input */}
      <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Check NFT Ownership</h2>
        <p className="text-gray-300 mb-6 text-lg">
          Enter a token ID to verify ownership and add it to your portfolio.
        </p>

        {error && (
          <div className="text-red-400 text-sm mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="number"
            value={tokenIdInput}
            onChange={(e) => setTokenIdInput(e.target.value)}
            placeholder="Enter Token ID"
            className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
            min="1"
          />
          <button
            onClick={checkTokenOwnership}
            disabled={checkingToken || !tokenIdInput.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingToken ? 'Verifying...' : 'Check Ownership'}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>Note: Only NFTs owned by your connected wallet address will be displayed.</p>
          <p className="mt-1"><strong>How to find your NFT Token ID:</strong></p>
          <ul className="mt-1 ml-4 list-disc text-xs">
            <li>After purchasing shares, check the success message for "NFT Token ID: [number]"</li>
            <li>Enter that number in the input field above</li>
            <li>The NFT represents your ownership certificate for the purchased shares</li>
          </ul>
          <p className="mt-2 text-xs text-blue-600">
            <strong>Tip:</strong> NFTs are now saved locally and will persist after page refresh.
          </p>
        </div>
      </div>

      {/* Create Asset Section */}
      <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-pink-500/20 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Create New Asset</h2>
        <p className="text-gray-300 mb-6 text-lg">
          Tokenize a new real world asset for fractional ownership. Upload property details and image to IPFS.
        </p>

        {error && (
          <div className="text-red-400 text-sm mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded">
            {error}
          </div>
        )}

        {/* Progress indicators */}
        {(uploadingImage || uploadingMetadata || creatingAsset) && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span>
                {uploadingImage && 'Uploading property image to IPFS...'}
                {uploadingMetadata && 'Creating and uploading metadata...'}
                {creatingAsset && 'Creating asset on blockchain...'}
              </span>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Asset Name
            </label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g., Downtown Office Building"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
              disabled={uploadingImage || uploadingMetadata || creatingAsset}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Description
            </label>
            <textarea
              value={assetDescription}
              onChange={(e) => setAssetDescription(e.target.value)}
              placeholder="Describe the property, location, features, etc."
              rows={3}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
              disabled={uploadingImage || uploadingMetadata || creatingAsset}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Shares
            </label>
            <input
              type="number"
              value={totalShares}
              onChange={(e) => setTotalShares(e.target.value)}
              placeholder="e.g., 1000"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
              min="1"
              disabled={uploadingImage || uploadingMetadata || creatingAsset}
            />
            <p className="text-xs text-gray-400 mt-1">
              Total number of shares to create
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price per Share (MNT)
            </label>
            <input
              type="number"
              step="0.0001"
              value={pricePerShare}
              onChange={(e) => setPricePerShare(e.target.value)}
              placeholder="e.g., 0.01"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
              min="0.0001"
              disabled={uploadingImage || uploadingMetadata || creatingAsset}
            />
            <p className="text-xs text-gray-500 mt-1">
              Price in MNT per share
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Property Image
            </label>
            <input
              id="property-image"
              type="file"
              accept="image/*"
              onChange={(e) => setPropertyImage(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-500 hover:file:to-pink-500 file:transition-all file:duration-300"
              disabled={uploadingImage || uploadingMetadata || creatingAsset}
            />
            <p className="text-xs text-gray-400 mt-1">
              Upload a property image (JPG, PNG, etc.) that will be stored on IPFS
            </p>
            {propertyImage && (
              <p className="text-sm text-green-600 mt-1">
                Selected: {propertyImage.name}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleCreateAsset}
          disabled={
            creatingAsset ||
            uploadingImage ||
            uploadingMetadata ||
            !assetName.trim() ||
            !assetDescription.trim() ||
            !totalShares.trim() ||
            !pricePerShare.trim() ||
            !propertyImage
          }
          className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creatingAsset ? 'Creating Asset...' :
           uploadingImage ? 'Uploading Image...' :
           uploadingMetadata ? 'Uploading Metadata...' :
           'Create Asset'}
        </button>

        {/* Preview */}
        {assetName && assetDescription && totalShares && pricePerShare && propertyImage && (
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
            <h3 className="font-medium text-blue-300 mb-2">Asset Preview</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-200">
              <div>
                <strong>Name:</strong> {assetName}<br />
                <strong>Description:</strong> {assetDescription}<br />
                <strong>Total Shares:</strong> {totalShares}<br />
                <strong>Price per Share:</strong> {pricePerShare} MNT
              </div>
              <div>
                <strong>Total Value:</strong> {(parseFloat(totalShares) * parseFloat(pricePerShare)).toFixed(4)} MNT<br />
                <strong>Image:</strong> {propertyImage.name}
              </div>
            </div>
          </div>
        )}

        {/* CIDs display */}
        {imageCID && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✓ Image uploaded:</strong> <code className="bg-green-100 px-1 rounded">{imageCID}</code>
            </p>
            <a
              href={`https://gateway.pinata.cloud/ipfs/${imageCID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-700 underline hover:text-green-800"
            >
              View on IPFS
            </a>
          </div>
        )}

        {metadataCID && (
          <div className="mt-2 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800">
              <strong>✓ Metadata uploaded:</strong> <code className="bg-purple-100 px-1 rounded">{metadataCID}</code>
            </p>
            <a
              href={`https://gateway.pinata.cloud/ipfs/${metadataCID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-700 underline hover:text-purple-800"
            >
              View metadata on IPFS
            </a>
          </div>
        )}
      </div>

      {nfts.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-purple-500/20">
          <div className="text-gray-300 text-2xl mb-6">🚫 No NFTs added yet.</div>
          <p className="text-gray-400 mb-8 text-lg">
            Use the form above to check ownership of your NFT tokens.
          </p>
          <Link
            href="/assets"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-bold shadow-2xl shadow-purple-500/25 hover:shadow-purple-400/40 transform hover:scale-105"
          >
            Browse Assets
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <div
              key={nft.tokenId}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-cyan-500/20 overflow-hidden hover:border-cyan-400/40 transition-all duration-300"
            >
              {/* NFT Image */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {nft.metadata?.image ? (
                  <img
                    src={nft.metadata.image.startsWith('ipfs://')
                      ? getIPFSUrl(nft.metadata.image.replace('ipfs://', ''))
                      : nft.metadata.image.startsWith('http')
                      ? nft.metadata.image
                      : getIPFSUrl(nft.metadata.image)
                    }
                    alt={nft.metadata.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', nft.metadata?.image);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                {(!nft.metadata?.image) && (
                  <div className="text-gray-400 text-sm text-center px-2">
                    <div className="text-2xl mb-2">Image</div>
                    No Image Available
                  </div>
                )}
                {/* Hidden fallback */}
                  <div className="hidden text-gray-400 text-sm text-center px-2">
                    <div className="text-2xl mb-2">Image</div>
                    Image Load Failed
                  </div>
              </div>

              {/* NFT Details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-white text-lg">
                    {nft.metadata?.name || `NFT #${nft.tokenId}`}
                  </h3>
                  <button
                    onClick={() => removeToken(nft.tokenId)}
                    className="text-gray-400 hover:text-red-400 text-sm font-bold"
                    title="Remove from portfolio"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Asset ID:</span>
                    <Link
                      href={`/assets/${nft.assetId}`}
                      className="text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      #{nft.assetId}
                    </Link>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Shares Owned:</span>
                    <span className="font-bold text-pink-400">{nft.shares}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Token ID:</span>
                    <span className="font-bold text-purple-400">#{nft.tokenId}</span>
                  </div>

                  {nft.asset && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Asset Status:</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        nft.asset.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {nft.asset.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Attributes */}
                {nft.metadata?.attributes && (
                  <div className="border-t pt-3">
                    <div className="text-xs text-gray-500 mb-2">Attributes</div>
                    <div className="flex flex-wrap gap-1">
                      {nft.metadata.attributes.slice(0, 3).map((attr, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Portfolio Summary */}
        {nfts.length > 0 && (
          <div className="mt-12 bg-gray-900/50 backdrop-blur-sm p-8 rounded-3xl border border-cyan-500/20">
            <h2 className="text-2xl font-bold text-white mb-6">Portfolio Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-800/50 rounded-2xl">
                <div className="text-3xl font-black text-cyan-400 mb-2">{nfts.length}</div>
                <div className="text-sm text-gray-400 font-medium">Total NFTs</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-2xl">
                <div className="text-3xl font-black text-pink-400 mb-2">
                  {nfts.reduce((sum, nft) => sum + nft.shares, 0)}
                </div>
                <div className="text-sm text-gray-400 font-medium">Total Shares</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-2xl">
                <div className="text-3xl font-black text-purple-400 mb-2">
                  {new Set(nfts.map(nft => nft.assetId)).size}
                </div>
                <div className="text-sm text-gray-400 font-medium">Assets Owned</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-2xl">
                <div className="text-3xl font-black text-green-400 mb-2">
                  {nfts.filter(nft => nft.asset?.active).length}
                </div>
                <div className="text-sm text-gray-400 font-medium">Active Assets</div>
              </div>
            </div>
        </div>
      )}
      </div>
    </div>
  );
}
