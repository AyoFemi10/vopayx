import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { paymentService } from '../services/payment.service';
import { config } from '../config';

function verifyPaystackSignature(payload: string, signature: string): boolean {
  if (!config.PAYSTACK_WEBHOOK_SECRET) return true; // Skip in dev
  const hash = crypto
    .createHmac('sha512', config.PAYSTACK_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return hash === signature;
}

function verifyFlutterwaveSignature(signature: string): boolean {
  if (!config.FLUTTERWAVE_WEBHOOK_SECRET) return true;
  return signature === config.FLUTTERWAVE_WEBHOOK_SECRET;
}

export async function webhookRoutes(app: FastifyInstance) {
  // POST /api/webhooks/paystack
  app.post('/paystack', {
    config: { rawBody: true },
  }, async (request, reply) => {
    const signature = request.headers['x-paystack-signature'] as string;
    const rawBody = JSON.stringify(request.body);

    if (!verifyPaystackSignature(rawBody, signature)) {
      return reply.status(401).send({ message: 'Invalid signature' });
    }

    const { event, data } = request.body as any;
    await paymentService.handlePaystackWebhook(event, data).catch((err) => {
      app.log.error('Paystack webhook error:', err);
    });

    return reply.status(200).send({ status: 'ok' });
  });

  // POST /api/webhooks/flutterwave
  app.post('/flutterwave', async (request, reply) => {
    const signature = request.headers['verif-hash'] as string;

    if (!verifyFlutterwaveSignature(signature)) {
      return reply.status(401).send({ message: 'Invalid signature' });
    }

    const { event, data } = request.body as any;
    await paymentService.handleFlutterwaveWebhook(event, data).catch((err) => {
      app.log.error('Flutterwave webhook error:', err);
    });

    return reply.status(200).send({ status: 'ok' });
  });
}
