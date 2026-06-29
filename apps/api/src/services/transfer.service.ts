import { Decimal } from 'decimal.js';
import { prisma, WalletCurrency } from '@vopay/db';
import { AppError } from '../utils/errors';
import { ledgerService } from './ledger.service';
import { notificationService } from './notification.service';
import { auditService } from './audit.service';
import { TRANSACTION_FEES } from '@vopay/shared';

export const transferService = {
  // ─── Internal Transfer (VOPayX → VOPayX) ─────────────────────
  async internalTransfer(params: {
    senderUserId: string;
    receiverEmail?: string;
    receiverPhone?: string;
    amount: number;
    currency: WalletCurrency;
    note?: string;
    ipAddress?: string;
  }) {
    const { senderUserId, receiverEmail, receiverPhone, amount, currency, note, ipAddress } = params;

    if (!receiverEmail && !receiverPhone) {
      throw new AppError('Provide receiver email or phone.', 400);
    }

    // Find receiver
    const receiver = await prisma.user.findFirst({
      where: receiverEmail
        ? { email: receiverEmail.toLowerCase() }
        : { phone: receiverPhone },
    });

    if (!receiver) throw new AppError('Recipient not found. Verify email or phone.', 404);
    if (!receiver.isActive) throw new AppError('Recipient account is not active.', 400);
    if (receiver.id === senderUserId) throw new AppError('Cannot transfer to yourself.', 400);

    // Get wallets
    const senderWallet = await ledgerService.getWallet(senderUserId, currency);
    let receiverWallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId: receiver.id, currency } },
    });

    // Auto-create receiver wallet if doesn't exist
    if (!receiverWallet) {
      receiverWallet = await ledgerService.createWallet(receiver.id, currency);
    }

    // Fee calculation (internal transfers are free)
    const fee = new Decimal(TRANSACTION_FEES.INTERNAL_TRANSFER_FLAT);
    const totalDebit = new Decimal(amount).plus(fee);

    // Check balance
    await ledgerService.assertSufficientBalance(senderWallet.id, totalDebit);

    // Execute atomically
    return prisma.$transaction(async (tx) => {
      // Create main transaction record
      const transaction = await tx.transaction.create({
        data: {
          walletId: senderWallet.id,
          type: 'TRANSFER',
          status: 'COMPLETED',
          amount: amount.toString(),
          fee: fee.toFixed(6),
          currency,
          description: note ?? `Transfer to ${receiver.firstName} ${receiver.lastName}`,
          provider: 'INTERNAL',
          ipAddress,
          completedAt: new Date(),
        },
      });

      // Create transfer record
      const transfer = await tx.transfer.create({
        data: {
          transactionId: transaction.id,
          senderWalletId: senderWallet.id,
          receiverWalletId: receiverWallet!.id,
          senderUserId,
          receiverUserId: receiver.id,
          amount: amount.toString(),
          fee: fee.toFixed(6),
          currency,
          status: 'COMPLETED',
          note,
        },
      });

      // Ledger: debit sender
      await ledgerService.debit({
        walletId: senderWallet.id,
        transactionId: transaction.id,
        amount: totalDebit,
        description: `Sent to ${receiver.firstName} ${receiver.lastName}`,
      });

      // Ledger: credit receiver
      await ledgerService.credit({
        walletId: receiverWallet!.id,
        transactionId: transaction.id,
        amount,
        description: `Received from sender`,
      });

      // Mark transaction as completed
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      // Notifications (async, non-blocking)
      const sender = await tx.user.findUnique({ where: { id: senderUserId } });

      notificationService.send(senderUserId, {
        title: 'Transfer Successful',
        body: `You sent ${currency} ${new Decimal(amount).toFixed(2)} to ${receiver.firstName} ${receiver.lastName}.`,
        type: 'TRANSFER',
      }).catch(() => {});

      notificationService.send(receiver.id, {
        title: 'Money Received!',
        body: `You received ${currency} ${new Decimal(amount).toFixed(2)} from ${sender?.firstName} ${sender?.lastName}.`,
        type: 'TRANSFER',
      }).catch(() => {});

      auditService.log({
        userId: senderUserId,
        action: 'TRANSFER_COMPLETED',
        entityType: 'transfer',
        entityId: transfer.id,
        ipAddress,
      }).catch(() => {});

      return { transfer, transaction };
    });
  },

  // ─── Get Transfer ────────────────────────────────────────────
  async getTransfer(id: string, userId: string) {
    const transfer = await prisma.transfer.findFirst({
      where: {
        id,
        OR: [{ senderUserId: userId }, { receiverUserId: userId }],
      },
      include: {
        senderUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        receiverUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!transfer) throw new AppError('Transfer not found.', 404);
    return transfer;
  },
};
