import { useCallback, useState } from 'react';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useAppStore } from '@/store/app-store';
import { useWallet } from './useWallet';
import { api } from '@/lib/api';
import { SOLANA_RPC_URL, ESCROW_PROGRAM_ID } from '@/lib/constants';

/**
 * Hook for contributing funds to an order's on-chain escrow.
 * Builds the contribute_to_order instruction, signs via wallet adapter,
 * then records the contribution via forkit-site API.
 */
export function useContribute() {
  const { publicKey } = useAppStore();
  const { signAndSendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contribute = useCallback(
    async (
      orderId: string,
      onChainOrderId: bigint,
      tokenMint: string,
      amount: number
    ) => {
      if (!publicKey) throw new Error('Wallet not connected');
      setLoading(true);
      setError(null);

      try {
        const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
        const mintPubkey = new PublicKey(tokenMint);

        // Derive PDAs
        const orderIdBytes = Buffer.alloc(8);
        orderIdBytes.writeBigUInt64LE(onChainOrderId);

        const [orderPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('order'), orderIdBytes],
          ESCROW_PROGRAM_ID
        );
        const [contributionPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('contribution'), orderIdBytes, publicKey.toBuffer()],
          ESCROW_PROGRAM_ID
        );
        const [escrowVault] = PublicKey.findProgramAddressSync(
          [Buffer.from('escrow_vault'), orderIdBytes],
          ESCROW_PROGRAM_ID
        );

        const contributorTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          publicKey
        );

        // Build contribute_to_order instruction
        // Discriminator: Anchor method hash for contribute_to_order
        const discriminator = Buffer.from([
          0x5f, 0x38, 0x2d, 0x1a, 0x94, 0xc2, 0xb1, 0xe3,
        ]);
        const amountBuffer = Buffer.alloc(8);
        amountBuffer.writeBigUInt64LE(BigInt(amount));
        const data = Buffer.concat([discriminator, amountBuffer]);

        const instruction = new TransactionInstruction({
          programId: ESCROW_PROGRAM_ID,
          keys: [
            { pubkey: orderPda, isSigner: false, isWritable: true },
            { pubkey: contributionPda, isSigner: false, isWritable: true },
            { pubkey: mintPubkey, isSigner: false, isWritable: false },
            { pubkey: escrowVault, isSigner: false, isWritable: true },
            {
              pubkey: contributorTokenAccount,
              isSigner: false,
              isWritable: true,
            },
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false,
            },
          ],
          data,
        });

        const tx = new Transaction().add(instruction);
        tx.feePayer = publicKey;
        tx.recentBlockhash = (
          await connection.getLatestBlockhash()
        ).blockhash;

        const signature = await signAndSendTransaction(tx);

        // Record off-chain via forkit-site
        const result = await api.recordContribution(orderId, {
          wallet: publicKey.toBase58(),
          amount,
          txSignature: signature,
        });

        setLoading(false);
        return { signature, funded: result.funded };
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        throw err;
      }
    },
    [publicKey, signAndSendTransaction]
  );

  return { contribute, loading, error };
}
