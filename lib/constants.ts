import { PublicKey } from '@solana/web3.js';

export const SOLANA_RPC_URL =
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const SOLANA_NETWORK = process.env.EXPO_PUBLIC_SOLANA_NETWORK || 'devnet';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3001';

export const ESCROW_PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_ESCROW_PROGRAM_ID || 'FNZXjjq2oceq15jVsnHT8gYJQUZ9NLCXCpYak2pXsqGB'
);
export const REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_REGISTRY_PROGRAM_ID || '2riHMdVB6eFgeQjqvnqq2Mrpqea7hrMv5ZNRh7gZgB9S'
);
export const LOYALTY_PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_LOYALTY_PROGRAM_ID || '6DaFmi7haz2Ci9sXaHRviz3biwbmTwipvwc9L9cdeugR'
);

// Protocol fee treasury — receives 0.02% of every settled order
export const TREASURY_WALLET = new PublicKey('BiP5PJuUiXPYCFx98RMCGCnRhdUVrkxSke9C6y2ZohQ9');
export const FEE_BASIS_POINTS = 2; // 0.02% protocol fee
export const DEPOSIT_BASIS_POINTS = 200; // 2% refundable deposit
export const MAX_CONTRIBUTORS = 10;
export const FUNDING_TIMEOUT_SECONDS = 900; // 15 minutes
export const APP_SCHEME = 'forkme';

export interface StablecoinToken {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  currencySign: string;
}

// Supported SPL stablecoin tokens (devnet mints)
export const SUPPORTED_TOKENS: StablecoinToken[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    decimals: 6,
    currencySign: '$',
  },
  {
    symbol: 'EURC',
    name: 'Euro Coin',
    mint: 'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM',
    decimals: 6,
    currencySign: '€',
  },
];

export function getTokenByMint(mint: string): StablecoinToken | undefined {
  return SUPPORTED_TOKENS.find((t) => t.mint === mint);
}

export function explorerTxUrl(txSignature: string): string {
  const cluster = SOLANA_NETWORK === 'mainnet-beta' ? '' : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/tx/${txSignature}${cluster}`;
}
