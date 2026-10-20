import { User, InvestmentPlan, UserInvestment, Transaction, Invitation, AuditLog } from './types';

const USERS_KEY = 'vaultix_users_v1';
const INVESTMENTS_KEY = 'vaultix_investments_v1';
const TRANSACTIONS_KEY = 'vaultix_transactions_v1';
const INVITATIONS_KEY = 'vaultix_invitations_v1';
const AUDIT_LOGS_KEY = 'vaultix_audit_v1';
const SESSION_KEY = 'vaultix_session_v1';

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: 'plan_btc_yield',
    name: 'Bitcoin Alpha Vault',
    asset: 'BTC',
    dailyYield: 1.8,
    minDeposit: 250,
    maxDeposit: 50000,
    lockDays: 14,
    riskLevel: 'Conservative',
    description: 'Algorithmic yield generation backed by BTC spot and options arbitrage.'
  },
  {
    id: 'plan_eth_staking',
    name: 'Ethereum Staking Plus',
    asset: 'ETH',
    dailyYield: 2.4,
    minDeposit: 500,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Moderate',
    description: 'Liquid staking rewards combined with automated MEV capture strategies.'
  },
  {
    id: 'plan_sol_growth',
    name: 'Solana High Growth Vault',
    asset: 'SOL',
    dailyYield: 3.1,
    minDeposit: 100,
    maxDeposit: 25000,
    lockDays: 7,
    riskLevel: 'High Yield',
    description: 'High-frequency liquidity provisioning across Solana DEX pools.'
  },
  {
    id: 'plan_multi_asset',
    name: 'Multi-Asset Income Strategy',
    asset: 'USDT/USDC',
    dailyYield: 1.5,
    minDeposit: 100,
    maxDeposit: 250000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: 'Stablecoin delta-neutral yield farming with instant liquidity access.'
  }
];

export function initializeDatabase() {
  const existingUsers = localStorage.getItem(USERS_KEY);
  if (!existingUsers) {
    const seedAdmin: User = {
      userId: 'USR-000001',
      accountId: 'VX-100001',
      username: 'vaultix_admin',
      fullName: 'Vaultix Team Administrator',
      email: 'vaultixincometeam@outlook.com',
      passwordHash: 'VaultixAdmin2026!Secured',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      balance: 250000.0,
      totalDeposits: 250000.0,
      totalInvestments: 100000.0,
      totalProfitLoss: 34500.0,
      referralCode: 'VXREF-ADMIN',
      createdAt: new Date().toISOString()
    };

    const seedUser: User = {
      userId: 'USR-000002',
      accountId: 'VX-100002',
      username: 'testuser01',
      fullName: 'Alexander Vault',
      email: 'alexander@vaultix.com',
      passwordHash: 'password123',
      role: 'USER',
      accountStatus: 'ACTIVE',
      balance: 1250.0,
      totalDeposits: 1000.0,
      totalInvestments: 500.0,
      totalProfitLoss: 125.0,
      referralCode: 'VXREF-8921',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(USERS_KEY, JSON.stringify([seedAdmin, seedUser]));

    const seedTransactions: Transaction[] = [
      {
        id: 'TX-9001',
        userId: seedUser.userId,
        type: 'DEPOSIT',
        amount: 1000.0,
        status: 'COMPLETED',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        note: 'Initial Crypto Deposit'
      },
      {
        id: 'TX-9002',
        userId: seedUser.userId,
        type: 'REFERRAL_REWARD',
        amount: 25.0,
        status: 'COMPLETED',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        note: 'Referral Bonus Received'
      }
    ];
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(seedTransactions));

    const seedInvestments: UserInvestment[] = [
      {
        id: 'INV-101',
        userId: seedUser.userId,
        planId: 'plan_btc_yield',
        planName: 'Bitcoin Alpha Vault',
        asset: 'BTC',
        amount: 500.0,
        dailyReturn: 9.0,
        startDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'ACTIVE'
      }
    ];
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(seedInvestments));
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify([]));
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify([]));
  }
}

// Database Helpers
export function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getTransactions(): Transaction[] {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTransactions(txs: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
}

export function getInvestments(): UserInvestment[] {
  const data = localStorage.getItem(INVESTMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveInvestments(invs: UserInvestment[]) {
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(invs));
}

export function getInvitations(): Invitation[] {
  const data = localStorage.getItem(INVITATIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveInvitations(invs: Invitation[]) {
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invs));
}

export function getAuditLogs(): AuditLog[] {
  const data = localStorage.getItem(AUDIT_LOGS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveAuditLogs(logs: AuditLog[]) {
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
}

export function getCurrentSession(): User | null {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveCurrentSession(user: User | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}
