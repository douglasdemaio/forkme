import { PublicKey } from '@solana/web3.js';

// ── forkit-site backend ─────────────────────────────────────────────
// The Next.js web app (forkit-site) serves both the web UI and the API
// routes that ForkMe consumes. Point this at your deployment.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Real-time order tracking — forkit-site exposes a Socket.IO endpoint
export const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000';

// ── Solana ──────────────────────────────────────────────────────────
// Custom RPC gateway via Tatum — fall back to public devnet if not configured
export const SOLANA_RPC_URL =
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://forkit-2a5ac542.gateway.tatum.io/';
export const SOLANA_NETWORK =
  process.env.EXPO_PUBLIC_SOLANA_NETWORK || 'devnet';

// ── ForkIt on-chain program IDs ─────────────────────────────────────
export const ESCROW_PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_ESCROW_PROGRAM_ID ||
    'FNZXjjq2oceq15jVsnHT8gYJQUZ9NLCXCpYak2pXsqGB'
);
export const REGISTRY_PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_REGISTRY_PROGRAM_ID ||
    '2riHMdVB6eFgeQjqvnqq2Mrpqea7hrMv5ZNRh7gZgB9S'
);
export const LOYALTY_PROGRAM_ID = new PublicKey(
  process.env.EXPO_PUBLIC_LOYALTY_PROGRAM_ID ||
    '6DaFmi7haz2Ci9sXaHRviz3biwbmTwipvwc9L9cdeugR'
);

// ── Protocol parameters ─────────────────────────────────────────────
export const TREASURY_WALLET = new PublicKey(
  'BiP5PJuUiXPYCFx98RMCGCnRhdUVrkxSke9C6y2ZohQ9'
);
export const FEE_BASIS_POINTS = 2; // 0.02 %
export const MAX_CONTRIBUTORS = 10;
export const FUNDING_TIMEOUT_SECONDS = 900; // 15 min
export const CANCEL_WINDOW_SECONDS = 60;
export const PREP_TIMEOUT_SECONDS = 2700; // 45 min
export const PICKUP_TIMEOUT_SECONDS = 2700; // 45 min
export const DELIVERY_TIMEOUT_SECONDS = 10800; // 3 hours
export const APP_SCHEME = 'forkme';

// ── Stablecoin tokens ───────────────────────────────────────────────
export interface StablecoinToken {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  currencySign: string;
}

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
  const cluster =
    SOLANA_NETWORK === 'mainnet-beta' ? '' : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/tx/${txSignature}${cluster}`;
}

// ── Supported locales ────────────────────────────────────────────────
export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
] as const;

// ── Restaurant page templates ───────────────────────────────────────
export type RestaurantTemplate = 'classic' | 'modern' | 'minimal' | 'vibrant';
export const RESTAURANT_TEMPLATES: {
  id: RestaurantTemplate;
  label: string;
  description: string;
}[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Traditional layout with warm colours',
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean lines, large hero images',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Text-first, fast-loading',
  },
  {
    id: 'vibrant',
    label: 'Vibrant',
    description: 'Bold colours, playful typography',
  },
];
