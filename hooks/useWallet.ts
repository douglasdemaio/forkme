import { useCallback } from 'react';
import { Platform } from 'react-native';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { APP_SCHEME } from '@/lib/constants';

/**
 * Wallet hook — Solana Mobile Wallet Adapter on Android/Seeker,
 * Phantom deep-link on iOS, browser extension on web.
 *
 * After connecting, authenticates against forkit-site /api/auth/*.
 */
export function useWallet() {
  const { setWallet, clearWallet, setAuthToken, isConnected } = useAppStore();

  const authenticate = async (walletAddress: string, signMessage: (msg: Uint8Array) => Promise<Uint8Array>) => {
    // 1. Get nonce from forkit-site
    const { nonce } = await api.getNonce(walletAddress);

    // 2. Sign the nonce with the wallet
    const message = new TextEncoder().encode(
      `Sign in to ForkIt\nNonce: ${nonce}`
    );
    const signatureBytes = await signMessage(message);
    const signature = Buffer.from(signatureBytes).toString('base64');

    // 3. Verify with forkit-site and get JWT
    const session = await api.verify(walletAddress, signature, nonce);
    api.setToken(session.token);
    setAuthToken(session.token);

    return session;
  };

  const connect = useCallback(async () => {
    if (Platform.OS === 'web') {
      // Browser extension (Phantom / Solflare)
      const provider = (window as any).solana;
      if (!provider?.isPhantom) throw new Error('Phantom not found');
      const resp = await provider.connect();
      const pubkey = new PublicKey(resp.publicKey.toString());
      setWallet(pubkey.toBase58(), pubkey);
      await authenticate(pubkey.toBase58(), async (msg) => {
        const { signature } = await provider.signMessage(msg, 'utf8');
        return signature;
      });
      return;
    }

    // Mobile: Solana Mobile Wallet Adapter
    await transact(async (wallet: Web3MobileWallet) => {
      const authResult = await wallet.authorize({
        identity: {
          name: 'ForkMe',
          uri: `${APP_SCHEME}://`,
          icon: 'favicon.png',
        },
        cluster: 'devnet',
      });

      const pubkey = new PublicKey(authResult.accounts[0].address);
      setWallet(pubkey.toBase58(), pubkey);

      await authenticate(pubkey.toBase58(), async (msg) => {
        const signed = await wallet.signMessages({
          addresses: [authResult.accounts[0].address],
          payloads: [msg],
        });
        return signed[0];
      });
    });
  }, []);

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction): Promise<string> => {
      if (Platform.OS === 'web') {
        const provider = (window as any).solana;
        const { signature } = await provider.signAndSendTransaction(transaction);
        return signature;
      }

      let signature = '';
      await transact(async (wallet: Web3MobileWallet) => {
        const authResult = await wallet.authorize({
          identity: {
            name: 'ForkMe',
            uri: `${APP_SCHEME}://`,
            icon: 'favicon.png',
          },
          cluster: 'devnet',
        });
        const signedTxs = await wallet.signAndSendTransactions({
          transactions: [transaction],
        });
        signature = signedTxs[0]
          ? Buffer.from(signedTxs[0]).toString('base64')
          : '';
      });
      return signature;
    },
    []
  );

  const disconnect = useCallback(() => {
    api.clearToken();
    clearWallet();
  }, []);

  return { connect, disconnect, signAndSendTransaction, isConnected };
}
