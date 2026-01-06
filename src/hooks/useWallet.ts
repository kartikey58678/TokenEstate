'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { MANTLE_SEPOLIA_NETWORK, isMantleSepolia } from '../config/network';

// Extend Window interface to include ethereum property
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(prev => ({
        ...prev,
        error: 'MetaMask not detected. Please install MetaMask.',
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      if (!isMantleSepolia(chainId)) {
        await switchToMantleSepolia();
        // Re-fetch network info after switching
        const newNetwork = await provider.getNetwork();
        const newChainId = Number(newNetwork.chainId);

        setState(prev => ({
          ...prev,
          address: accounts[0],
          chainId: newChainId,
          isConnected: true,
          isConnecting: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          address: accounts[0],
          chainId,
          isConnected: true,
          isConnecting: false,
        }));
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet',
        isConnecting: false,
      }));
    }
  }, []);

  const switchToMantleSepolia = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MANTLE_SEPOLIA_NETWORK.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [MANTLE_SEPOLIA_NETWORK],
          });
        } catch (addError: any) {
          throw new Error('Failed to add Mantle Sepolia network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch to Mantle Sepolia network');
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  const getSigner = useCallback(async (): Promise<ethers.Signer | null> => {
    if (!window.ethereum || !state.isConnected) return null;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return await provider.getSigner();
    } catch (error) {
      console.error('Failed to get signer:', error);
      return null;
    }
  }, [state.isConnected]);

  const getProvider = useCallback(async (): Promise<ethers.Provider | null> => {
    if (!window.ethereum) return null;

    try {
      return new ethers.BrowserProvider(window.ethereum);
    } catch (error) {
      console.error('Failed to get provider:', error);
      return null;
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
        }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      const numericChainId = parseInt(chainId, 16);
      setState(prev => ({
        ...prev,
        chainId: numericChainId,
        error: isMantleSepolia(numericChainId) ? null : 'Please connect to Mantle Sepolia network',
      }));
    };

    const handleDisconnect = () => {
      disconnect();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [disconnect]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);

          setState(prev => ({
            ...prev,
            address: accounts[0],
            chainId,
            isConnected: true,
            error: isMantleSepolia(chainId) ? null : 'Please connect to Mantle Sepolia network',
          }));
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      }
    };

    checkConnection();
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    getSigner,
    getProvider,
    clearError,
    isOnCorrectNetwork: state.chainId ? isMantleSepolia(state.chainId) : false,
  };
}
