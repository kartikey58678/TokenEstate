'use client';

import { useWallet } from '../hooks/useWallet';

export function WalletConnect() {
  const {
    address,
    chainId,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    clearError,
    isOnCorrectNetwork,
  } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && isOnCorrectNetwork) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-base text-gray-300 font-medium">
          {formatAddress(address!)}
        </div>
        <button
          onClick={disconnect}
          className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <div className="text-red-400 text-base max-w-xs text-right">
          {error}
          <button
            onClick={clearError}
            className="ml-2 text-gray-400 hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}

      {!isConnected && (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-purple-500/25"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}

      {isConnected && !isOnCorrectNetwork && (
        <div className="text-base text-orange-400">
          Please switch to Mantle Sepolia
        </div>
      )}
    </div>
  );
}
