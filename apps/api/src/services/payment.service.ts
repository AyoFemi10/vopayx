import axios from 'axios';
import { Decimal } from 'decimal.js';
import { prisma, WalletCurrency } from '@vopay/db';
import { AppError } from '../utils/errors';
import { ledgerService } from './ledger.service';
import { notificationService } from './notification.service';
import { config } from '../config';

// ─── Routing Logic ───────────────────────────────────────────
// VOPayX acts as a financial orchestration layer.
// We route to the best provider based on currency, type, and availability.

function selectProvider(currency: WalletCurrency, type: 'deposit' | 'withdraw'): 'PAYSTACK' | 'FLUTTERWAVE' {
  if (currency === 'NGN') {
    return type === 'deposit' ? 'PAYSTACK' : 'FLUTTERWAVE';
  }
  return 'FLUTTERWAVE'; // International always via Flutterwave
}

// ─── Paystack ────────────────────────────────────────────────
const paystackClient = axios.create({
  baseURL: config.PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

// ─── Flutterwave ─────────────────────────────────────────────
const flutterwaveClient = axios.create({
  baseURL: config.FLUTTERWAVE_BASE_URL,
  headers: {
    Authorization: `Bearer ${config.FLUTTERWAVE_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const paymentService = {
  // ─── Initiate Deposit ────────────────────────────────────────
  async initiateDeposit(params: {
    userId: string;
    amount: number;
    currency: WalletCurrency;
    preferredProvider?: 'PAYSTACK' | 'FLUTTERWAVE';
    redirectUrl?: string;
    email: string;
    name: string;
  }) {
    const { userId, amount, currency, preferredProvider, redirectUrl, email, name } = params;

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    if (!wallet) {
      wallet = await ledgerService.createWallet(userId, currency);
    }

    const provider = preferredProvider ?? selectProvider(currency, 'deposit');
    const reference = `VPX-DEP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount: amount.toString(),
        fee: '0',
        currency,
        reference,
        description: `Wallet deposit via ${provider}`,
        provider: provider as any,
      },
    });

    let authorizationUrl = '';

    if (provider === 'PAYSTACK') {
      const { data } = await paystackClient.post('/transaction/initialize', {
        email,
        amount: Math.round(amount * 100), // Paystack uses kobo
        currency,
        reference,
        callback_url: redirectUrl ?? `${config.FRONTEND_URL}/dashboard/wallet?ref=${reference}`,
        metadata: {
          transactionId: transaction.id,
          userId,
          walletId: wallet.id,
        },
      });
      authorizationUrl = data.data.authorization_url;

    } else {
      const { data } = await flutterwaveClient.post('/payments', {
        tx_ref: reference,
        amount,
        currency,
        redirect_url: redirectUrl ?? `${config.FRONTEND_URL}/dashboard/wallet?ref=${reference}`,
        customer: { email, name },
        customizations: {
          title: 'VOPayX Wallet Deposit',
          logo: `${config.FRONTEND_URL}/logo.png`,
        },
        meta: {
          transactionId: transaction.id,
          userId,
          walletId: wallet.id,
        },
      });
      authorizationUrl = data.data.link;
    }

    return { reference, authorizationUrl, provider, transactionId: transaction.id };
  },

  // ─── Verify & Complete Deposit ───────────────────────────────
  async completeDeposit(reference: string, provider: 'PAYSTACK' | 'FLUTTERWAVE') {
    const transaction = await prisma.transaction.findUnique({ where: { reference } });
    if (!transaction) throw new AppError('Transaction not found.', 404);
    if (transaction.status === 'COMPLETED') return transaction; // Idempotent

    let verified = false;
    let amountPaid = 0;

    if (provider === 'PAYSTACK') {
      const { data } = await paystackClient.get(`/transaction/verify/${reference}`);
      verified = data.data.status === 'success';
      amountPaid = data.data.amount / 100; // Convert from kobo
    } else {
      const { data } = await flutterwaveClient.get(`/transactions/verify_by_reference?tx_ref=${reference}`);
      verified = data.data.status === 'successful';
      amountPaid = data.data.amount;
    }

    if (!verified) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
      throw new AppError('Payment verification failed.', 400);
    }

    // Credit the wallet
    await ledgerService.credit({
      walletId: transaction.walletId,
      transactionId: transaction.id,
      amount: amountPaid,
      description: `Deposit via ${provider}`,
    });

    const updated = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        amount: amountPaid.toString(),
        completedAt: new Date(),
        providerRef: reference,
      },
    });

    // Get wallet to find userId for notification
    const wallet = await prisma.wallet.findUnique({ where: { id: transaction.walletId } });
    if (wallet) {
      notificationService.send(wallet.userId, {
        title: 'Deposit Successful!',
        body: `${transaction.currency} ${new Decimal(amountPaid).toFixed(2)} has been added to your wallet.`,
        type: 'DEPOSIT',
      }).catch(() => {});
    }

    return updated;
  },

  // ─── Withdraw (Bank Transfer) ────────────────────────────────
  async initiateWithdrawal(params: {
    userId: string;
    amount: number;
    currency: WalletCurrency;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    note?: string;
    ipAddress?: string;
  }) {
    const { userId, amount, currency, bankCode, accountNumber, accountName, note, ipAddress } = params;

    const wallet = await ledgerService.getWallet(userId, currency);
    const fee = currency === 'NGN' ? 50 : new Decimal(amount).mul(0.015).toNumber();
    const totalDebit = new Decimal(amount).plus(fee);

    await ledgerService.assertSufficientBalance(wallet.id, totalDebit);

    const reference = `VPX-WDR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        amount: amount.toString(),
        fee: fee.toString(),
        currency,
        reference,
        description: note ?? `Withdrawal to ${accountName}`,
        provider: 'FLUTTERWAVE',
        ipAddress,
        metadata: { bankCode, accountNumber, accountName },
      },
    });

    // Debit wallet immediately (funds locked)
    await ledgerService.debit({
      walletId: wallet.id,
      transactionId: transaction.id,
      amount: totalDebit,
      description: `Withdrawal to ${accountName} (${bankCode})`,
    });

    // Initiate payout via Flutterwave
    try {
      await flutterwaveClient.post('/transfers', {
        account_bank: bankCode,
        account_number: accountNumber,
        amount,
        narration: note ?? 'VOPayX Withdrawal',
        currency,
        reference,
        beneficiary_name: accountName,
        meta: [{ sender: 'VOPayX', mobile_number: '', email: '' }],
      });

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'PROCESSING' },
      });

      const notifWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
      if (notifWallet) {
        notificationService.send(notifWallet.userId, {
          title: 'Withdrawal Processing',
          body: `Your withdrawal of ${currency} ${new Decimal(amount).toFixed(2)} to ${accountName} is being processed.`,
          type: 'WITHDRAWAL',
        }).catch(() => {});
      }

    } catch (err) {
      // Refund on failure
      await ledgerService.credit({
        walletId: wallet.id,
        transactionId: transaction.id,
        amount: totalDebit,
        description: 'Withdrawal refund - provider error',
      });
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
      throw new AppError('Withdrawal could not be processed. Please try again.', 502);
    }

    return transaction;
  },

  // ─── Handle Provider Webhooks ────────────────────────────────
  async handlePaystackWebhook(event: string, data: Record<string, unknown>) {
    if (event === 'charge.success') {
      const reference = data.reference as string;
      await this.completeDeposit(reference, 'PAYSTACK').catch(() => {});
    }

    if (event === 'transfer.success') {
      const reference = data.reference as string;
      await prisma.transaction.updateMany({
        where: { reference, status: 'PROCESSING' },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    if (event === 'transfer.failed') {
      const reference = data.reference as string;
      const tx = await prisma.transaction.findUnique({ where: { reference } });
      if (tx && tx.status === 'PROCESSING') {
        await ledgerService.credit({
          walletId: tx.walletId,
          transactionId: tx.id,
          amount: new Decimal(tx.amount.toString()).plus(tx.fee.toString()),
          description: 'Withdrawal refund - transfer failed',
        });
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { status: 'FAILED' },
        });
      }
    }
  },

  async handleFlutterwaveWebhook(event: string, data: Record<string, unknown>) {
    if (event === 'charge.completed' && (data.status as string) === 'successful') {
      const reference = (data.tx_ref ?? data.flw_ref) as string;
      await this.completeDeposit(reference, 'FLUTTERWAVE').catch(() => {});
    }

    if (event === 'transfer.completed' && (data.status as string) === 'SUCCESSFUL') {
      const reference = data.reference as string;
      await prisma.transaction.updateMany({
        where: { reference, status: 'PROCESSING' },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
  },
};
