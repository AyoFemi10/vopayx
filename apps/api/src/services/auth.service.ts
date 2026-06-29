import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@vopay/db';
import { config } from '../config';
import { AppError } from '../utils/errors';
import { generateOtp, hashToken } from '../utils/crypto';
import { emailService } from './email.service';
import { ledgerService } from './ledger.service';

const SALT_ROUNDS = 12;

export const authService = {
  // ─── Register ───────────────────────────────────────────────
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new AppError('An account with this email already exists.', 409);

    if (data.phone) {
      const phoneExists = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (phoneExists) throw new AppError('Phone number already in use.', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        country: data.country ?? 'NG',
      },
    });

    // Create default NGN wallet
    await ledgerService.createWallet(user.id, 'NGN', true);

    // Send verification OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.emailVerification.create({
      data: { userId: user.id, otp, expiresAt },
    });

    await emailService.sendVerificationOtp(user.email, user.firstName, otp);

    return { user, message: 'Account created. Check your email for the verification code.' };
  },

  // ─── Verify Email ────────────────────────────────────────────
  async verifyEmail(userId: string, otp: string) {
    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId,
        otp,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) throw new AppError('Invalid or expired verification code.', 400);

    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      }),
    ]);
  },

  // ─── Resend OTP ──────────────────────────────────────────────
  async resendOtp(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found.', 404);
    if (user.isVerified) throw new AppError('Email already verified.', 400);

    // Invalidate old OTPs
    await prisma.emailVerification.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerification.create({
      data: { userId, otp, expiresAt },
    });

    await emailService.sendVerificationOtp(user.email, user.firstName, otp);
  },

  // ─── Login ───────────────────────────────────────────────────
  async login(email: string, password: string, ip?: string, deviceInfo?: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) throw new AppError('Invalid email or password.', 401);

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) throw new AppError('Invalid email or password.', 401);

    if (!user.isVerified) throw new AppError('Please verify your email before logging in.', 403);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  },

  // ─── Forgot Password ─────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always return success (don't leak user existence)
    if (!user) return;

    // Invalidate old tokens
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    await emailService.sendPasswordReset(user.email, user.firstName, token);
  },

  // ─── Reset Password ──────────────────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const reset = await prisma.passwordReset.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!reset) throw new AppError('Invalid or expired reset link.', 400);

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      // Revoke all refresh tokens for security
      prisma.refreshToken.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  },

  // ─── Change Password ─────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found.', 404);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect.', 401);

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // Revoke all other sessions
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  // ─── Refresh Token Management ────────────────────────────────
  async storeRefreshToken(userId: string, token: string, ip?: string, deviceInfo?: string) {
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: { userId, tokenHash, ipAddress: ip, deviceInfo, expiresAt },
    });
  },

  async validateRefreshToken(token: string) {
    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // Possible reuse attack — revoke all tokens for this user
      if (stored) {
        await prisma.refreshToken.updateMany({
          where: { userId: stored.userId },
          data: { revokedAt: new Date() },
        });
        throw new AppError('Refresh token reuse detected. All sessions revoked.', 401);
      }
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    // Rotate: revoke current
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return stored.userId;
  },

  async revokeRefreshToken(token: string) {
    const tokenHash = hashToken(token);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllRefreshTokens(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  // ─── Get User ────────────────────────────────────────────────
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || !user.isActive) throw new AppError('User not found.', 404);
    return user;
  },
};
