import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '@vopay/db';
import { authenticate, requireVerified } from '../middleware/authenticate';
import { notificationService } from '../services/notification.service';
import { authService } from '../services/auth.service';
import { success, paginated, AppError } from '../utils/errors';
import { sanitizeUser } from '../utils/crypto';

export async function userRoutes(app: FastifyInstance) {
  // GET /api/users/profile
  app.get('/profile', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.id } });
    if (!user) return reply.status(404).send({ success: false, message: 'User not found.' });
    return reply.send(success(sanitizeUser(user)));
  });

  // PATCH /api/users/profile
  app.patch('/profile', { preHandler: [authenticate] }, async (request, reply) => {
    const { firstName, lastName, phone, address, dateOfBirth } = request.body as any;
    const updated = await prisma.user.update({
      where: { id: request.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      },
    });
    return reply.send(success(sanitizeUser(updated), 'Profile updated'));
  });

  // POST /api/users/change-password
  app.post('/change-password', { preHandler: [authenticate] }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body as any;
    await authService.changePassword(request.user.id, currentPassword, newPassword);
    return reply.send(success(null, 'Password changed successfully'));
  });

  // POST /api/users/kyc — Submit KYC document
  app.post('/kyc', { preHandler: [authenticate, requireVerified] }, async (request, reply) => {
    const { type, number, frontUrl, backUrl, selfieUrl } = request.body as any;

    const existing = await prisma.kycDocument.findFirst({
      where: { userId: request.user.id, status: { in: ['PENDING', 'SUBMITTED', 'APPROVED'] } },
    });
    if (existing && existing.status === 'APPROVED') {
      throw new AppError('KYC already approved.', 400);
    }

    const doc = await prisma.kycDocument.create({
      data: {
        userId: request.user.id,
        type: type.toUpperCase(),
        number,
        frontUrl,
        backUrl,
        selfieUrl,
        status: 'SUBMITTED',
      },
    });

    await prisma.user.update({
      where: { id: request.user.id },
      data: { kycStatus: 'SUBMITTED' },
    });

    return reply.status(201).send(success(doc, 'KYC submitted for review'));
  });

  // GET /api/users/kyc
  app.get('/kyc', { preHandler: [authenticate] }, async (request, reply) => {
    const docs = await prisma.kycDocument.findMany({
      where: { userId: request.user.id },
      orderBy: { submittedAt: 'desc' },
    });
    return reply.send(success(docs));
  });

  // GET /api/users/beneficiaries
  app.get('/beneficiaries', { preHandler: [authenticate] }, async (request, reply) => {
    const beneficiaries = await prisma.beneficiary.findMany({
      where: { userId: request.user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(success(beneficiaries));
  });

  // POST /api/users/beneficiaries
  app.post('/beneficiaries', { preHandler: [authenticate] }, async (request, reply) => {
    const { name, email, phone, accountNumber, bankCode, bankName, currency } = request.body as any;

    // Check if this is a VOPayX user
    const vopayUser = email
      ? await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
      : phone
      ? await prisma.user.findUnique({ where: { phone } })
      : null;

    const ben = await prisma.beneficiary.create({
      data: {
        userId: request.user.id,
        name,
        email: email?.toLowerCase(),
        phone,
        accountNumber,
        bankCode,
        bankName,
        currency: currency?.toUpperCase() ?? 'NGN',
        isVopayUser: !!vopayUser,
      },
    });
    return reply.status(201).send(success(ben, 'Beneficiary added'));
  });

  // DELETE /api/users/beneficiaries/:id
  app.delete('/beneficiaries/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    await prisma.beneficiary.updateMany({
      where: { id, userId: request.user.id },
      data: { isActive: false },
    });
    return reply.send(success(null, 'Beneficiary removed'));
  });

  // GET /api/users/notifications
  app.get('/notifications', { preHandler: [authenticate] }, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as any;
    const { notifications, total } = await notificationService.getAll(
      request.user.id, parseInt(page), parseInt(limit)
    );
    return reply.send(paginated(notifications, total, parseInt(page), parseInt(limit)));
  });

  // PATCH /api/users/notifications/:id/read
  app.patch('/notifications/:id/read', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    await notificationService.markAsRead(id, request.user.id);
    return reply.send(success(null, 'Marked as read'));
  });

  // PATCH /api/users/notifications/read-all
  app.patch('/notifications/read-all', { preHandler: [authenticate] }, async (request, reply) => {
    await notificationService.markAllAsRead(request.user.id);
    return reply.send(success(null, 'All notifications marked as read'));
  });

  // GET /api/users/dashboard — Dashboard summary
  app.get('/dashboard', { preHandler: [authenticate] }, async (request, reply) => {
    const [wallets, recentTx, unreadCount] = await Promise.all([
      prisma.wallet.findMany({ where: { userId: request.user.id, isActive: true } }),
      prisma.transaction.findMany({
        where: {
          wallet: { userId: request.user.id },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { transfer: { include: { senderUser: { select: { firstName: true, lastName: true } }, receiverUser: { select: { firstName: true, lastName: true } } } } },
      }),
      notificationService.getUnreadCount(request.user.id),
    ]);

    return reply.send(success({
      wallets,
      recentTransactions: recentTx,
      unreadNotifications: unreadCount,
    }));
  });
}
