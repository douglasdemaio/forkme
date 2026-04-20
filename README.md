# ForkMe

Decentralized food delivery companion app for the [ForkIt](https://github.com/douglasdemaio/forkit-site) ecosystem, built on Solana.

## What it does

ForkMe is a **Next.js 14 web app / PWA** for two user roles:

| Role | Features |
|------|----------|
| **Customer** | Browse restaurants from forkit-site, build a cart, pay via USDC/EURC Solana escrow, split the bill by sharing a contribution link, track order status live |
| **Driver** | See orders ready for pickup, accept deliveries, scan QR codes to verify pickup (Code A) and confirm delivery (Code B), earn delivery fees |

Restaurant management (menu creation, order management) lives in [forkit-site](https://github.com/douglasdemaio/forkit-site).

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — dark navy + brand orange design
- **@solana/wallet-adapter** — Phantom & Solflare browser extensions
- **Solana smart contracts** — direct on-chain escrow instructions (no Anchor dependency at runtime)
- **i18next** — 10 languages (EN, DE, ES, FR, JA, ZH, PT, KO, AR, TR)
- **PWA-ready** — `manifest.json` + mobile-optimised bottom nav

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/douglasdemaio/forkme
cd forkme
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — point NEXT_PUBLIC_API_URL at your forkit-site instance

# 3. Run (dev server on port 3001 so it doesn't clash with forkit-site on 3000)
npm run dev
# → http://localhost:3001
```

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | forkit-site backend URL | `http://localhost:3000` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Network (`devnet` / `mainnet-beta`) | `devnet` |
| `NEXT_PUBLIC_ESCROW_PROGRAM_ID` | Escrow program address | see `.env.example` |
| `NEXT_PUBLIC_REGISTRY_PROGRAM_ID` | Registry program address | see `.env.example` |
| `NEXT_PUBLIC_LOYALTY_PROGRAM_ID` | Loyalty program address | see `.env.example` |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Browse restaurants |
| `/restaurants/[slug]` | Restaurant menu |
| `/cart` | Cart + Solana checkout |
| `/order/[id]` | Order tracking, QR codes, split-bill link |
| `/order/[id]/contribute` | Contribute to a friend's order |
| `/orders` | Order history |
| `/driver` | Available deliveries (driver mode) |
| `/driver/delivery/[id]` | Active delivery with QR scanner |
| `/profile` | Wallet, role, language settings |

## Architecture

```
forkme (Next.js, port 3001)
    │  ← REST API calls →
forkit-site (Next.js, port 3000) — restaurant DB, order DB, JWT auth
    │  ← Solana transactions →
Solana Devnet — Escrow / Registry / Loyalty programs
```

ForkMe has **no database** — it is a pure frontend that talks to forkit-site's API and signs Solana transactions via the user's browser wallet.

## CORS

For local development, add `http://localhost:3001` to the CORS allowed origins in forkit-site's `next.config.js`:

```js
async headers() {
  return [{
    source: '/api/:path*',
    headers: [{ key: 'Access-Control-Allow-Origin', value: 'http://localhost:3001' }],
  }];
}
```

## Deployment

Deploy to Vercel. Set env vars in the Vercel dashboard. The site runs standalone — no database or server-side secrets required.
