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
 * Wallet hook for Solana Mobile Wallet Adapter (Seeker/Android)
 * and Phantom deep links (iOS fallback).
 */
export function useWallet() {
  const { setWallet, clearWallet, setAuthToken, isConnected } = useAppStore();

  const connect = useCallback(async () => {
    if (Platform.OS === 'web') {
      // Web fallback — use window.solana (Phantom browser extension)
      const provider = (window as any).solana;
      if (!provider?.isPhantom) throw new Error('Phantom not found');
      const resp = await provider.connect();
      const pubkey = new PublicKey(resp.publicKey.toString());
      setWallet(pubkey.toBase58(), pubkey);
      await authenticate(pubkey.toBase58());
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
      await authenticate(pubkey.toBase58());
    });
  }, []);

  const authenticate = async (walletAddress: string) => {
    const { nonce } = await api.getChallenge(walletAddress);
    // In production, sign the nonce with the wallet and verify
    // For now, simplified flow
    const { token } = await api.verify(walletAddress, 'placeholder-sig');
    api.setToken(token);
    setAuthToken(token);
  };

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
        signature = signedTxs[0] ? Buffer.from(signedTxs[0]).toString('base64') : '';
      });
      return signature;
    },
    []
  );

  const disconnect = useCallback(() => {
    clearWallet();
  }, []);

  return { connect, disconnect, signAndSendTransaction, isConnected };
}
