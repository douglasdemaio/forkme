import { useCallback } from 'react';
import { Platform } from 'react-native';
import { PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
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
      const provider = (window as any).solana;
      if (!provider?.isPhantom) throw new Error('Phantom not found');
      const resp = await provider.connect();
      const pubkey = new PublicKey(resp.publicKey.toString());
      const walletAddress = pubkey.toBase58();
      setWallet(walletAddress, pubkey);

      const { message } = await api.getChallenge(walletAddress);
      const msgBytes = new TextEncoder().encode(message);
      const { signature } = await provider.signMessage(msgBytes, 'utf8');
      const sig = bs58.encode(signature);
      const { token } = await api.verify(walletAddress, sig, message);
      api.setToken(token);
      setAuthToken(token);
      return;
    }

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
      const walletAddress = pubkey.toBase58();
      setWallet(walletAddress, pubkey);

      const { message } = await api.getChallenge(walletAddress);
      const msgBytes = new TextEncoder().encode(message);
      const signedMessages = await wallet.signMessages({
        addresses: [authResult.accounts[0].address],
        payloads: [msgBytes],
      });
      const sig = bs58.encode(signedMessages[0]);
      const { token } = await api.verify(walletAddress, sig, message);
      api.setToken(token);
      setAuthToken(token);
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
