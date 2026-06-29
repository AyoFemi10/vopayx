import { prisma } from '@vopay/db';

export const auditService = {
  async log(data: {
    userId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }) {
    await prisma.auditLog.create({ data });
  },
};
