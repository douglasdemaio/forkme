'use client';
import { useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  ESCROW_PROGRAM_ID,
  TREASURY_WALLET,
  TOKEN_DECIMALS,
  DISCRIMINATORS,
  getMintForCurrency,
} from '@/lib/constants';

export function useEscrow() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const createOrder = useCallback(
    async (params: {
      orderId: string;
      restaurantWallet: string;
      amount: number;
      currency: string;
    }) => {
      if (!publicKey || !sendTransaction) throw new Error('Wallet not connected');

      const mint = getMintForCurrency(params.currency);
      const restaurantPubkey = new PublicKey(params.restaurantWallet);
      const amountLamports = Math.round(params.amount * 10 ** TOKEN_DECIMALS);

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), publicKey.toBuffer(), Buffer.from(params.orderId.slice(0, 32))],
        ESCROW_PROGRAM_ID
      );

      const customerTokenAccount = await getAssociatedTokenAddress(mint, publicKey);
      const escrowTokenAccount   = await getAssociatedTokenAddress(mint, escrowPda, true);

      const data = Buffer.alloc(8 + 8 + 32);
      DISCRIMINATORS.createOrder.copy(data, 0);
      data.writeBigUInt64LE(BigInt(amountLamports), 8);
      Buffer.from(params.orderId.slice(0, 32).padEnd(32, '\0')).copy(data, 16);

      const ix = new TransactionInstruction({
        keys: [
          { pubkey: publicKey,             isSigner: true,  isWritable: true  },
          { pubkey: escrowPda,             isSigner: false, isWritable: true  },
          { pubkey: customerTokenAccount,  isSigner: false, isWritable: true  },
          { pubkey: escrowTokenAccount,    isSigner: false, isWritable: true  },
          { pubkey: restaurantPubkey,      isSigner: false, isWritable: false },
          { pubkey: TREASURY_WALLET,       isSigner: false, isWritable: true  },
          { pubkey: mint,                  isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID,      isSigner: false, isWritable: false },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId,     isSigner: false, isWritable: false },
        ],
        programId: ESCROW_PROGRAM_ID,
        data,
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey });
      const ataInfo = await connection.getAccountInfo(escrowTokenAccount);
      if (!ataInfo) tx.add(createAssociatedTokenAccountInstruction(publicKey, escrowTokenAccount, escrowPda, mint));
      tx.add(ix);

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      return { signature, escrowPda: escrowPda.toBase58() };
    },
    [publicKey, sendTransaction, connection]
  );

  const contributeToOrder = useCallback(
    async (params: { orderId: string; escrowPda: string; amount: number; currency: string }) => {
      if (!publicKey || !sendTransaction) throw new Error('Wallet not connected');

      const mint = getMintForCurrency(params.currency);
      const escrowPubkey = new PublicKey(params.escrowPda);
      const amountLamports = Math.round(params.amount * 10 ** TOKEN_DECIMALS);

      const contributorAta = await getAssociatedTokenAddress(mint, publicKey);
      const escrowAta      = await getAssociatedTokenAddress(mint, escrowPubkey, true);

      const data = Buffer.alloc(8 + 8);
      DISCRIMINATORS.contribute.copy(data, 0);
      data.writeBigUInt64LE(BigInt(amountLamports), 8);

      const ix = new TransactionInstruction({
        keys: [
          { pubkey: publicKey,     isSigner: true,  isWritable: true  },
          { pubkey: escrowPubkey,  isSigner: false, isWritable: true  },
          { pubkey: contributorAta,isSigner: false, isWritable: true  },
          { pubkey: escrowAta,     isSigner: false, isWritable: true  },
          { pubkey: mint,          isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: ESCROW_PROGRAM_ID,
        data,
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: publicKey }).add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      return { signature };
    },
    [publicKey, sendTransaction, connection]
  );

  return { createOrder, contributeToOrder };
}
