import { PublicKey } from '@solana/web3.js';

export const ESCROW_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID || 'FNZXjjq2oceq15jVsnHT8gYJQUZ9NLCXCpYak2pXsqGB'
);
export const REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_REGISTRY_PROGRAM_ID || '2riHMdVB6eFgeQjqvnqq2Mrpqea7hrMv5ZNRh7gZgB9S'
);
export const LOYALTY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_LOYALTY_PROGRAM_ID || '6DaFmi7haz2Ci9sXaHRviz3biwbmTwipvwc9L9cdeugR'
);

export const TREASURY_WALLET = new PublicKey('BiP5PJuUiXPYCFx98RMCGCnRhdUVrkxSke9C6y2ZohQ9');

// Token mints (devnet)
export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
export const EURC_MINT = new PublicKey('CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM');

export const TOKEN_DECIMALS = 6;
export const MAX_CONTRIBUTORS = 10;
export const PROTOCOL_FEE_BPS = 2;

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function resolveImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

export function getMintForCurrency(currency: string): PublicKey {
  switch (currency?.toUpperCase()) {
    case 'EURC': return EURC_MINT;
    default:      return USDC_MINT;
  }
}

export function toTokenAmount(amount: number): number {
  return Math.round(amount * 10 ** TOKEN_DECIMALS);
}

export function fromTokenAmount(lamports: number): number {
  return lamports / 10 ** TOKEN_DECIMALS;
}

// Instruction discriminators (Anchor sha256 8-byte prefix)
export const DISCRIMINATORS = {
  createOrder:     Buffer.from([141,  54,  37, 207, 237, 210, 250, 215]),
  contribute:      Buffer.from([ 82,  48, 204, 145, 137,  43, 194, 101]),
  confirmDelivery: Buffer.from([104,  87, 191,  49, 195, 225,  56, 139]),
};
