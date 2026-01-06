// Network configuration for Mantle Sepolia
export const MANTLE_SEPOLIA_CHAIN_ID = 5003;
export const MANTLE_SEPOLIA_RPC_URL = 'https://rpc.sepolia.mantle.xyz';
export const MANTLE_SEPOLIA_BLOCK_EXPLORER = 'https://explorer.sepolia.mantle.xyz';

export const MANTLE_SEPOLIA_NETWORK = {
  chainId: `0x${MANTLE_SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    name: 'BIT',
    symbol: 'BIT',
    decimals: 18,
  },
  rpcUrls: [MANTLE_SEPOLIA_RPC_URL],
  blockExplorerUrls: [MANTLE_SEPOLIA_BLOCK_EXPLORER],
};

export const isMantleSepolia = (chainId: number) => chainId === MANTLE_SEPOLIA_CHAIN_ID;
