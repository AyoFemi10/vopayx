import { FastifyInstance } from 'fastify';
import { authenticate, requireVerified } from '../middleware/authenticate';
import { transferService } from '../services/transfer.service';
import { success } from '../utils/errors';

export async function transferRoutes(app: FastifyInstance) {
  // POST /api/transfers — Send money
  app.post('/', { preHandler: [authenticate, requireVerified] }, async (request, reply) => {
    const { receiverEmail, receiverPhone, amount, currency, note } = request.body as any;
    const result = await transferService.internalTransfer({
      senderUserId: request.user.id,
      receiverEmail,
      receiverPhone,
      amount: Number(amount),
      currency: currency.toUpperCase(),
      note,
      ipAddress: request.ip,
    });
    return reply.status(201).send(success(result, 'Transfer completed successfully'));
  });

  // GET /api/transfers/:id — Get transfer detail
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const transfer = await transferService.getTransfer(id, request.user.id);
    return reply.send(success(transfer));
  });
}
