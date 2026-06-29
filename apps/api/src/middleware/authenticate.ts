import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/errors';
import { prisma } from '@vopay/db';

export interface JwtPayload {
  sub: string;  // userId
  role: string;
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string; role: string };
  }
}

export function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as any,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    throw new AppError('Invalid or expired token.', 401);
  }
}

export function verifyRefreshToken(token: string): { sub: string } {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }
}

/** Middleware: require authenticated user */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ success: false, message: 'Authentication required.' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      return reply.status(401).send({ success: false, message: 'Account not found or inactive.' });
    }
    request.user = { id: payload.sub, role: payload.role };
  } catch (err) {
    return reply.status(401).send({ success: false, message: 'Invalid or expired token.' });
  }
}

/** Middleware: require verified email */
export async function requireVerified(request: FastifyRequest, reply: FastifyReply) {
  const user = await prisma.user.findUnique({ where: { id: request.user.id } });
  if (!user?.isVerified) {
    return reply.status(403).send({ success: false, message: 'Please verify your email to continue.' });
  }
}

/** Middleware: require admin role */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (request.user.role !== 'ADMIN') {
    return reply.status(403).send({ success: false, message: 'Admin access required.' });
  }
}
