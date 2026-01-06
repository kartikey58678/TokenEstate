'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '../../../src/hooks/useWallet';
import { useRWATokenization, Asset } from '../../../src/hooks/useRWATokenization';
import { uploadFileToIPFS, createAndUploadNFTMetadata, fetchAssetName } from '../../../src/utils/pinata';
import { CONTRACT_ABI } from '../../../src/config/contract';
import { ethers } from 'ethers';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = parseInt(params.id as string);

  const { address, isConnected, isOnCorrectNetwork } = useWallet();
  const { getAsset, buyShares, canWrite, getAssetMetadataCID } = useRWATokenization();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [assetName, setAssetName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Document upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentIpfsHash, setDocumentIpfsHash] = useState<string>('');

  // Share purchase states
  const [sharesToBuy, setSharesToBuy] = useState<number>(1);
  const [buyingShares, setBuyingShares] = useState(false);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        setError(null);
        const assetData = await getAsset(assetId);
        setAsset(assetData);

        // Fetch asset name from metadata
        try {
          const metadataCID = await getAssetMetadataCID(assetId);
          const name = await fetchAssetName(metadataCID);
          setAssetName(name);
        } catch (nameError) {
          console.warn('Failed to fetch asset name:', nameError);
          setAssetName(`Asset #${assetId}`);
        }
      } catch (err) {
        console.error('Failed to fetch asset:', err);
        setError('Asset not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    if (assetId) {
      fetchAsset();
    }
  }, [assetId, getAsset, getAssetMetadataCID]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadingDocument(true);
      const ipfsHash = await uploadFileToIPFS(selectedFile);
      setDocumentIpfsHash(ipfsHash);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Failed to upload document:', err);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleBuyShares = async () => {
    if (!asset || !canWrite || sharesToBuy <= 0) return;

    const remainingShares = Number(asset.totalShares - asset.soldShares);
    if (sharesToBuy > remainingShares) {
      alert(`Only ${remainingShares} shares available.`);
      return;
    }

    try {
      setBuyingShares(true);

      // Create NFT metadata if document was uploaded
      let nftMetadataIpfsHash = '';
      if (documentIpfsHash) {
        nftMetadataIpfsHash = await createAndUploadNFTMetadata(
          `Asset #${assetId} Ownership`,
          `Ownership certificate for ${sharesToBuy} shares of Asset #${assetId}`,
          assetId,
          sharesToBuy,
          documentIpfsHash
        );
      }

      // Call buyShares and get the minted token ID
      const { tokenId: mintedTokenId } = await buyShares(assetId, sharesToBuy);

      // Show success message with NFT details
      const successMessage = `Successfully purchased ${sharesToBuy} shares!${nftMetadataIpfsHash ? ' NFT metadata uploaded to IPFS.' : ''}${mintedTokenId ? ` NFT Token ID: ${mintedTokenId}` : ''}`;
      alert(successMessage);

      // Refresh asset data
      const updatedAsset = await getAsset(assetId);
      setAsset(updatedAsset);

      // Reset form
      setSharesToBuy(1);
      setDocumentIpfsHash('');

    } catch (err: any) {
      console.error('Failed to buy shares:', err);
      alert(`Failed to buy shares: ${err.message || 'Unknown error'}`);
    } finally {
      setBuyingShares(false);
    }
  };

  const calculateTotalCost = () => {
    if (!asset) return '0';
    return ethers.formatEther(BigInt(sharesToBuy) * asset.pricePerShare);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-xl text-cyan-400 animate-pulse">Loading asset details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center min-h-[400px] flex items-center justify-center">
            <div>
              <div className="text-red-400 bg-red-900/20 p-6 rounded-2xl border border-red-500/20 mb-6">{error || 'Asset not found'}</div>
              <Link
                href="/assets"
                className="text-cyan-400 hover:text-cyan-300 underline text-lg font-semibold"
              >
                ← Back to Assets
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = address?.toLowerCase() === asset.assetOwner.toLowerCase();
  const remainingShares = Number(asset.totalShares - asset.soldShares);
  const canInvest = isConnected && isOnCorrectNetwork && asset.active && remainingShares > 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/assets"
            className="text-cyan-400 hover:text-cyan-300 underline mb-6 inline-block text-lg font-semibold"
          >
            ← Back to Assets
          </Link>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 mb-4">{assetName || `Asset #${assetId}`}</h1>
          <p className="text-xl text-gray-300">
            Asset #{assetId} • Owner: {asset.assetOwner.slice(0, 6)}...{asset.assetOwner.slice(-4)}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
        {/* Asset Information */}
        <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Asset Details</h2>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-lg">Status:</span>
              <span className={`px-4 py-2 text-sm rounded-full font-bold ${
                asset.active
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {asset.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400 text-lg">Total Shares:</span>
              <span className="font-bold text-cyan-400 text-xl">{asset.totalShares.toString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400 text-lg">Sold Shares:</span>
              <span className="font-bold text-green-400 text-xl">{asset.soldShares.toString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400 text-lg">Available Shares:</span>
              <span className="font-bold text-pink-400 text-xl">{remainingShares.toString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400 text-lg">Price per Share:</span>
              <span className="font-bold text-purple-400 text-xl">{ethers.formatEther(asset.pricePerShare)} MNT</span>
            </div>
          </div>
        </div>

        {/* Investment Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-pink-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Invest in Asset</h2>

          {!isConnected && (
            <div className="text-center py-12">
              <p className="text-gray-300 mb-6 text-lg">Connect your wallet to invest in this asset.</p>
            </div>
          )}

          {isConnected && !isOnCorrectNetwork && (
            <div className="text-center py-12">
              <p className="text-orange-400 mb-6 text-lg">Please switch to Mantle Sepolia network to invest.</p>
            </div>
          )}

          {canInvest && (
            <div className="space-y-6">
              {/* Document Upload (for asset owners) */}
              {isOwner && (
                <div className="border-t border-purple-500/20 pt-8">
                  <h3 className="text-xl font-bold text-white mb-4">Upload Property Documents</h3>
                  <div className="space-y-4">
                    <input
                      id="document-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:text-white hover:file:from-purple-500 hover:file:to-pink-500 file:transition-all file:duration-300"
                    />
                    {selectedFile && (
                      <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl">
                        <span className="text-sm text-cyan-400 font-medium">{selectedFile.name}</span>
                        <button
                          onClick={handleDocumentUpload}
                          disabled={uploadingDocument}
                          className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm rounded-xl hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300"
                        >
                          {uploadingDocument ? '⏳ Uploading...' : '📤 Upload to IPFS'}
                        </button>
                      </div>
                    )}
                    {documentIpfsHash && (
                      <div className="text-sm text-green-400 bg-green-900/20 p-4 rounded-xl border border-green-500/20">
                        Document uploaded successfully!
                        <br />
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${documentIpfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-green-300 hover:text-green-200"
                        >
                          View on IPFS
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Share Purchase */}
              <div className="border-t border-pink-500/20 pt-8">
                <h3 className="text-xl font-bold text-white mb-4">Purchase Shares</h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-cyan-400 mb-3">
                      Number of Shares
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={remainingShares}
                      value={sharesToBuy}
                      onChange={(e) => setSharesToBuy(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-lg font-semibold"
                    />
                  </div>

                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-cyan-500/20">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-400">Price per share:</span>
                      <span className="font-bold text-purple-400">{ethers.formatEther(asset.pricePerShare)} MNT</span>
                    </div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-400">Shares:</span>
                      <span className="font-bold text-pink-400">{sharesToBuy}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl border-t border-cyan-500/20 pt-4 mt-4">
                      <span className="text-cyan-400">Total:</span>
                      <span className="text-white">{calculateTotalCost()} MNT</span>
                    </div>
                  </div>

                  <button
                    onClick={handleBuyShares}
                    disabled={buyingShares || sharesToBuy > remainingShares}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white rounded-xl hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
                  >
                    {buyingShares ? 'Processing...' : `Buy ${sharesToBuy} Share${sharesToBuy !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
