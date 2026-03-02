import { PublicKey } from '@solana/web3.js';

export const SOLANA_RPC_URL =
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const SOLANA_NETWORK = process.env.EXPO_PUBLIC_SOLANA_NETWORK || 'devnet';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3001';

export const ESCROW_PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_ESCROW_PROGRAM_ID || 'ForkEscrow1111111111111111111111111111111'
);
export const REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_REGISTRY_PROGRAM_ID || 'ForkReg111111111111111111111111111111111'
);
export const LOYALTY_PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_LOYALTY_PROGRAM_ID || 'ForkLoy111111111111111111111111111111111'
);

export const DEPOSIT_MULTIPLIER = 2;
export const MAX_CONTRIBUTORS = 10;
export const FUNDING_TIMEOUT_SECONDS = 900; // 15 minutes
export const APP_SCHEME = 'forkme';
