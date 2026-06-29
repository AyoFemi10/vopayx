import type { CurrencyInfo, BankInfo } from './types';

// ─── Currencies ──────────────────────────────────────────────
export const CURRENCIES: CurrencyInfo[] = [
  { code: 'NGN', name: 'Nigerian Naira',       symbol: '₦',   flag: '🇳🇬' },
  { code: 'USD', name: 'US Dollar',            symbol: '$',   flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound',        symbol: '£',   flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro',                 symbol: '€',   flag: '🇪🇺' },
  { code: 'KES', name: 'Kenyan Shilling',      symbol: 'KSh', flag: '🇰🇪' },
  { code: 'GHS', name: 'Ghanaian Cedi',        symbol: 'GH₵', flag: '🇬🇭' },
  { code: 'ZAR', name: 'South African Rand',   symbol: 'R',   flag: '🇿🇦' },
];

// ─── Nigerian Banks ──────────────────────────────────────────
export const SUPPORTED_BANKS: BankInfo[] = [
  { code: '044',    name: 'Access Bank' },
  { code: '023',    name: 'Citibank Nigeria' },
  { code: '050',    name: 'EcoBank Nigeria' },
  { code: '011',    name: 'First Bank of Nigeria' },
  { code: '214',    name: 'First City Monument Bank (FCMB)' },
  { code: '070',    name: 'Fidelity Bank' },
  { code: '058',    name: 'Guaranty Trust Bank (GTBank)' },
  { code: '301',    name: 'Jaiz Bank' },
  { code: '082',    name: 'Keystone Bank' },
  { code: '076',    name: 'Polaris Bank' },
  { code: '101',    name: 'Providus Bank' },
  { code: '221',    name: 'Stanbic IBTC Bank' },
  { code: '068',    name: 'Standard Chartered Bank' },
  { code: '232',    name: 'Sterling Bank' },
  { code: '100',    name: 'SunTrust Bank' },
  { code: '032',    name: 'Union Bank of Nigeria' },
  { code: '033',    name: 'United Bank for Africa (UBA)' },
  { code: '215',    name: 'Unity Bank' },
  { code: '035',    name: 'Wema Bank' },
  { code: '057',    name: 'Zenith Bank' },
  { code: '304',    name: 'Opay' },
  { code: '305',    name: 'Palmpay' },
  { code: '090115', name: 'Moniepoint' },
  { code: '000026', name: 'Kuda Bank' },
  { code: '090267', name: 'Carbon' },
];

// ─── Transaction Fees ────────────────────────────────────────
export const TRANSACTION_FEES = {
  INTERNAL_TRANSFER_FLAT: 0,          // VOPayX-to-VOPayX is free
  BANK_WITHDRAWAL_NGN_FLAT: 50,       // ₦50 flat for NGN withdrawals
  INTERNATIONAL_TRANSFER_PERCENT: 0.015,  // 1.5%
  FX_SPREAD_PERCENT: 0.02,           // 2% FX spread
  CARD_PROCESSING_PERCENT: 0.015,    // 1.5% card processing
} as const;

// ─── Transfer Limits ─────────────────────────────────────────
export const LIMITS = {
  MIN_TRANSFER_AMOUNT_NGN: 100,
  MIN_TRANSFER_AMOUNT_USD: 1,
  MAX_TRANSFER_UNVERIFIED_NGN: 50_000,
  MAX_TRANSFER_VERIFIED_NGN: 5_000_000,
  MAX_DAILY_WITHDRAWAL_NGN: 2_000_000,
  OTP_EXPIRY_MINUTES: 10,
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  REFRESH_TOKEN_DAYS: 7,
  ACCESS_TOKEN_MINUTES: 15,
} as const;

// ─── Payment Providers ───────────────────────────────────────
export const PAYMENT_PROVIDERS = {
  FLUTTERWAVE: 'FLUTTERWAVE',
  PAYSTACK: 'PAYSTACK',
  INTERNAL: 'INTERNAL',
} as const;

// ─── Routing Rules ───────────────────────────────────────────
// VOPayX acts as a financial orchestration layer
// routing to the best available provider per context
export const ROUTING_RULES = {
  NGN_CARD_PAYMENT:       ['PAYSTACK', 'FLUTTERWAVE'],
  NGN_BANK_TRANSFER:      ['FLUTTERWAVE', 'PAYSTACK'],
  INTERNATIONAL_PAYOUT:   ['FLUTTERWAVE'],
  BUSINESS_SETTLEMENT:    ['FLUTTERWAVE', 'PAYSTACK'],
  REFUND:                 ['PAYSTACK', 'FLUTTERWAVE'],
} as const;

// ─── App Constants ───────────────────────────────────────────
export const APP = {
  NAME: 'VOPayX',
  FULL_NAME: 'VORTEX PAY X',
  TAGLINE: 'Global Payments Without Borders',
  POWERED_BY: 'AyoHost',
  SUPPORT_EMAIL: 'support@vopay.com',
  WEBSITE: 'https://vopay.com',
  TWITTER: 'https://twitter.com/vopay_x',
} as const;

// ─── KYC Document Types ──────────────────────────────────────
export const KYC_DOCUMENT_TYPES = [
  { value: 'NIN', label: 'National Identification Number (NIN)' },
  { value: 'BVN', label: 'Bank Verification Number (BVN)' },
  { value: 'PASSPORT', label: 'International Passport' },
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'VOTERS_CARD', label: "Voter's Card" },
] as const;

// ─── Notification Types ──────────────────────────────────────
export const NOTIFICATION_TYPES = {
  TRANSFER:   'TRANSFER',
  DEPOSIT:    'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  KYC:        'KYC',
  SECURITY:   'SECURITY',
  SYSTEM:     'SYSTEM',
} as const;
