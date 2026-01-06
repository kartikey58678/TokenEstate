import { PINATA_API_KEY, PINATA_SECRET_API_KEY, PINATA_JWT, PINATA_GATEWAY } from '../config/pinata';

export interface PinataUploadResult {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    throw new Error('Pinata API credentials not configured');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload file to IPFS: ${error}`);
  }

  const result: PinataUploadResult = await response.json();
  return result.IpfsHash;
}

/**
 * Upload JSON metadata to IPFS via Pinata
 */
export async function uploadJSONToIPFS(jsonData: any): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    throw new Error('Pinata API credentials not configured');
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_API_KEY,
    },
    body: JSON.stringify(jsonData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload JSON to IPFS: ${error}`);
  }

  const result: PinataUploadResult = await response.json();
  return result.IpfsHash;
}

/**
 * Create and upload NFT metadata for RWA tokenization
 */
export async function createAndUploadNFTMetadata(
  name: string,
  description: string,
  assetId: number,
  shares: number,
  documentIpfsHash?: string,
  imageIpfsHash?: string
): Promise<string> {
  const metadata: NFTMetadata = {
    name,
    description,
    image: imageIpfsHash ? `${PINATA_GATEWAY}${imageIpfsHash}` : '',
    attributes: [
      {
        trait_type: 'Asset ID',
        value: assetId,
      },
      {
        trait_type: 'Shares Owned',
        value: shares,
      },
      {
        trait_type: 'Token Type',
        value: 'RWA Ownership NFT',
      },
    ],
  };

  if (documentIpfsHash) {
    metadata.attributes.push({
      trait_type: 'Document Hash',
      value: documentIpfsHash,
    });
  }

  return await uploadJSONToIPFS(metadata);
}

/**
 * Get IPFS gateway URL for a hash
 */
export function getIPFSUrl(ipfsHash: string): string {
  return `${PINATA_GATEWAY}${ipfsHash}`;
}

/**
 * Fetch content from IPFS
 */
export async function fetchFromIPFS<T = any>(ipfsHash: string): Promise<T> {
  const url = getIPFSUrl(ipfsHash);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS: ${ipfsHash}`);
  }

  return await response.json();
}

/**
 * Fetch asset metadata and extract the name
 */
export async function fetchAssetName(metadataCID: string): Promise<string> {
  try {
    if (!metadataCID || metadataCID === '') {
      return 'Unnamed Asset';
    }

    const metadata = await fetchFromIPFS(metadataCID);
    return metadata.name || 'Unnamed Asset';
  } catch (error) {
    console.warn('Failed to fetch asset name:', error);
    return 'Unnamed Asset';
  }
}
