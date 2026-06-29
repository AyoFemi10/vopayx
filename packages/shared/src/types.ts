// ============================================================
// VOPayX — Shared TypeScript Types
// Shared between apps/api and apps/web
// ============================================================

export type CurrencyCode = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'KES' | 'GHS' | 'ZAR';
export type UserRole = 'USER' | 'BUSINESS' | 'ADMIN';
export type KycStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE' | 'REFUND' | 'EXCHANGE';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERSED' | 'CANCELLED';
export type PaymentProviderType = 'FLUTTERWAVE' | 'PAYSTACK' | 'INTERNAL';

// ─── API Response ────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── User ────────────────────────────────────────────────────
export interface UserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  isVerified: boolean;
  kycStatus: KycStatus;
  avatarUrl: string | null;
  country: string | null;
  createdAt: string;
}

// ─── Wallet ──────────────────────────────────────────────────
export interface WalletData {
  id: string;
  currency: CurrencyCode;
  balance: string;
  lockedBalance: string;
  isActive: boolean;
  isDefault: boolean;
  accountNumber: string | null;
  createdAt: string;
}

// ─── Transaction ─────────────────────────────────────────────
export interface TransactionData {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  fee: string;
  currency: CurrencyCode;
  reference: string;
  description: string | null;
  provider: PaymentProviderType | null;
  providerRef: string | null;
  completedAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// ─── Transfer ────────────────────────────────────────────────
export interface TransferData {
  id: string;
  amount: string;
  fee: string;
  currency: CurrencyCode;
  status: TransactionStatus;
  note: string | null;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

// ─── Beneficiary ─────────────────────────────────────────────
export interface BeneficiaryData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  accountNumber: string | null;
  bankCode: string | null;
  bankName: string | null;
  currency: CurrencyCode;
  isVopayUser: boolean;
  createdAt: string;
}

// ─── Notification ────────────────────────────────────────────
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'KYC' | 'SECURITY' | 'SYSTEM';
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Auth ────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserPublic;
  tokens: AuthTokens;
}

// ─── Request Payloads ────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
}

export interface VerifyEmailRequest {
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface TransferRequest {
  receiverEmail?: string;
  receiverPhone?: string;
  amount: number;
  currency: CurrencyCode;
  note?: string;
}

export interface DepositRequest {
  amount: number;
  currency: CurrencyCode;
  provider: 'FLUTTERWAVE' | 'PAYSTACK';
  redirectUrl?: string;
}

export interface WithdrawRequest {
  amount: number;
  currency: CurrencyCode;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  note?: string;
}

export interface AddBeneficiaryRequest {
  name: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
  bankCode?: string;
  bankName?: string;
  currency?: CurrencyCode;
}

// ─── Currency & Bank Info ────────────────────────────────────
export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
}

export interface BankInfo {
  code: string;
  name: string;
}

// ─── Payment Provider ────────────────────────────────────────
export interface PaymentInitResponse {
  reference: string;
  authorizationUrl: string;
  provider: PaymentProviderType;
}

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  provider: PaymentProviderType;
}

// ─── Dashboard ───────────────────────────────────────────────
export interface DashboardSummary {
  totalBalance: Record<CurrencyCode, string>;
  defaultWallet: WalletData | null;
  recentTransactions: TransactionData[];
  unreadNotifications: number;
}
