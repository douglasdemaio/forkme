'use client';
import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { api } from '@/lib/api';

export function useWalletAuth() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('forkme-auth-token') : null;
    if (stored) {
      setToken(stored);
      api.setToken(stored);
    }
  }, []);

  // Re-authenticate when wallet changes
  useEffect(() => {
    if (!connected) {
      setToken(null);
      api.clearToken();
    }
  }, [connected]);

  const authenticate = useCallback(async (): Promise<string | null> => {
    if (!publicKey || !signMessage) return null;
    setIsAuthenticating(true);
    try {
      const { nonce } = await api.getNonce(publicKey.toBase58());
      const message = new TextEncoder().encode(
        `Sign this message to authenticate with ForkIt:\n\nNonce: ${nonce}`
      );
      const sig = await signMessage(message);
      const { token: jwt } = await api.verify(publicKey.toBase58(), nonce, bs58.encode(sig));
      setToken(jwt);
      api.setToken(jwt);
      localStorage.setItem('forkme-auth-token', jwt);
      return jwt;
    } catch (err) {
      console.error('Auth failed:', err);
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  }, [publicKey, signMessage]);

  const logout = useCallback(() => {
    setToken(null);
    api.clearToken();
    localStorage.removeItem('forkme-auth-token');
    disconnect();
  }, [disconnect]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  return {
    wallet: publicKey?.toBase58() ?? null,
    connected,
    token,
    isAuthenticating,
    authenticate,
    logout,
    getAuthHeaders,
  };
}
