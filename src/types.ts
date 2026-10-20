export interface User {
  userId: string;
  accountId: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  passwordHash?: string;
  role: 'ADMIN' | 'USER';
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  balance: number;
  referralEarnings: number;
  bonusBalance?: number;
  totalDeposits: number;
  totalInvestments: number;
  totalProfitLoss: number;
  referralCode: string;
  referredBy?: string;
  referredByUsername?: string;
  referredByDisplayName?: string;
  hasReceivedFirstDepositBonus?: boolean;
  hasReceivedSignupBonus?: boolean;
  photoURL?: string;
  avatarUrl?: string;
  bio?: string;
  country?: string;
  updatedAt?: string;
  createdAt: string;
}

export interface CryptoWalletConfig {
  symbol: 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'XRP';
  name: string;
  network: string;
  address: string;
  destinationTag?: string;
  instructions: string;
  isActive: boolean;
}

export interface ReferralConfig {
  bonusAmount: number;
  signupBonusAmount?: number;
  withdrawalThreshold: number;
  isActive: boolean;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  asset: string;
  dailyYield: number;
  dailyRate?: number;
  minDeposit: number;
  maxDeposit: number;
  lockDays: number;
  riskLevel: 'Conservative' | 'Moderate' | 'High Yield' | 'VVIP Executive';
  description: string;
  isActive: boolean;
  category?: 'CRYPTO_VAULT' | 'VVIP_PLAN' | 'STOCK_PLAN';
  ticker?: string;
  sector?: string;
}

export interface UserInvestment {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  asset: string;
  amount: number;
  dailyReturn: number;
  startDate: string;
  durationDays: number;
  lastCreditedDaysCount?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'WITHDRAWAL_PENDING' | 'WITHDRAWN';
  idempotencyKey?: string;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'YIELD' | 'REFERRAL_REWARD' | 'FIRST_DEPOSIT_BONUS' | 'BONUS_WITHDRAWAL' | 'ADMIN_CREDIT' | 'ADMIN_DEBIT';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  feeAmount?: number;
  fee?: number;
  netAmount?: number;
  currency: string;
  status: TransactionStatus;
  timestamp: string;
  processedAt?: string;
  destinationAddress?: string;
  network?: string;
  note: string;
  // Cryptocurrency Valuation & Proof of Transfer
  cryptoAmount?: number;
  cryptoAsset?: string;
  usdValuation?: number;
  priceUsed?: number;
  priceTimestamp?: string;
  txHash?: string;
  idempotencyKey?: string;
  referralBonusesAwarded?: boolean;
  cashbackAwarded?: boolean;
  cashbackRate?: number;
  cashbackAmount?: number;
  cashbackTxId?: string;
  relatedDepositId?: string;
}

export interface Invitation {
  id: string;
  inviterUsername: string;
  inviteeUsername: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  timestamp: string;
  rewardClaimed: boolean;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetUserId: string;
  targetUsername: string;
  transactionId?: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
}

export interface CryptoProvider {
  name: string;
  regions: string[];
  paymentMethods: string[];
  supportedCryptos: string[];
  websiteUrl: string;
  tagLine: string;
}
