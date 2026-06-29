import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { walletRoutes } from './routes/wallet.routes';
import { transferRoutes } from './routes/transfer.routes';
import { transactionRoutes } from './routes/transaction.routes';
import { userRoutes } from './routes/user.routes';
import { webhookRoutes } from './routes/webhook.routes';

const app = Fastify({
  logger: {
    transport:
      config.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

// ─── Plugins ────────────────────────────────────────────────
async function registerPlugins() {
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: [config.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      success: false,
      message: 'Too many requests. Please slow down.',
    }),
  });

  await app.register(cookie, {
    secret: config.JWT_REFRESH_SECRET,
  });
}

// ─── Routes ─────────────────────────────────────────────────
async function registerRoutes() {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'VOPayX API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }));

  await app.register(authRoutes,        { prefix: '/api/auth' });
  await app.register(walletRoutes,      { prefix: '/api/wallets' });
  await app.register(transferRoutes,    { prefix: '/api/transfers' });
  await app.register(transactionRoutes, { prefix: '/api/transactions' });
  await app.register(userRoutes,        { prefix: '/api/users' });
  await app.register(webhookRoutes,     { prefix: '/api/webhooks' });
}

// ─── Error Handler ───────────────────────────────────────────
app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);

  if (error.validation) {
    return reply.status(400).send({
      success: false,
      message: 'Validation error',
      errors: error.validation,
    });
  }

  const statusCode = error.statusCode ?? 500;
  return reply.status(statusCode).send({
    success: false,
    message: error.message || 'Internal server error',
  });
});

// ─── Bootstrap ───────────────────────────────────────────────
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    app.log.info(`🚀 VOPayX API running on port ${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
