# 📱 ForkMe

**Cross-platform mobile companion app for [ForkIt](https://github.com/douglasdemaio/forkit) — decentralized food delivery on Solana.**

Built with React Native (Expo) for **iOS**, **Android**, and **Solana Seeker**.

## What It Does

ForkMe is the mobile interface for the ForkIt protocol. Three roles, one app:

- **Customers** — browse restaurants, place orders, split payments with friends, track delivery
- **Drivers** — find available deliveries, verify pickup/delivery with QR codes
- **Restaurants** — manage incoming orders, mark food ready

The killer feature: **anyone can contribute funds to any order** directly through the app. Share a link, friends chip in, the smart contract tracks everything.

## 💸 Split Payments — How It Works

The ForkIt smart contract holds all funds in escrow. The app just provides the interface — it never touches the money.

### The Flow

1. **You place an order** — the app creates an on-chain escrow with the order details
2. **You contribute** — send some or all of the required USDC to the escrow
3. **Share with friends** — tap "Share" to send a contribution link
4. **Friends open the link** — ForkMe deep link takes them to the contribution screen
5. **They chip in** — their tokens go directly to the same on-chain escrow
6. **Order funded** — when the escrow target is met, the restaurant sees the order

### Example: Pizza Night 🍕

```
Order: 2 pizzas
├── Food total:      18.00 USDC
├── Delivery:         2.00 USDC
├── Order total:     20.00 USDC
├── Deposit (2%):     0.40 USDC
└── Escrow target:   20.40 USDC

You send:     14.28 USDC (70%)  ──┐
Friend sends:  6.12 USDC (30%)  ──┼──→ Escrow: 20.40/20.40 USDC ✅
                                   │
After delivery:                    │
├── Restaurant gets: ~18.00 USDC   │
├── Driver gets:      ~2.00 USDC   │
├── You get back:      0.28 USDC  ←┘ (70% of 0.40 deposit)
└── Friend gets back:  0.12 USDC  ←  (30% of 0.40 deposit)
```

Each contributor's deposit is returned **proportionally** to their share. The deposit is a small 2% security deposit returned in full upon delivery confirmation. The order creator is the only one who receives delivery verification codes.

### Key Properties

- **Funds go to the contract, not the app** — trustless by design
- **Anyone can contribute** — friends, family, strangers
- **Proportional refunds** — cancel or timeout? Everyone gets their share back
- **Max 10 contributors** per order (on-chain account size limit)
- **15-minute funding window** — if not fully funded, auto-refundable

## Architecture

```
forkme/
├── app/                          # Expo Router (file-based navigation)
│   ├── _layout.tsx               # Root layout + navigation config
│   ├── connect.tsx               # Wallet connection modal
│   ├── (tabs)/                   # Bottom tab navigation
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── home.tsx              # Role-based home (browse/drive/dashboard)
│   │   ├── orders.tsx            # Order history with funding progress
│   │   ├── track.tsx             # Live map tracking
│   │   └── profile.tsx           # Wallet, role selector, reputation
│   ├── order/
│   │   ├── [id].tsx              # Order detail + codes + share
│   │   └── contribute.tsx        # Chip in / split payment screen
│   ├── restaurant/
│   │   ├── menu.tsx              # Browse & add to cart
│   │   └── incoming.tsx          # Restaurant order management
│   └── driver/
│       └── available.tsx         # Available deliveries list
├── components/
│   ├── funding-bar.tsx           # Animated funding progress bar
│   ├── delivery-code.tsx         # QR code + text display for codes
│   └── trust-badge.tsx           # On-chain reputation badge
├── hooks/
│   ├── useWallet.ts              # Solana Mobile Wallet Adapter + Phantom
│   ├── useContribute.ts          # Build & sign contribute_to_order tx
│   └── useOrderTracking.ts       # Socket.IO real-time updates
├── store/
│   └── app-store.ts              # Zustand global state
├── lib/
│   ├── api.ts                    # REST client for ForkIt backend
│   ├── constants.ts              # RPC URLs, program IDs, config
│   └── types.ts                  # TypeScript types
├── assets/                       # App icons, splash screen
├── app.json                      # Expo config
├── package.json
├── tailwind.config.js            # NativeWind theme
└── tsconfig.json
```

## How It Connects to ForkIt

```
┌─────────────┐     REST/WS      ┌─────────────────┐     RPC      ┌──────────────┐
│   ForkMe    │ ←──────────────→ │  ForkIt Backend  │ ←──────────→ │   Solana      │
│   Mobile    │                  │  (Express API)   │              │   Devnet      │
│   App       │ ──── sign tx ──→ │                  │              │              │
└─────────────┘    via wallet    └─────────────────┘              └──────────────┘
       │                                                                 ↑
       └──────────── Solana Mobile Wallet Adapter ──────────────────────┘
                     (direct on-chain transactions)
```

- **Wallet transactions** (create order, contribute, confirm delivery) go directly to Solana via the mobile wallet adapter
- **Data queries** (restaurants, menus, order history) go through the ForkIt backend REST API
- **Real-time updates** (order status, funding progress, driver location) via Socket.IO WebSocket

## Prerequisites

- **Node.js** ≥ 18
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS**: Xcode 15+ (for simulator) or Expo Go on device
- **Android**: Android Studio (for emulator) or Expo Go on device
- **Solana Seeker**: Expo Go or custom dev build
- **ForkIt backend** running locally or deployed

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/douglasdemaio/forkme.git
cd forkme
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SOLANA_RPC_URL` | Solana RPC (default: devnet) |
| `EXPO_PUBLIC_ESCROW_PROGRAM_ID` | Deployed ForkIt escrow program ID |
| `EXPO_PUBLIC_API_URL` | ForkIt backend URL |
| `EXPO_PUBLIC_WS_URL` | WebSocket URL for real-time updates |

### 3. Start Development

```bash
# Start Expo dev server
npm start

# Or target a specific platform
npm run ios       # iOS simulator
npm run android   # Android emulator
```

### 4. Connect a Wallet

- **Solana Seeker**: Built-in wallet works automatically via Mobile Wallet Adapter
- **iOS/Android**: Install Phantom or Solflare, the app connects via deep links
- **Web (dev)**: Phantom browser extension

## Wallet Integration

ForkMe uses the [Solana Mobile Wallet Adapter](https://docs.solanamobile.com/) for on-device transaction signing:

```typescript
// Mobile: Solana Mobile Wallet Adapter (Seeker, Android)
await transact(async (wallet) => {
  const auth = await wallet.authorize({ identity: { name: 'ForkMe' } });
  const signed = await wallet.signAndSendTransactions({ transactions: [tx] });
});

// Web fallback: window.solana (Phantom extension)
const { signature } = await window.solana.signAndSendTransaction(tx);
```

Transactions are signed on the user's device and sent directly to Solana. The app never has access to private keys.

## Screens

### Customer Flow
1. **Home** → Browse nearby restaurants
2. **Menu** → Add items to cart, place order
3. **Order Detail** → See funding progress, share link with friends
4. **Contribute** → Friends chip in via shared link
5. **Track** → Live map with driver location
6. **Confirm Delivery** → Enter Code B to release payment

### Driver Flow
1. **Home** → View available funded orders
2. **Accept** → Claim a delivery
3. **Pickup** → Scan/enter Code A from restaurant
4. **Deliver** → Customer confirms with Code B

### Restaurant Flow
1. **Dashboard** → View incoming funded orders
2. **Accept** → Start preparing
3. **Ready** → Mark ready for pickup, driver gets notified

## Deep Links

ForkMe registers the `forkme://` scheme for contribution links:

```
forkme://contribute/<shareLink>
```

When a friend taps a shared link, the app opens directly to the contribution screen with the order pre-loaded. They see what's being ordered, how much is funded, and can chip in instantly.

## State Management

Zustand store (`store/app-store.ts`) manages:
- Wallet connection state
- Current user role (customer/driver/restaurant)
- Auth token
- Active order tracking
- Shopping cart

## Development

```bash
# Start dev server
npm start

# Run on specific platform
npm run ios
npm run android

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build
eas build --platform ios
eas build --platform android
```

## Related

- **[ForkIt](https://github.com/douglasdemaio/forkit)** — The protocol: Solana smart contracts, backend API, web frontend

## License

MIT
