'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers, Contract, Provider, Signer } from 'ethers';
import { useWallet } from './useWallet';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';
import { MANTLE_SEPOLIA_RPC_URL } from '../config/network';

export interface Asset {
  assetOwner: string;
  totalShares: bigint;
  pricePerShare: bigint;
  soldShares: bigint;
  active: boolean;
}

export interface NFTMetadata {
  assetId: number;
  shares: number;
  ipfsHash?: string;
}

export function useRWATokenization() {
  const { getSigner, getProvider, isConnected, isOnCorrectNetwork } = useWallet();
  const [contract, setContract] = useState<Contract | null>(null);
  const [readOnlyContract, setReadOnlyContract] = useState<Contract | null>(null);

  // Initialize read-only contract (only once)
  useEffect(() => {
    const initReadOnlyContract = async () => {
      if (readOnlyContract) return; // Already initialized

      try {
        console.log('Initializing read-only contract...');

        const publicProvider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA_RPC_URL);
        const readOnly = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, publicProvider);

        // Test if contract is deployed by calling a simple view function
        try {
          await readOnly.assetCount();
          console.log('✅ Contract is deployed and accessible');
        } catch (testError) {
          console.error('❌ Contract test failed:', testError);
          throw new Error('Contract not found at specified address');
        }

        setReadOnlyContract(readOnly);
        console.log('✅ Read-only contract initialized successfully');
      } catch (error) {
        console.error('Failed to initialize read-only contract:', error);
      }
    };

    initReadOnlyContract();
  }, []); // Empty dependency array - only run once

  // Initialize writable contract when wallet state changes
  useEffect(() => {
    const initWritableContract = async () => {
      try {
        if (isConnected && isOnCorrectNetwork) {
          const signer = await getSigner();
          if (signer && !contract) { // Only initialize if not already initialized
            const writable = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            setContract(writable);
            console.log('✅ Writable contract initialized');
          }
        } else {
          // Clear writable contract if wallet disconnects or wrong network
          if (contract) {
            setContract(null);
            console.log('ℹ️ Writable contract cleared (wallet disconnected or wrong network)');
          }
        }
      } catch (error) {
        console.error('Failed to initialize writable contract:', error);
        setContract(null);
      }
    };

    initWritableContract();
  }, [isConnected, isOnCorrectNetwork, getSigner, contract]);

  // Use the appropriate contract (writable if available, otherwise read-only)
  const activeContract = useMemo(() => contract || readOnlyContract, [contract, readOnlyContract]);

  // Contract read functions
  const getAssetCount = useCallback(async (): Promise<number> => {
    if (!activeContract) throw new Error('Contract not initialized');
    const count = await activeContract.assetCount();
    return Number(count);
  }, [activeContract]);

  const getAsset = useCallback(async (assetId: number): Promise<Asset> => {
    if (!activeContract) throw new Error('Contract not initialized');
    const asset = await activeContract.getAsset(assetId);
    return {
      assetOwner: asset.assetOwner,
      totalShares: asset.totalShares,
      pricePerShare: asset.pricePerShare,
      soldShares: asset.soldShares,
      active: asset.active,
    };
  }, [activeContract]);

  const getAllAssets = useCallback(async (): Promise<Asset[]> => {
    if (!activeContract) throw new Error('Contract not initialized');

    const count = await getAssetCount();
    const assets: Asset[] = [];

    for (let i = 1; i <= count; i++) {
      try {
        const asset = await getAsset(i);
        assets.push(asset);
      } catch (error) {
        console.error(`Failed to fetch asset ${i}:`, error);
      }
    }

    return assets;
  }, [activeContract, getAssetCount, getAsset]);

  const getNftToAsset = useCallback(async (tokenId: number): Promise<number> => {
    if (!activeContract) throw new Error('Contract not initialized');
    const assetId = await activeContract.nftToAsset(tokenId);
    return Number(assetId);
  }, [activeContract]);

  const getNftToShares = useCallback(async (tokenId: number): Promise<number> => {
    if (!activeContract) throw new Error('Contract not initialized');
    const shares = await activeContract.nftToShares(tokenId);
    return Number(shares);
  }, [activeContract]);

  const getLastNftId = useCallback(async (): Promise<number> => {
    if (!activeContract) throw new Error('Contract not initialized');
    const nftId = await activeContract.nftId();
    return Number(nftId);
  }, [activeContract]);

  const getTokenURI = useCallback(async (tokenId: number): Promise<string> => {
    if (!activeContract) throw new Error('Contract not initialized');
    const tokenURI = await activeContract.tokenURI(tokenId);
    return tokenURI;
  }, [activeContract]);

  const getTokenOwner = useCallback(async (tokenId: number): Promise<string> => {
    if (!activeContract) throw new Error('Contract not initialized');
    const owner = await activeContract.ownerOf(tokenId);
    return owner;
  }, [activeContract]);

  const getAssetMetadataCID = useCallback(async (assetId: number): Promise<string> => {
    if (!activeContract) throw new Error('Contract not initialized');
    const cid = await activeContract.assetMetadataCID(assetId);
    return cid;
  }, [activeContract]);

  // Contract write functions (require signer)
  const addAsset = useCallback(async (totalShares: number, pricePerShare: bigint, metadataCID: string): Promise<void> => {
    if (!contract) throw new Error('Wallet not connected or not on correct network');

    const tx = await contract.addAsset(totalShares, pricePerShare, metadataCID);
    await tx.wait();
  }, [contract]);

  const buyShares = useCallback(async (assetId: number, shares: number): Promise<{ tokenId: number }> => {
    if (!contract) throw new Error('Wallet not connected or not on correct network');

    const asset = await getAsset(assetId);
    const cost = BigInt(shares) * asset.pricePerShare;

    const tx = await contract.buyShares(assetId, shares, { value: cost });
    const receipt = await tx.wait();

    // Parse event to get tokenId
    const iface = new ethers.Interface(CONTRACT_ABI);
    let mintedTokenId: number | undefined;
    for (const log of receipt?.logs || []) {
      try {
        const parsedLog = iface.parseLog(log);
        if (parsedLog?.name === 'OwnershipNFTMinted') {
          mintedTokenId = Number(parsedLog.args.tokenId);
          break;
        }
      } catch (e) {
        // Ignore logs that are not from our contract or not the event we're looking for
      }
    }

    if (mintedTokenId === undefined) {
      throw new Error('Could not find OwnershipNFTMinted event in transaction receipt.');
    }

    return { tokenId: mintedTokenId };
  }, [contract, getAsset]);

  const deactivateAsset = useCallback(async (assetId: number): Promise<void> => {
    if (!contract) throw new Error('Wallet not connected or not on correct network');

    const tx = await contract.deactivateAsset(assetId);
    await tx.wait();
  }, [contract]);

  // NFT functions
  const getOwnedNFTs = useCallback(async (address: string): Promise<number[]> => {
    if (!activeContract) throw new Error('Contract not initialized');

    // This is a simplified version. In a real implementation, you'd need to
    // query events or maintain an index of owned tokens
    // For now, we'll return an empty array and handle this in the UI
    return [];
  }, [activeContract]);

  return {
    // State
    isReady: !!activeContract,
    canWrite: !!contract,

    // Read functions
    getAssetCount,
    getAsset,
    getAllAssets,
    getNftToAsset,
    getNftToShares,
    getLastNftId,
    getTokenURI,
    getTokenOwner,
    getAssetMetadataCID,
    getOwnedNFTs,

    // Write functions
    addAsset,
    buyShares,
    deactivateAsset,
  };
}
