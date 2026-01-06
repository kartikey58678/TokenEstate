'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRWATokenization, Asset } from '../../src/hooks/useRWATokenization';
import { fetchAssetName } from '../../src/utils/pinata';
import { ethers } from 'ethers';

export default function AssetsPage() {
  const { getAllAssets, getAssetMetadataCID, isReady } = useRWATokenization();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetNames, setAssetNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchAssets = async () => {
    if (!isReady) return;

    try {
      setLoading(true);
      setError(null);
      const assetData = await getAllAssets();

      // Fetch asset names for each asset
      const names: Record<number, string> = {};
      for (let i = 0; i < assetData.length; i++) {
        const assetId = i + 1; // Assets are 1-indexed
        try {
          const metadataCID = await getAssetMetadataCID(assetId);
          const name = await fetchAssetName(metadataCID);
          names[assetId] = name;
        } catch (nameError) {
          console.warn(`Failed to fetch name for asset ${assetId}:`, nameError);
          names[assetId] = `Asset #${assetId}`;
        }
      }

      setAssets(assetData);
      setAssetNames(names);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
      setError('Failed to load assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [isReady, getAllAssets, refreshTrigger]);

  // Refresh data when window regains focus (user comes back from asset detail page)
  useEffect(() => {
    const handleFocus = () => {
      if (isReady && !loading) {
        console.log('Window focused, refreshing assets data...');
        fetchAssets();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isReady, loading]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const formatPrice = (price: bigint) => {
    return ethers.formatEther(price);
  };

  const calculateProgress = (sold: bigint, total: bigint) => {
    if (total === BigInt(0)) return 0;
    return Number((sold * BigInt(100)) / total);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-xl text-cyan-400 animate-pulse">Loading assets...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center min-h-[400px] flex items-center justify-center">
            <div className="text-red-400 bg-red-900/20 p-6 rounded-2xl border border-red-500/20">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 mb-4">Available Assets</h1>
            <p className="text-xl text-gray-300">
              Browse and invest in tokenized real world assets on Mantle Sepolia.
            </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-bold shadow-2xl shadow-purple-500/25 hover:shadow-purple-400/40 transform hover:scale-105 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

      {assets.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-purple-500/20">
          <div className="text-gray-300 text-2xl mb-6">No assets available yet.</div>
          <p className="text-gray-400 mb-8 text-lg">
            Check back later for new investment opportunities.
          </p>
          <Link
            href="/profile"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-bold shadow-2xl shadow-purple-500/25 hover:shadow-purple-400/40 transform hover:scale-105"
          >
            Create First Asset
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset, index) => {
            const assetId = index + 1; // Assets are 1-indexed in the contract
            const progress = calculateProgress(asset.soldShares, asset.totalShares);
            const remainingShares = asset.totalShares - asset.soldShares;

            // Debug logging
            console.log(`Asset ${assetId}: soldShares=${asset.soldShares?.toString() || 'undefined'}, totalShares=${asset.totalShares?.toString() || 'undefined'}, progress=${progress}%`);

            return (
              <div
                key={assetId}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden hover:border-purple-400/40 transition-all duration-300 group hover:transform hover:scale-105"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                        {assetNames[assetId] || `Asset #${assetId}`}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Asset #{assetId} • Owner: {asset.assetOwner.slice(0, 6)}...{asset.assetOwner.slice(-4)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-bold ${
                        asset.active
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {asset.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Shares:</span>
                      <span className="font-bold text-cyan-400">{asset.totalShares.toString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Sold Shares:</span>
                      <span className="font-bold text-green-400">{asset.soldShares.toString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Price per Share:</span>
                      <span className="font-bold text-purple-400">{formatPrice(asset.pricePerShare)} MNT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Available:</span>
                      <span className="font-bold text-pink-400">{remainingShares.toString()} shares</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-cyan-400 font-semibold">Progress</span>
                      <span className="text-white font-bold">{progress}% ({asset.soldShares?.toString() || '0'} / {asset.totalShares?.toString() || '0'} shares)</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress > 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-500'
                        } shadow-lg`}
                        style={{
                          width: progress > 0 ? `${Math.max(progress, 3)}%` : '3px'
                        }}
                      ></div>
                    </div>
                  </div>

                  <Link
                    href={`/assets/${assetId}`}
                    className={`w-full block text-center py-3 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                      asset.active && remainingShares > BigInt(0)
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-2xl shadow-purple-500/25 hover:shadow-purple-400/40'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      if (!asset.active || remainingShares === BigInt(0)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {asset.active && remainingShares > BigInt(0)
                      ? 'View Details & Invest'
                      : asset.active
                      ? 'Sold Out'
                      : 'Inactive'
                    }
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
