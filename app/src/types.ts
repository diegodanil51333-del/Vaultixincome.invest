export interface User {
  userId: string;
  accountId: string;
  username: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'USER';
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  balance: number;
  totalDeposits: number;
  totalInvestments: number;
  totalProfitLoss: number;
  referralCode: string;
  referredByUsername?: string;
  createdAt: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  asset: string;
  dailyYield: number;
  minDeposit: number;
  maxDeposit: number;
  lockDays: number;
  riskLevel: 'Conservative' | 'Moderate' | 'High Yield';
  description: string;
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
  status: 'ACTIVE' | 'COMPLETED';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'YIELD' | 'REFERRAL_REWARD' | 'ADMIN_CREDIT' | 'ADMIN_DEBIT';
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  timestamp: string;
  note: string;
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
  adminUsername: string;
  targetUsername: string;
  action: string;
  details: string;
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
