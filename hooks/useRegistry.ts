'use client';
import { useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { REGISTRY_PROGRAM_ID, REGISTRY_ROLE, DISCRIMINATORS } from '@/lib/constants';

const PROFILE_SEED = Buffer.from('profile');

export function deriveProfilePda(wallet: PublicKey, role: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [PROFILE_SEED, wallet.toBuffer(), Buffer.from([role])],
    REGISTRY_PROGRAM_ID
  )[0];
}

export function useRegistry() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // Idempotent: returns the existing profile PDA if it exists, otherwise
  // signs a `register` tx and waits for confirmation. Required as a
  // prerequisite for accept_order — the on-chain handler verifies the
  // driver has Role::Driver, is_active, and trust_score >= 1000.
  const ensureProfile = useCallback(
    async (params: { role: keyof typeof REGISTRY_ROLE; metadataUri?: string }) => {
      if (!publicKey || !sendTransaction) throw new Error('Wallet not connected');

      const roleNum = REGISTRY_ROLE[params.role];
      const profilePda = deriveProfilePda(publicKey, roleNum);

      const existing = await connection.getAccountInfo(profilePda);
      if (existing) return { profilePda, alreadyRegistered: true };

      const metadataUri = params.metadataUri ?? '';
      const uriBytes = Buffer.from(metadataUri, 'utf8');
      // Layout: [0-7] discriminator, [8] role u8, [9-12] uri len u32 LE, [13..] uri bytes
      const data = Buffer.alloc(8 + 1 + 4 + uriBytes.length);
      DISCRIMINATORS.register.copy(data, 0);
      data.writeUInt8(roleNum, 8);
      data.writeUInt32LE(uriBytes.length, 9);
      uriBytes.copy(data, 13);

      const ix = new TransactionInstruction({
        keys: [
          { pubkey: profilePda,              isSigner: false, isWritable: true },
          { pubkey: publicKey,               isSigner: true,  isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: REGISTRY_PROGRAM_ID,
        data,
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey }).add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      return { profilePda, alreadyRegistered: false, signature };
    },
    [publicKey, sendTransaction, connection]
  );

  return { ensureProfile, deriveProfilePda };
}
