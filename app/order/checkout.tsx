import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useAppStore } from '@/store/app-store';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/lib/api';
import {
  SUPPORTED_TOKENS,
  SOLANA_RPC_URL,
  ESCROW_PROGRAM_ID,
  TREASURY_WALLET,
  FEE_BASIS_POINTS,
  DEPOSIT_BASIS_POINTS,
  type StablecoinToken,
} from '@/lib/constants';
import { CurrencySelector } from '@/components/currency-selector';

export default function CheckoutScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const { cart, cartTotal, clearCart, publicKey, setActiveOrder } =
    useAppStore();
  const { signAndSendTransaction } = useWallet();
  const router = useRouter();

  const [selectedToken, setSelectedToken] = useState<StablecoinToken>(
    SUPPORTED_TOKENS[0]
  );
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'review' | 'processing' | 'done'>('review');

  const foodTotal = cartTotal();
  const deliveryFee = 2.0; // TODO: dynamic delivery fee from API
  const subtotal = foodTotal + deliveryFee;
  const protocolFee = (subtotal * FEE_BASIS_POINTS) / 10_000;
  const deposit = (subtotal * DEPOSIT_BASIS_POINTS) / 10_000;
  const escrowTarget = subtotal + protocolFee + deposit;

  const handleCheckout = async () => {
    if (!publicKey || !restaurantId) return;
    setLoading(true);
    setStep('processing');

    try {
      // 1. Create order on forkit-site
      const order = await api.createOrder({
        restaurantId,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
        })),
        tokenMint: selectedToken.mint,
      });

      // 2. Build on-chain escrow create + initial fund transaction
      const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
      const mintPubkey = new PublicKey(selectedToken.mint);
      const onChainOrderId = BigInt(order.onChainOrderId);

      const orderIdBytes = Buffer.alloc(8);
      orderIdBytes.writeBigUInt64LE(onChainOrderId);

      const [orderPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('order'), orderIdBytes],
        ESCROW_PROGRAM_ID
      );
      const [escrowVault] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow_vault'), orderIdBytes],
        ESCROW_PROGRAM_ID
      );
      const [contributionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('contribution'), orderIdBytes, publicKey.toBuffer()],
        ESCROW_PROGRAM_ID
      );

      const payerTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );

      // Create order instruction
      const createDiscriminator = Buffer.from([
        0xa1, 0xb2, 0xc3, 0xd4, 0xe5, 0xf6, 0x07, 0x18,
      ]);
      const targetBuffer = Buffer.alloc(8);
      targetBuffer.writeBigUInt64LE(
        BigInt(Math.round(escrowTarget * 10 ** selectedToken.decimals))
      );
      const createData = Buffer.concat([
        createDiscriminator,
        orderIdBytes,
        targetBuffer,
      ]);

      const restaurantWallet = new PublicKey(order.restaurant.walletAddress);

      const createIx = new TransactionInstruction({
        programId: ESCROW_PROGRAM_ID,
        keys: [
          { pubkey: orderPda, isSigner: false, isWritable: true },
          { pubkey: escrowVault, isSigner: false, isWritable: true },
          { pubkey: mintPubkey, isSigner: false, isWritable: false },
          { pubkey: restaurantWallet, isSigner: false, isWritable: false },
          { pubkey: TREASURY_WALLET, isSigner: false, isWritable: false },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          {
            pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
            isSigner: false,
            isWritable: false,
          },
        ],
        data: createData,
      });

      // Contribute full amount instruction
      const contributeDiscriminator = Buffer.from([
        0x5f, 0x38, 0x2d, 0x1a, 0x94, 0xc2, 0xb1, 0xe3,
      ]);
      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(
        BigInt(Math.round(escrowTarget * 10 ** selectedToken.decimals))
      );
      const contributeData = Buffer.concat([
        contributeDiscriminator,
        amountBuffer,
      ]);

      const contributeIx = new TransactionInstruction({
        programId: ESCROW_PROGRAM_ID,
        keys: [
          { pubkey: orderPda, isSigner: false, isWritable: true },
          { pubkey: contributionPda, isSigner: false, isWritable: true },
          { pubkey: mintPubkey, isSigner: false, isWritable: false },
          { pubkey: escrowVault, isSigner: false, isWritable: true },
          { pubkey: payerTokenAccount, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: contributeData,
      });

      const tx = new Transaction().add(createIx, contributeIx);
      tx.feePayer = publicKey;
      tx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      const signature = await signAndSendTransaction(tx);

      // 3. Record contribution on forkit-site
      await api.recordContribution(order.id, {
        wallet: publicKey.toBase58(),
        amount: Math.round(escrowTarget * 10 ** selectedToken.decimals),
        txSignature: signature,
      });

      // 4. Done!
      setActiveOrder(order);
      clearCart();
      setStep('done');
    } catch (err: any) {
      setStep('review');
      Alert.alert('Checkout Failed', err.message || 'Something went wrong');
    }
    setLoading(false);
  };

  if (step === 'done') {
    const { activeOrder } = useAppStore.getState();
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-8">
        <Ionicons name="checkmark-circle" size={80} color="#66bb6a" />
        <Text className="text-white text-2xl font-bold mt-4">
          Order Created!
        </Text>
        <Text className="text-dark-300 text-center mt-2">
          Your payment is locked in the on-chain escrow. The restaurant
          will start preparing your order.
        </Text>
        <TouchableOpacity
          className="bg-brand-500 rounded-2xl px-8 py-4 mt-6"
          onPress={() => {
            if (activeOrder) {
              router.replace({
                pathname: '/order/[id]',
                params: { id: activeOrder.id },
              });
            } else {
              router.replace('/(tabs)/orders');
            }
          }}
        >
          <Text className="text-dark-950 font-bold">View Order</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-8">
        <ActivityIndicator size="large" color="#f9a825" />
        <Text className="text-white text-xl font-bold mt-6">
          Creating Escrow...
        </Text>
        <Text className="text-dark-300 text-center mt-2">
          Please confirm the transaction in your wallet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-dark-950 px-4 pt-4">
      <Text className="text-white text-2xl font-bold mb-4">Checkout</Text>

      {/* Cart items */}
      <View className="bg-dark-900 rounded-2xl p-4 mb-4">
        <Text className="text-white font-semibold mb-3">Your Order</Text>
        {cart.map((item) => (
          <View
            key={item.menuItemId}
            className="flex-row justify-between py-2"
          >
            <Text className="text-dark-300">
              {item.quantity}× {item.name}
            </Text>
            <Text className="text-white">
              ${(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Currency selection */}
      <View className="mb-4">
        <CurrencySelector
          selected={selectedToken}
          onSelect={setSelectedToken}
        />
      </View>

      {/* Price breakdown */}
      <View className="bg-dark-900 rounded-2xl p-4 mb-4">
        <Text className="text-white font-semibold mb-3">Summary</Text>
        <View className="flex-row justify-between py-1">
          <Text className="text-dark-300">Food subtotal</Text>
          <Text className="text-white">
            {selectedToken.currencySign}
            {foodTotal.toFixed(2)}
          </Text>
        </View>
        <View className="flex-row justify-between py-1">
          <Text className="text-dark-300">Delivery fee</Text>
          <Text className="text-white">
            {selectedToken.currencySign}
            {deliveryFee.toFixed(2)}
          </Text>
        </View>
        <View className="flex-row justify-between py-1">
          <Text className="text-dark-400">Protocol fee (0.02%)</Text>
          <Text className="text-dark-400">
            {selectedToken.currencySign}
            {protocolFee.toFixed(4)}
          </Text>
        </View>
        <View className="flex-row justify-between py-1">
          <Text className="text-dark-400">
            Refundable deposit (2%)
          </Text>
          <Text className="text-dark-400">
            {selectedToken.currencySign}
            {deposit.toFixed(2)}
          </Text>
        </View>
        <View className="border-t border-dark-700 mt-2 pt-2 flex-row justify-between">
          <Text className="text-white font-bold">
            Total to escrow
          </Text>
          <Text className="text-brand-500 font-bold text-lg">
            {selectedToken.currencySign}
            {escrowTarget.toFixed(2)} {selectedToken.symbol}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View className="bg-dark-800/50 rounded-xl p-3 mb-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="lock-closed" size={16} color="#66bb6a" />
          <Text className="text-dark-300 text-sm flex-1">
            Funds are held in a Solana escrow smart contract. Your 2%
            deposit is refunded automatically on delivery.
          </Text>
        </View>
      </View>

      {/* Pay button */}
      <TouchableOpacity
        className={`rounded-2xl py-4 items-center mb-8 ${
          loading ? 'bg-dark-700' : 'bg-brand-500'
        }`}
        onPress={handleCheckout}
        disabled={loading || cart.length === 0}
      >
        <Text className="text-dark-950 font-bold text-lg">
          Pay {selectedToken.currencySign}
          {escrowTarget.toFixed(2)} {selectedToken.symbol}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
