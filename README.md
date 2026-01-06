# TokenEstate

A decentralized platform for tokenizing real world assets (RWA) on the Mantle Sepolia testnet. Built with Next.js, ethers.js v6, and IPFS for document storage. 
Open [Link](https://tokenestate-dusky.vercel.app) to view the application.

## Features

- **Fractional Ownership**: Invest in high-value assets through tokenized shares
- **MetaMask Integration**: Secure wallet connection with automatic network detection
- **IPFS Document Storage**: Property documents stored decentralized on IPFS
- **NFT Ownership Certificates**: ERC-721 tokens representing asset ownership
- **Real-time Asset Data**: Live blockchain data from Mantle Sepolia
- **Responsive UI**: Modern, mobile-friendly interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Web3**: ethers.js v6, MetaMask
- **Storage**: IPFS via Pinata
- **Blockchain**: Mantle Sepolia Testnet

## Project Structure

```
contract/               # Solidity smart contracts
└── contract.sol       # RWA Tokenization smart contract

src/
├── components/          # Reusable UI components
│   ├── Navigation.tsx   # Main navigation with wallet connect
│   └── WalletConnect.tsx # Wallet connection component
├── config/             # Configuration files
│   ├── contract.ts     # Contract address and ABI
│   ├── network.ts      # Network configuration
│   └── pinata.ts       # Pinata IPFS credentials
├── hooks/              # Custom React hooks
│   ├── useWallet.ts    # Wallet connection & network management
│   └── useRWATokenization.ts # Contract interactions
└── utils/
    └── pinata.ts       # IPFS upload utilities

app/                    # Next.js app router
├── layout.tsx          # Root layout with navigation
├── page.tsx            # Landing page
├── assets/             # Asset listing and details
│   ├── page.tsx        # Asset listing
│   └── [id]/           # Dynamic asset detail pages
│       └── page.tsx
└── profile/            # User profile with NFT ownership checker and asset creation
    └── page.tsx
```

## Smart Contract

The platform integrates with an ERC-721 compliant smart contract that:

- Manages real world asset tokenization
- Handles fractional ownership through NFT minting
- Supports document uploads via IPFS
- Enables secure MNT payments for share purchases

Contract features:
- `addAsset()`: Create new assets for tokenization
- `buyShares()`: Purchase fractional ownership
- `deactivateAsset()`: Disable asset sales
- `getAsset()`: View asset details

## Network Configuration

The application is configured for **Mantle Sepolia Testnet**:

- **Chain ID**: 5003
- **RPC URL**: https://rpc.sepolia.mantle.xyz
- **CONTRACT ADDRESS**: 0x33cBa9fE640055A9BBaCD18F39349a07c877C6d1
- **Block Explorer**: https://explorer.sepolia.mantle.xyz

The app automatically detects and prompts users to switch networks if needed.

## Key Components

### Wallet Integration

- Automatic MetaMask detection
- Network validation for Mantle Sepolia
- Real-time account and chain change handling
- Transaction state management

### Asset Management

- **Asset Creation**: Complete asset tokenization with metadata, images, and pricing
  - Upload property images to IPFS
  - Generate standard NFT metadata JSON
  - Store metadata on IPFS with asset details
  - Create blockchain asset with share distribution
- Real-time asset data from blockchain
- Progress tracking for share sales
- Owner controls for document uploads
- Investor purchase interface
- NFT ownership verification by token ID

### IPFS Integration

- Document upload to Pinata IPFS
- NFT metadata generation and storage
- Decentralized content access
- Gateway URL management

## Usage

1. **Connect Wallet**: Use MetaMask to connect to Mantle Sepolia
2. **Create Assets**: Tokenize real world assets with complete metadata:
   - Add asset name, description, and property image
   - Set total shares and price per share
   - Upload to IPFS automatically
   - Deploy to blockchain
3. **Browse Assets**: View available tokenized assets created by other users
4. **Invest**: Purchase fractional shares using MNT
5. **Upload Documents**: Asset owners can upload property documents to IPFS
6. **View Portfolio**: Enter your NFT token IDs to view ownership certificates and track investments

## Security Features

- Contract reentrancy protection
- Input validation for all transactions
- Secure MNT transfers to asset owners
- IPFS hash verification for documents


## Images

<img width="1450" height="836" alt="Screenshot 2026-01-07 at 1 09 08 AM" src="https://github.com/user-attachments/assets/7012e376-da54-44bb-bf14-f896da7b251b" />

<img width="1364" height="634" alt="Screenshot 2026-01-07 at 1 09 31 AM" src="https://github.com/user-attachments/assets/f5dea0eb-147c-4811-8959-cedb2b26a401" />

<img width="1163" height="835" alt="Screenshot 2026-01-07 at 1 09 43 AM" src="https://github.com/user-attachments/assets/c57308a5-e88a-4be7-82f2-c1d8b2b210c7" />

<img width="755" height="628" alt="Screenshot 2026-01-07 at 1 10 03 AM" src="https://github.com/user-attachments/assets/8fd7335f-d0ca-4d31-8ac1-cc5c22966785" />

## License

MIT License - see LICENSE file for details.
