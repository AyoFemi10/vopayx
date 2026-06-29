import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { authenticate, signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/authenticate';
import { sanitizeUser } from '../utils/crypto';
import { success } from '../utils/errors';
import { config } from '../config';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/register
  app.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email:     { type: 'string', format: 'email' },
          password:  { type: 'string', minLength: 8 },
          firstName: { type: 'string', minLength: 1 },
          lastName:  { type: 'string', minLength: 1 },
          phone:     { type: 'string' },
          country:   { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as any;
    const { user, message } = await authService.register(body);
    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);
    await authService.storeRefreshToken(user.id, refreshToken, request.ip);
    reply.setCookie('refreshToken', refreshToken, COOKIE_OPTS);
    return reply.status(201).send(success({ user: sanitizeUser(user), tokens: { accessToken, expiresIn: 900 } }, message));
  });

  // POST /api/auth/login
  app.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as any;
    const user = await authService.login(email, password, request.ip);
    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);
    await authService.storeRefreshToken(user.id, refreshToken, request.ip);
    reply.setCookie('refreshToken', refreshToken, COOKIE_OPTS);
    return reply.send(success({ user: sanitizeUser(user), tokens: { accessToken, expiresIn: 900 } }, 'Login successful'));
  });

  // POST /api/auth/refresh
  app.post('/refresh', async (request, reply) => {
    const token = (request.cookies as any).refreshToken;
    if (!token) return reply.status(401).send({ success: false, message: 'No refresh token provided.' });

    verifyRefreshToken(token); // validates signature
    const userId = await authService.validateRefreshToken(token);
    const user = await authService.getUserById(userId);

    const accessToken = signAccessToken(user.id, user.role);
    const newRefreshToken = signRefreshToken(user.id);
    await authService.storeRefreshToken(user.id, newRefreshToken, request.ip);
    reply.setCookie('refreshToken', newRefreshToken, COOKIE_OPTS);
    return reply.send(success({ tokens: { accessToken, expiresIn: 900 } }, 'Token refreshed'));
  });

  // POST /api/auth/logout
  app.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    const token = (request.cookies as any).refreshToken;
    if (token) await authService.revokeRefreshToken(token);
    reply.clearCookie('refreshToken', { path: '/' });
    return reply.send(success(null, 'Logged out successfully'));
  });

  // POST /api/auth/verify-email
  app.post('/verify-email', { preHandler: [authenticate] }, async (request, reply) => {
    const { otp } = request.body as any;
    await authService.verifyEmail(request.user.id, otp);
    return reply.send(success(null, 'Email verified successfully'));
  });

  // POST /api/auth/resend-otp
  app.post('/resend-otp', { preHandler: [authenticate] }, async (request, reply) => {
    await authService.resendOtp(request.user.id);
    return reply.send(success(null, 'Verification code resent'));
  });

  // POST /api/auth/forgot-password
  app.post('/forgot-password', async (request, reply) => {
    const { email } = request.body as any;
    await authService.forgotPassword(email);
    return reply.send(success(null, 'If that email exists, a reset link has been sent.'));
  });

  // POST /api/auth/reset-password
  app.post('/reset-password', async (request, reply) => {
    const { token, password } = request.body as any;
    await authService.resetPassword(token, password);
    return reply.send(success(null, 'Password reset successfully. Please log in.'));
  });

  // GET /api/auth/me
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await authService.getUserById(request.user.id);
    return reply.send(success(sanitizeUser(user)));
  });
}
