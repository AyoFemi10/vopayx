import { FastifyInstance } from 'fastify';
import { prisma } from '@vopay/db';
import { authenticate } from '../middleware/authenticate';
import { success, paginated } from '../utils/errors';

export async function transactionRoutes(app: FastifyInstance) {
  // GET /api/transactions — Paginated list with filters
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { page = '1', limit = '20', type, status, currency } = request.query as any;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // Build filter: only show transactions for user's wallets
    const userWallets = await prisma.wallet.findMany({
      where: { userId: request.user.id },
      select: { id: true },
    });
    const walletIds = userWallets.map((w) => w.id);

    const where: any = { walletId: { in: walletIds } };
    if (type) where.type = type.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (currency) where.currency = currency.toUpperCase();

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          transfer: {
            include: {
              senderUser: { select: { firstName: true, lastName: true } },
              receiverUser: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return reply.send(paginated(transactions, total, pageNum, limitNum));
  });

  // GET /api/transactions/:id — Single transaction
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;

    const userWallets = await prisma.wallet.findMany({
      where: { userId: request.user.id },
      select: { id: true },
    });
    const walletIds = userWallets.map((w) => w.id);

    const tx = await prisma.transaction.findFirst({
      where: { id, walletId: { in: walletIds } },
      include: {
        ledgerEntries: true,
        transfer: {
          include: {
            senderUser: { select: { id: true, firstName: true, lastName: true, email: true } },
            receiverUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!tx) return reply.status(404).send({ success: false, message: 'Transaction not found.' });
    return reply.send(success(tx));
  });
}
