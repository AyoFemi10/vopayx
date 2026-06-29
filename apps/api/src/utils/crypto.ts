import crypto from 'crypto';

/** Generate a 6-digit numeric OTP */
export function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

/** Hash a token for secure storage (SHA-256) */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Generate a secure random reference string */
export function generateReference(prefix = 'VPX'): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

/** Format currency amount to 2 decimal places string */
export function formatAmount(amount: string | number): string {
  return Number(amount).toFixed(2);
}

/** Sanitize user object for public response */
export function sanitizeUser(user: {
  id: string; email: string; firstName: string; lastName: string;
  phone: string | null; role: string; isVerified: boolean; kycStatus: string;
  avatarUrl: string | null; country: string | null; createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    kycStatus: user.kycStatus,
    avatarUrl: user.avatarUrl,
    country: user.country,
    createdAt: user.createdAt.toISOString(),
  };
}
