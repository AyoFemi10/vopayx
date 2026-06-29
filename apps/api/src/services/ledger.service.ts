import { Decimal } from 'decimal.js';
import { prisma, WalletCurrency } from '@vopay/db';
import { AppError } from '../utils/errors';

export const ledgerService = {
  // ─── Create Wallet ───────────────────────────────────────────
  async createWallet(userId: string, currency: WalletCurrency, isDefault = false) {
    const existing = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    if (existing) return existing;

    // Generate account number (10 digits)
    const accountNumber = '9' + String(Date.now()).slice(-9);

    return prisma.wallet.create({
      data: { userId, currency, isDefault, accountNumber },
    });
  },

  // ─── Credit Wallet (atomic) ──────────────────────────────────
  async credit(params: {
    walletId: string;
    transactionId: string;
    amount: Decimal | number | string;
    description?: string;
  }) {
    const { walletId, transactionId, amount, description } = params;
    const creditAmount = new Decimal(amount);

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!wallet) throw new AppError('Wallet not found.', 404);
      if (!wallet.isActive) throw new AppError('Wallet is inactive.', 400);

      const balanceBefore = new Decimal(wallet.balance.toString());
      const balanceAfter = balanceBefore.plus(creditAmount);

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: balanceAfter.toFixed(6) },
      });

      await tx.ledgerEntry.create({
        data: {
          transactionId,
          walletId,
          direction: 'CREDIT',
          amount: creditAmount.toFixed(6),
          balanceBefore: balanceBefore.toFixed(6),
          balanceAfter: balanceAfter.toFixed(6),
          description,
        },
      });

      return balanceAfter;
    });
  },

  // ─── Debit Wallet (atomic) ───────────────────────────────────
  async debit(params: {
    walletId: string;
    transactionId: string;
    amount: Decimal | number | string;
    description?: string;
  }) {
    const { walletId, transactionId, amount, description } = params;
    const debitAmount = new Decimal(amount);

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!wallet) throw new AppError('Wallet not found.', 404);
      if (!wallet.isActive) throw new AppError('Wallet is inactive.', 400);

      const balanceBefore = new Decimal(wallet.balance.toString());
      if (balanceBefore.lt(debitAmount)) {
        throw new AppError('Insufficient balance.', 400);
      }

      const balanceAfter = balanceBefore.minus(debitAmount);

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: balanceAfter.toFixed(6) },
      });

      await tx.ledgerEntry.create({
        data: {
          transactionId,
          walletId,
          direction: 'DEBIT',
          amount: debitAmount.toFixed(6),
          balanceBefore: balanceBefore.toFixed(6),
          balanceAfter: balanceAfter.toFixed(6),
          description,
        },
      });

      return balanceAfter;
    });
  },

  // ─── Get Wallet ──────────────────────────────────────────────
  async getWallet(userId: string, currency: WalletCurrency) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId, currency } },
    });
    if (!wallet) throw new AppError(`No ${currency} wallet found.`, 404);
    return wallet;
  },

  // ─── Get All Wallets for User ────────────────────────────────
  async getUserWallets(userId: string) {
    return prisma.wallet.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { currency: 'asc' }],
    });
  },

  // ─── Validate Sufficient Balance ─────────────────────────────
  async assertSufficientBalance(walletId: string, amount: number | string | Decimal) {
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new AppError('Wallet not found.', 404);

    const balance = new Decimal(wallet.balance.toString());
    const required = new Decimal(amount);

    if (balance.lt(required)) {
      throw new AppError(
        `Insufficient balance. Available: ${wallet.currency} ${balance.toFixed(2)}`,
        400
      );
    }
  },
};
