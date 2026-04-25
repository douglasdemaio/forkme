import { PublicKey } from '@solana/web3.js';

export const ESCROW_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID || 'CNUWqYhXPXszPuB8psqG2VSnwCXf1MWzT4Pztp4y8fgj'
);
export const REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_REGISTRY_PROGRAM_ID || 'EM1FgSzfS3F7cCYJWhUaqqPAK7ijZYpYRx7pzYkuyExz'
);
export const LOYALTY_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_LOYALTY_PROGRAM_ID || 'BnnUntqkUadZ2BsW8j675P9hJQV3aqVcmt4xG4xfeoM8'
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

export const VEHICLE_TYPES = [
  { value: 'bicycle',    label: 'Bicycle',          emoji: '🚲',  eco: true  },
  { value: 'ebike',      label: 'E-Bike',            emoji: '⚡🚲', eco: true  },
  { value: 'escooter',   label: 'E-Scooter',         emoji: '🛴',  eco: true  },
  { value: 'ev',         label: 'Electric Vehicle',  emoji: '⚡🚗', eco: true  },
  { value: 'motorcycle', label: 'Motorcycle',        emoji: '🏍️', eco: false },
  { value: 'car',        label: 'Car',               emoji: '🚗',  eco: false },
] as const;

export type VehicleTypeValue = typeof VEHICLE_TYPES[number]['value'];

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

// Instruction discriminators (Anchor sha256("global:<snake_case_name>")[..8]).
// Names match the on-chain handler exactly:
//   create_order, contribute_to_order, confirm_delivery
export const DISCRIMINATORS = {
  createOrder:     Buffer.from([141,  54,  37, 207, 237, 210, 250, 215]),
  contribute:      Buffer.from([206,   3, 153, 116, 116, 195,  16,  23]),
  confirmDelivery: Buffer.from([ 11, 109, 227,  53, 179, 190,  88, 155]),
};
