import { prisma } from '@vopay/db';

type NotificationType = 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'KYC' | 'SECURITY' | 'SYSTEM';

export const notificationService = {
  async send(userId: string, data: { title: string; body: string; type: NotificationType; metadata?: Record<string, unknown> }) {
    await prisma.notification.create({
      data: {
        userId,
        title: data.title,
        body: data.body,
        type: data.type,
        metadata: data.metadata,
      },
    });
  },

  async getUnread(userId: string) {
    return prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },

  async getAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);
    return { notifications, total };
  },

  async markAsRead(id: string, userId: string) {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },
};
