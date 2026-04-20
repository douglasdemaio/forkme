# ForkMe — Mobile App for the ForkIt Ecosystem

ForkMe is the React Native (Expo) mobile companion for **ForkIt**, a decentralized food delivery platform built on Solana. It connects to [forkit-site](https://github.com/user/forkit-site) (the Next.js web platform) for data and to Solana directly for payments.

## Architecture

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   ForkMe     │────▶│   forkit-site        │     │  forkit         │
│  (this repo) │     │  Next.js + API       │     │  Solana smart   │
│  React Native│◀────│  routes              │     │  contracts      │
│  mobile app  │     │  /api/auth/*         │     │  (escrow,       │
│              │     │  /api/restaurants/*   │     │   registry,     │
│              │─────│  /api/orders/*        │     │   loyalty)      │
│              │ WS  │  /api/upload          │     └────────┬────────┘
│              │     └──────────────────────┘              │
│              │──────────────── Solana RPC ───────────────┘
└──────────────┘
```

- **forkit** — Solana smart contracts only (escrow, registry, loyalty programs)
- **forkit-site** — Next.js web app with API routes (restaurant builder, ordering, backend)
- **forkme** (this repo) — React Native mobile app

## Three Roles

### 🍽 Restaurant Owners
- Connect wallet, create and manage your restaurant
- Upload food images, set names, prices, categories
- Choose a page template (Classic Bistro, Modern Minimal, Street Food, Fine Dining, Custom)
- View and manage incoming orders
- Accept orders and mark them as ready for pickup

### 🛒 Customers
- Browse nearby restaurants and menus
- Add items to cart and checkout
- Pay via ForkIt escrow on Solana (USDC or EURC)
- Share contribution links for split payment with friends (contribute even after funding to reimburse the original payer)
- Schedule preferred delivery and pickup times, or order for ASAP
- Track delivery in real time
- Confirm delivery with Code B

### 🚴 Drivers
- View available orders — only **funded** orders (escrow funded on-chain) are shown, not merely created ones (with scheduled pickup/delivery times when set)
- Accept deliveries
- Verify pickup with Code A from the restaurant
- Confirm delivery with Code B from the customer
- Get paid automatically when the escrow settles

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A Solana wallet (Phantom, Solflare, or Saga/Seeker built-in)
- A running [forkit-site](https://github.com/user/forkit-site) instance
- `expo-location` is included in dependencies — no manual install needed (required for GPS-based restaurant discovery)

### Setup

```bash
# Clone
git clone https://github.com/user/forkme.git
cd forkme

# Install
npm install

# Configure environment
cp .env.example .env
# Edit .env with your forkit-site URL and Solana RPC

# Start
npm start
# or
npx expo start
```

### Running on Devices

```bash
npm run android   # Android/Seeker
npm run ios       # iOS
npm run web       # Web (browser)
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | forkit-site backend URL | `http://localhost:3000` |
| `EXPO_PUBLIC_WS_URL` | forkit-site WebSocket URL | `ws://localhost:3000` |
| `EXPO_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `EXPO_PUBLIC_SOLANA_NETWORK` | Solana cluster | `devnet` |
| `EXPO_PUBLIC_ESCROW_PROGRAM_ID` | ForkIt escrow program | `FNZXjjq2oceq15jVsnHT8gYJQUZ9NLCXCpYak2pXsqGB` |
| `EXPO_PUBLIC_REGISTRY_PROGRAM_ID` | ForkIt registry program | `2riHMdVB6eFgeQjqvnqq2Mrpqea7hrMv5ZNRh7gZgB9S` |
| `EXPO_PUBLIC_LOYALTY_PROGRAM_ID` | ForkIt loyalty program | `6DaFmi7haz2Ci9sXaHRviz3biwbmTwipvwc9L9cdeugR` |
| `EXPO_PUBLIC_SCHEME` | Deep link scheme | `forkme` |

## API Routes (served by forkit-site)

ForkMe does **not** have its own backend. All API calls go to the forkit-site Next.js app:

- `POST /api/auth/nonce` — Get sign-in nonce
- `POST /api/auth/verify` — Verify signed nonce, get JWT
- `GET /api/restaurants` — List/search restaurants
- `GET /api/restaurants/[id]` — Restaurant details
- `GET /api/restaurants/[id]/menu` — Menu items
- `POST /api/restaurants/[id]/menu` — Add menu item (owner)
- `PATCH /api/restaurants/[id]/menu/[itemId]` — Update menu item
- `POST /api/orders` — Create order
- `GET /api/orders` — List user's orders
- `GET /api/orders/[id]` — Order details
- `POST /api/orders/[id]/contribute` — Record contribution
- `POST /api/orders/[id]/status` — Advance order status (Preparing, ReadyForPickup, PickedUp…)
- `POST /api/orders/[id]/verify-pickup` — Driver verifies Code A (ReadyForPickup → PickedUp)
- `POST /api/orders/[id]/verify-delivery` — Customer confirms Code B (PickedUp → Settled)
- `POST /api/orders/[id]/contribute` — Record on-chain contribution
- `GET /api/orders/[id]/funding` — Funding progress
- `GET /api/orders/[id]/receipt` — Settlement receipt
- `POST /api/orders/[id]/share` — Generate shareable contribution link
- `GET /api/orders/share/[shareLink]` — Resolve share link to order
- `POST /api/upload` — Upload images (menu items, logos, banners)

## On-Chain Programs

| Program | ID | Purpose |
|---|---|---|
| Escrow | `FNZXjjq2oceq15jVsnHT8gYJQUZ9NLCXCpYak2pXsqGB` | Holds order funds, handles contributions & settlement |
| Registry | `2riHMdVB6eFgeQjqvnqq2Mrpqea7hrMv5ZNRh7gZgB9S` | On-chain restaurant/driver registry |
| Loyalty | `6DaFmi7haz2Ci9sXaHRviz3biwbmTwipvwc9L9cdeugR` | Reward points and reputation |

### Supported Tokens (Devnet)

| Token | Mint Address |
|---|---|
| USDC | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| EURC | `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM` |

Treasury wallet: `BiP5PJuUiXPYCFx98RMCGCnRhdUVrkxSke9C6y2ZohQ9`

## Related Repos

- **[forkit](https://github.com/user/forkit)** — Solana smart contracts (Anchor programs for escrow, registry, loyalty)
- **[forkit-site](https://github.com/user/forkit-site)** — Next.js web platform with API routes (the backend this app connects to)

## Internationalization (i18n)

ForkMe supports 10 languages out of the box, auto-detecting the device language on first launch:

| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English | English |
| `de` | German | Deutsch |
| `es` | Spanish | Español |
| `fr` | French | Français |
| `ja` | Japanese | 日本語 |
| `zh` | Chinese | 中文 |
| `pt` | Portuguese | Português |
| `ko` | Korean | 한국어 |
| `ar` | Arabic | العربية |
| `tr` | Turkish | Türkçe |

Users can change language from **Profile → Language**. The preference is persisted with AsyncStorage.

Translation files live in `i18n/locales/*.json`. To add a new language:
1. Create a new JSON file in `i18n/locales/` (copy `en.json` as a starting point)
2. Add the import and resource entry in `i18n/index.ts`
3. Add the locale metadata to `supportedLocales` in `i18n/index.ts` and `SUPPORTED_LOCALES` in `lib/constants.ts`

Powered by [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) + [expo-localization](https://docs.expo.dev/versions/latest/sdk/localization/).

## Tech Stack

- [Expo](https://expo.dev/) / React Native
- [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- [Zustand](https://github.com/pmndrs/zustand) (state management)
- [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) (internationalization)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) + [SPL Token](https://spl.solana.com/)
- [Solana Mobile Wallet Adapter](https://github.com/solana-mobile/mobile-wallet-adapter)
- [Socket.IO](https://socket.io/) (real-time order tracking)
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/) (GPS — foreground location with Berlin fallback)

## Order Status Values

Order statuses mirror the on-chain `OrderStatus` enum exactly:

| Status | Description |
|--------|-------------|
| `Created` | Order placed, awaiting full funding |
| `Funded` | Escrow fully funded, ready for restaurant |
| `Preparing` | Restaurant accepted, preparing food |
| `ReadyForPickup` | Food ready, waiting for driver |
| `PickedUp` | Driver confirmed pickup (Code A verified) |
| `Delivered` | Delivery confirmed (Code B verified) |
| `Settled` | Funds distributed to restaurant, driver, and treasury |
| `Disputed` | Customer escalated after delivery timeout |
| `Cancelled` | Customer cancelled within 60-second window |
| `Refunded` | Timeout or dispute resolved as refund |

## Known Limitations

- **Live map not yet rendered:** `react-native-maps` is installed and the Track tab displays delivery coordinates, but map rendering is not yet wired — coordinates are shown as text for now.
- **Loyalty tier discounts are Phase 2:** The Bronze→Platinum tier discount system is aspirational. The smart contract stub exists in the loyalty program, but tier logic and the $FORK token are not yet implemented.

## License

MIT
