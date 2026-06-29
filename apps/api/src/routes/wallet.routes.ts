import { FastifyInstance } from 'fastify';
import { prisma } from '@vopay/db';
import { authenticate, requireVerified } from '../middleware/authenticate';
import { ledgerService } from '../services/ledger.service';
import { paymentService } from '../services/payment.service';
import { success, paginated } from '../utils/errors';

export async function walletRoutes(app: FastifyInstance) {
  // GET /api/wallets — List all user wallets
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const wallets = await ledgerService.getUserWallets(request.user.id);
    return reply.send(success(wallets));
  });

  // GET /api/wallets/:currency — Get specific wallet
  app.get('/:currency', { preHandler: [authenticate] }, async (request, reply) => {
    const { currency } = request.params as any;
    const wallet = await ledgerService.getWallet(request.user.id, currency.toUpperCase());
    return reply.send(success(wallet));
  });

  // POST /api/wallets/create — Create a new currency wallet
  app.post('/create', { preHandler: [authenticate, requireVerified] }, async (request, reply) => {
    const { currency } = request.body as any;
    const wallet = await ledgerService.createWallet(request.user.id, currency.toUpperCase());
    return reply.status(201).send(success(wallet, 'Wallet created'));
  });

  // POST /api/wallets/deposit — Initiate deposit
  app.post('/deposit', { preHandler: [authenticate, requireVerified] }, async (request, reply) => {
    const { amount, currency, provider, redirectUrl } = request.body as any;
    const user = await prisma.user.findUnique({ where: { id: request.user.id } });
    if (!user) return reply.status(404).send({ success: false, message: 'User not found.' });

    const result = await paymentService.initiateDeposit({
      userId: request.user.id,
      amount: Number(amount),
      currency: currency.toUpperCase(),
      preferredProvider: provider,
      redirectUrl,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    });

    return reply.send(success(result, 'Deposit initiated'));
  });

  // POST /api/wallets/deposit/verify — Verify deposit after redirect
  app.post('/deposit/verify', { preHandler: [authenticate] }, async (request, reply) => {
    const { reference, provider } = request.body as any;
    const tx = await paymentService.completeDeposit(reference, provider.toUpperCase());
    return reply.send(success(tx, 'Deposit verified and wallet credited'));
  });

  // POST /api/wallets/withdraw — Initiate withdrawal
  app.post('/withdraw', { preHandler: [authenticate, requireVerified] }, async (request, reply) => {
    const { amount, currency, bankCode, accountNumber, accountName, note } = request.body as any;
    const tx = await paymentService.initiateWithdrawal({
      userId: request.user.id,
      amount: Number(amount),
      currency: currency.toUpperCase(),
      bankCode,
      accountNumber,
      accountName,
      note,
      ipAddress: request.ip,
    });
    return reply.send(success(tx, 'Withdrawal initiated successfully'));
  });
}
