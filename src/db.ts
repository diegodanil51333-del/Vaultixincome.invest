import { User, CryptoWalletConfig, ReferralConfig, InvestmentPlan, UserInvestment, Transaction, Invitation, AuditLog } from './types';
import { auth, db, doc, setDoc, getDoc, collection, onSnapshot, cleanFirestoreData, onAuthStateChanged, query, where, updateDoc, runTransaction } from './firebase';
import { cryptoPriceService } from './services/cryptoPriceService';

const USERS_KEY = 'vaultix_users_v13';
const TRANSACTIONS_KEY = 'vaultix_transactions_v13';
const INVESTMENTS_KEY = 'vaultix_investments_v13';
const INVITATIONS_KEY = 'vaultix_invitations_v13';
const AUDIT_LOGS_KEY = 'vaultix_audit_v13';
const WALLETS_KEY = 'vaultix_wallets_v13';
const REFERRAL_CONFIG_KEY = 'vaultix_ref_config_v13';
const PLANS_KEY = 'vaultix_plans_v13';
const SESSION_KEY = 'vaultix_session_v13';

// System Default Configurations
export const DEFAULT_WALLETS: CryptoWalletConfig[] = [
  {
    symbol: 'USDT',
    name: 'Tether USD',
    network: 'TRC20 (Tron)',
    address: 'TY8z2K9M1VxL4P7Qn3R5s6W9X2m1A3B4C5',
    instructions: 'Send USDT via Tron (TRC20) network only. 1 network confirmation required.',
    isActive: true
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin Native (SegWit)',
    address: 'bc1q9v8a7x6w5e4r3t2y1u0i9o8p7l6k5j4h3g2f1',
    instructions: 'Send Native BTC to this address. Credits after 1 network confirmation.',
    isActive: true
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'ERC20 (Ethereum Mainnet)',
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    instructions: 'Send ETH via Ethereum Mainnet (ERC20).',
    isActive: true
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana Native',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    instructions: 'Send SOL via Solana Native network.',
    isActive: true
  },
  {
    symbol: 'XRP',
    name: 'XRP (Ripple)',
    network: 'XRP Ledger (XRPL)',
    address: 'rEb8TK3gGKwB247y1b82K269ALX83LqJ5x',
    destinationTag: '908124',
    instructions: 'CRITICAL: Include Destination Tag 908124 when depositing XRP to ensure automatic credit.',
    isActive: true
  }
];

export const DEFAULT_REFERRAL_CONFIG: ReferralConfig = {
  bonusAmount: 3.0,
  signupBonusAmount: 2.0,
  withdrawalThreshold: 50.0,
  isActive: true
};

export const DEFAULT_INVESTMENT_PLANS: InvestmentPlan[] = [
  // --- EXISTING VAULT PLANS (UNCHANGED) ---
  {
    id: 'plan_starter',
    name: 'Micro Starter Vault',
    asset: 'USDT/USD',
    dailyYield: 1.2,
    minDeposit: 10,
    maxDeposit: 1000,
    lockDays: 7,
    riskLevel: 'Conservative',
    description: 'Beginner-friendly yield strategy starting at $10 with daily liquidity.',
    isActive: true,
    category: 'CRYPTO_VAULT'
  },
  {
    id: 'plan_btc_yield',
    name: 'Bitcoin Alpha Vault',
    asset: 'BTC',
    dailyYield: 1.8,
    minDeposit: 250,
    maxDeposit: 50000,
    lockDays: 14,
    riskLevel: 'Conservative',
    description: 'Algorithmic yield generation backed by BTC spot and options arbitrage.',
    isActive: true,
    category: 'CRYPTO_VAULT'
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
    description: 'Liquid staking rewards combined with automated MEV capture strategies.',
    isActive: true,
    category: 'CRYPTO_VAULT'
  },
  {
    id: 'plan_xrp_growth',
    name: 'XRP Cross-Border Liquidity',
    asset: 'XRP',
    dailyYield: 2.8,
    minDeposit: 100,
    maxDeposit: 75000,
    lockDays: 14,
    riskLevel: 'Moderate',
    description: 'Automated XRPL liquidity pool routing and arbitrage vault.',
    isActive: true,
    category: 'CRYPTO_VAULT'
  },
  {
    id: 'plan_multi_asset',
    name: 'Multi-Asset Institutional Income',
    asset: 'USDT/USDC',
    dailyYield: 3.5,
    minDeposit: 1000,
    maxDeposit: 250000,
    lockDays: 60,
    riskLevel: 'Moderate',
    description: 'Institutional-grade yield compounding across multi-token liquidity protocols.',
    isActive: true,
    category: 'CRYPTO_VAULT'
  },

  // --- VVIP INVESTMENT PLANS ---
  {
    id: 'plan_vvip_1',
    name: 'VVIP Executive Tier 1 Plan',
    asset: 'USD/USDT',
    dailyYield: 0.67, // ~20% total return over 30 days
    minDeposit: 10000,
    maxDeposit: 50000,
    lockDays: 30,
    riskLevel: 'VVIP Executive',
    description: 'Exclusive VVIP investment strategy with fixed 20% return over a 1-month term ($10,000–$50,000).',
    isActive: true,
    category: 'VVIP_PLAN'
  },
  {
    id: 'plan_vvip_2',
    name: 'VVIP Institutional Tier 2 Plan',
    asset: 'USD/USDT',
    dailyYield: 1.33, // ~40% total return over 30 days
    minDeposit: 50000,
    maxDeposit: 1000000,
    lockDays: 30,
    riskLevel: 'VVIP Executive',
    description: 'High-capital institutional VVIP vault offering fixed 40% return over a 1-month term ($50,000–$1,000,000).',
    isActive: true,
    category: 'VVIP_PLAN'
  },

  // --- STOCK INVESTMENT SECTION (20 MAJOR COMPANIES) ---
  {
    id: 'stock_nvda',
    name: 'NVIDIA Corporation',
    asset: 'USD',
    dailyYield: 1.5,
    minDeposit: 500,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Moderate',
    description: 'AI chips, data centers, and accelerated computing infrastructure.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'NVDA',
    sector: 'Semiconductors & AI'
  },
  {
    id: 'stock_aapl',
    name: 'Apple Inc.',
    asset: 'USD',
    dailyYield: 0.8,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: 'iPhone, computers, wearables, and ecosystem services.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'AAPL',
    sector: 'Consumer Electronics'
  },
  {
    id: 'stock_msft',
    name: 'Microsoft Corporation',
    asset: 'USD',
    dailyYield: 0.9,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: 'Software, Azure cloud computing, productivity, and enterprise AI.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'MSFT',
    sector: 'Software & Cloud'
  },
  {
    id: 'stock_amzn',
    name: 'Amazon.com Inc.',
    asset: 'USD',
    dailyYield: 1.1,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Moderate',
    description: 'E-commerce marketplace, AWS cloud infrastructure, and AI logistics.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'AMZN',
    sector: 'E-Commerce & Cloud'
  },
  {
    id: 'stock_googl',
    name: 'Alphabet Inc. (Google)',
    asset: 'USD',
    dailyYield: 1.0,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: 'Search engine, YouTube digital advertising, Google Cloud, and AI innovation.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'GOOGL',
    sector: 'Digital Advertising & AI'
  },
  {
    id: 'stock_meta',
    name: 'Meta Platforms Inc.',
    asset: 'USD',
    dailyYield: 1.2,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Moderate',
    description: 'Facebook, Instagram, WhatsApp social networking, and AI advertising algorithms.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'META',
    sector: 'Social Media & AI'
  },
  {
    id: 'stock_tsla',
    name: 'Tesla Inc.',
    asset: 'USD',
    dailyYield: 1.6,
    minDeposit: 300,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'High Yield',
    description: 'Electric vehicles, solar energy storage, autonomous driving, and robotics.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'TSLA',
    sector: 'EV & Clean Energy'
  },
  {
    id: 'stock_avgo',
    name: 'Broadcom Inc.',
    asset: 'USD',
    dailyYield: 1.3,
    minDeposit: 300,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Moderate',
    description: 'Semiconductors, networking, and enterprise infrastructure software.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'AVGO',
    sector: 'Semiconductors'
  },
  {
    id: 'stock_tsm',
    name: 'Taiwan Semiconductor Manufacturing (TSMC)',
    asset: 'USD',
    dailyYield: 1.2,
    minDeposit: 300,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Moderate',
    description: 'World leading semiconductor foundry manufacturing advanced chips for global tech.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'TSM',
    sector: 'Semiconductor Manufacturing'
  },
  {
    id: 'stock_amd',
    name: 'Advanced Micro Devices (AMD)',
    asset: 'USD',
    dailyYield: 1.4,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Moderate',
    description: 'High-performance CPUs, GPUs, gaming hardware, and AI data center accelerators.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'AMD',
    sector: 'CPUs & AI Hardware'
  },
  {
    id: 'stock_brk',
    name: 'Berkshire Hathaway Inc.',
    asset: 'USD',
    dailyYield: 0.7,
    minDeposit: 500,
    maxDeposit: 250000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: "Warren Buffett's premier conglomerate holding company with diversified value assets.",
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'BRK.B',
    sector: 'Diversified Financials'
  },
  {
    id: 'stock_jpm',
    name: 'JPMorgan Chase & Co.',
    asset: 'USD',
    dailyYield: 0.8,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: 'Global institutional finance, investment management, and financial services.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'JPM',
    sector: 'Financial Services'
  },
  {
    id: 'stock_v',
    name: 'Visa Inc.',
    asset: 'USD',
    dailyYield: 0.8,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: 'Worldwide digital payment processing network and fintech infrastructure.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'V',
    sector: 'Payment Networks'
  },
  {
    id: 'stock_wmt',
    name: 'Walmart Inc.',
    asset: 'USD',
    dailyYield: 0.7,
    minDeposit: 200,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: 'Global retail chain, e-commerce supply chain, and consumer staples network.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'WMT',
    sector: 'Consumer Retail'
  },
  {
    id: 'stock_nflx',
    name: 'Netflix Inc.',
    asset: 'USD',
    dailyYield: 1.3,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Moderate',
    description: 'Global subscription video streaming service and original media production.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'NFLX',
    sector: 'Digital Entertainment'
  },
  {
    id: 'stock_ko',
    name: 'The Coca-Cola Company',
    asset: 'USD',
    dailyYield: 0.6,
    minDeposit: 100,
    maxDeposit: 50000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: 'Global beverage manufacturer and brand distribution network.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'KO',
    sector: 'Consumer Staples'
  },
  {
    id: 'stock_mcd',
    name: "McDonald's Corporation",
    asset: 'USD',
    dailyYield: 0.7,
    minDeposit: 200,
    maxDeposit: 50000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: 'Global quick-service restaurant franchise chain and real estate portfolio.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'MCD',
    sector: 'Restaurants & Real Estate'
  },
  {
    id: 'stock_nke',
    name: 'NIKE Inc.',
    asset: 'USD',
    dailyYield: 0.9,
    minDeposit: 150,
    maxDeposit: 50000,
    lockDays: 30,
    riskLevel: 'Moderate',
    description: 'Athletic footwear, apparel, sports equipment, and global direct-to-consumer sales.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'NKE',
    sector: 'Sportswear & Apparel'
  },
  {
    id: 'stock_orcl',
    name: 'Oracle Corporation',
    asset: 'USD',
    dailyYield: 1.1,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Moderate',
    description: 'Database management, enterprise cloud applications, and AI infrastructure.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'ORCL',
    sector: 'Enterprise Cloud Technology'
  },
  {
    id: 'stock_xom',
    name: 'Exxon Mobil Corporation',
    asset: 'USD',
    dailyYield: 0.9,
    minDeposit: 250,
    maxDeposit: 100000,
    lockDays: 30,
    riskLevel: 'Conservative',
    description: 'Energy exploration, oil refining, petrochemical manufacturing, and power.',
    isActive: true,
    category: 'STOCK_PLAN',
    ticker: 'XOM',
    sector: 'Energy & Resources'
  }
];

// Preserved Initial System Admin Account metadata
export const SYSTEM_ADMIN_ACCOUNT: User = {
  userId: 'USR-000001',
  accountId: 'VX-100001',
  username: 'vaultix_admin',
  fullName: 'Vaultix Administrator',
  email: 'vaultixincometeam@outlook.com',
  role: 'ADMIN',
  accountStatus: 'ACTIVE',
  balance: 0.0,
  referralEarnings: 0.0,
  totalDeposits: 0.0,
  totalInvestments: 0.0,
  totalProfitLoss: 0.0,
  referralCode: 'VXREF-ADMIN',
  createdAt: '2026-01-01T00:00:00.000Z'
};

export const SEED_ACCOUNTS: User[] = [
  SYSTEM_ADMIN_ACCOUNT,
  {
    userId: 'USR-009865',
    accountId: 'VX-986501',
    username: 'crypto_whale',
    fullName: 'Robert Sterling',
    email: 'robert.sterling@vaultix.pro',
    role: 'USER',
    accountStatus: 'ACTIVE',
    balance: 15078.0,
    referralEarnings: 45.0,
    bonusBalance: 0.0,
    totalDeposits: 20000.0,
    totalInvestments: 5000.0,
    totalProfitLoss: 1250.0,
    referralCode: 'VXREF-9865',
    createdAt: '2026-01-15T10:00:00.000Z'
  },
  {
    userId: 'USR-003316',
    accountId: 'VX-331601',
    username: 'alex_trader',
    fullName: 'Alex Morgan',
    email: 'alex.m@vaultix.pro',
    role: 'USER',
    accountStatus: 'ACTIVE',
    balance: 5200.0,
    referralEarnings: 20.0,
    bonusBalance: 0.0,
    totalDeposits: 8000.0,
    totalInvestments: 3000.0,
    totalProfitLoss: 450.0,
    referralCode: 'VXREF-3316',
    createdAt: '2026-02-01T12:00:00.000Z'
  }
];
export const SEED_TRANSACTIONS: Transaction[] = [];

async function syncUsersToFirestore(users: User[]) {
  const currentUid = auth.currentUser?.uid;
  const isCurrentAdmin = auth.currentUser?.email?.toLowerCase() === 'vaultixincometeam@outlook.com';
  for (const u of users) {
    if (u.userId && (isCurrentAdmin || u.userId === currentUid)) {
      try {
        await setDoc(doc(db, 'users', u.userId), cleanFirestoreData(u), { merge: true });
      } catch (err) {
        console.error(`Error syncing user ${u.userId} to Firestore:`, err);
      }
    }
  }
}

async function syncTxsToFirestore(txs: Transaction[]) {
  const currentUid = auth.currentUser?.uid;
  const isCurrentAdmin = auth.currentUser?.email?.toLowerCase() === 'vaultixincometeam@outlook.com';
  for (const t of txs) {
    if (t.id && (isCurrentAdmin || (t.userId === currentUid && t.status === 'PENDING'))) {
      try {
        await setDoc(doc(db, 'transactions', t.id), cleanFirestoreData(t), { merge: true });
      } catch (err) {
        console.error(`Error syncing transaction ${t.id} to Firestore:`, err);
      }
    }
  }
}

let firestoreListenersInitialized = false;
let unsubscribeUsers: (() => void) | null = null;
let unsubscribeTxs: (() => void) | null = null;
let unsubscribeInvs: (() => void) | null = null;

export function initFirestoreListeners() {
  if (firestoreListenersInitialized || typeof window === 'undefined') return;
  firestoreListenersInitialized = true;

  try {
    onAuthStateChanged(auth, (currentUser: any) => {
      // Clean up previous listeners if any
      if (unsubscribeUsers) {
        unsubscribeUsers();
        unsubscribeUsers = null;
      }
      if (unsubscribeTxs) {
        unsubscribeTxs();
        unsubscribeTxs = null;
      }
      if (unsubscribeInvs) {
        unsubscribeInvs();
        unsubscribeInvs = null;
      }

      if (!currentUser) {
        // Visitor is unauthenticated; do not poll protected private collections
        return;
      }

      const isAdmin = currentUser.email?.toLowerCase() === 'vaultixincometeam@outlook.com';

      if (isAdmin) {
        // Administrator: Real-time listener for ALL users and ALL transactions
        try {
          unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot: any) => {
            if (snapshot) {
              const firestoreUsers: User[] = [];
              snapshot.forEach((docSnap: any) => {
                const data = docSnap.data() as User;
                if (data && data.userId) {
                  firestoreUsers.push(data);
                }
              });

              const localUsers = getUsersLocal();
              const userMap = new Map<string, User>();
              firestoreUsers.forEach((f) => userMap.set(f.userId, f));
              localUsers.forEach((l) => {
                const fsUser = userMap.get(l.userId);
                if (fsUser) {
                  userMap.set(l.userId, {
                    ...fsUser,
                    bonusBalance: Math.max(l.bonusBalance || 0, fsUser.bonusBalance || 0),
                    referralEarnings: Math.max(l.referralEarnings || 0, fsUser.referralEarnings || 0),
                    hasReceivedSignupBonus: Boolean(l.hasReceivedSignupBonus || fsUser.hasReceivedSignupBonus),
                    hasReceivedFirstDepositBonus: Boolean(l.hasReceivedFirstDepositBonus || fsUser.hasReceivedFirstDepositBonus),
                  });
                } else {
                  userMap.set(l.userId, l);
                }
              });
              const merged = Array.from(userMap.values());
              localStorage.setItem(USERS_KEY, JSON.stringify(merged));
              emitDataUpdateEvents('users');
            }
          }, (err: any) => {
            console.warn('Admin users snapshot listener warning:', err.message);
          });

          unsubscribeTxs = onSnapshot(collection(db, 'transactions'), (snapshot: any) => {
            if (snapshot) {
              const firestoreTxs: Transaction[] = [];
              snapshot.forEach((docSnap: any) => {
                const data = docSnap.data() as Transaction;
                if (data && data.id) {
                  firestoreTxs.push(data);
                }
              });

              const localTxs = getTransactionsLocal();
              const txMap = new Map<string, Transaction>();
              firestoreTxs.forEach((f) => txMap.set(f.id, f));
              localTxs.forEach((l) => {
                if (!txMap.has(l.id)) {
                  txMap.set(l.id, l);
                }
              });
              const mergedTxs = Array.from(txMap.values());
              mergedTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(mergedTxs));
              emitDataUpdateEvents('txs');
            }
          }, (err: any) => {
            console.warn('Admin transactions snapshot listener warning:', err.message);
          });

          unsubscribeInvs = onSnapshot(collection(db, 'investments'), (snapshot: any) => {
            if (snapshot) {
              const firestoreInvs: UserInvestment[] = [];
              snapshot.forEach((docSnap: any) => {
                const data = docSnap.data() as UserInvestment;
                if (data && data.id) {
                  firestoreInvs.push(data);
                }
              });

              const localInvs = getInvestmentsLocal();
              const invMap = new Map<string, UserInvestment>();
              firestoreInvs.forEach((inv) => invMap.set(inv.id, inv));
              localInvs.forEach((inv) => {
                if (!invMap.has(inv.id)) {
                  invMap.set(inv.id, inv);
                }
              });
              const merged = Array.from(invMap.values());
              localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(merged));
              emitDataUpdateEvents('investments');
            }
          }, (err: any) => {
            console.warn('Admin investments snapshot listener warning:', err.message);
          });
        } catch (adminErr: any) {
          console.warn('Admin listeners setup exception:', adminErr);
        }
      } else {
        // Ordinary User: Real-time listener scoped strictly to OWN user document, OWN transactions, and OWN investments
        try {
          unsubscribeUsers = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap: any) => {
            if (docSnap && docSnap.exists()) {
              const myData = docSnap.data() as User;
              const currentList = getUsersLocal();
              const idx = currentList.findIndex(u => u.userId === myData.userId);
              if (idx >= 0) {
                const localUser = currentList[idx];
                const activeInvs = getInvestmentsLocal()
                  .filter(inv => inv.userId === myData.userId && inv.status === 'ACTIVE');
                const localActiveDeployed = activeInvs.reduce((sum, inv) => sum + inv.amount, 0);

                const cloudTotalInvestments = myData.totalInvestments || 0;
                const localTotalInvestments = localUser.totalInvestments || 0;
                const pendingInvestmentDeduction = Math.max(0, localTotalInvestments - cloudTotalInvestments);
                const baseBalance = typeof myData.balance === 'number' ? myData.balance : (localUser.balance || 0);
                const reconciledBalance = Math.max(0, baseBalance - pendingInvestmentDeduction);

                const reconciledUser: User = {
                  ...myData,
                  balance: reconciledBalance,
                  totalInvestments: Math.max(localTotalInvestments, cloudTotalInvestments, localActiveDeployed),
                  bonusBalance: Math.max(localUser.bonusBalance || 0, myData.bonusBalance || 0),
                  referralEarnings: Math.max(localUser.referralEarnings || 0, myData.referralEarnings || 0),
                  hasReceivedSignupBonus: Boolean(localUser.hasReceivedSignupBonus || myData.hasReceivedSignupBonus),
                  hasReceivedFirstDepositBonus: Boolean(localUser.hasReceivedFirstDepositBonus || myData.hasReceivedFirstDepositBonus),
                  referredBy: myData.referredBy || localUser.referredBy,
                  referredByUsername: myData.referredByUsername || localUser.referredByUsername,
                  referredByDisplayName: myData.referredByDisplayName || localUser.referredByDisplayName
                };
                currentList[idx] = reconciledUser;

                const currSess = getCurrentSession();
                const hasMatchingEmail = Boolean(currSess?.email && myData?.email && typeof currSess.email === 'string' && typeof myData.email === 'string' && currSess.email.toLowerCase() === myData.email.toLowerCase());
                if (currSess && (currSess.userId === myData.userId || hasMatchingEmail)) {
                  saveCurrentSession({ ...currSess, ...reconciledUser });
                }
              } else {
                currentList.push(myData);
              }
              localStorage.setItem(USERS_KEY, JSON.stringify(currentList));
              emitDataUpdateEvents('users');
            }
          }, (err: any) => {
            console.warn('User own profile snapshot listener warning:', err.message);
          });

          const userTxsQuery = query(collection(db, 'transactions'), where('userId', '==', currentUser.uid));
          unsubscribeTxs = onSnapshot(userTxsQuery, (snapshot: any) => {
            if (snapshot) {
              const cloudTxs: Transaction[] = [];
              snapshot.forEach((d: any) => {
                const data = d.data() as Transaction;
                if (data && data.id) {
                  cloudTxs.push(data);
                }
              });

              // Merge cloud transactions with existing local transactions
              const localTxs = getTransactionsLocal();
              const txMap = new Map<string, Transaction>();
              cloudTxs.forEach((t) => txMap.set(t.id, t));
              localTxs.forEach((t) => {
                const matchedCloud = t.idempotencyKey
                  ? cloudTxs.find((ct) => ct.idempotencyKey === t.idempotencyKey || ct.id === t.id)
                  : cloudTxs.find((ct) => ct.id === t.id);
                if (!matchedCloud && !txMap.has(t.id)) {
                  txMap.set(t.id, t);
                }
              });
              const mergedTxs = Array.from(txMap.values());
              mergedTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

              localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(mergedTxs));
              emitDataUpdateEvents('txs');
            }
          }, (err: any) => {
            console.warn('User own transactions snapshot listener warning:', err.message);
          });

          const userInvsQuery = query(collection(db, 'investments'), where('userId', '==', currentUser.uid));
          unsubscribeInvs = onSnapshot(userInvsQuery, (snapshot: any) => {
            if (snapshot) {
              const cloudInvs: UserInvestment[] = [];
              snapshot.forEach((d: any) => {
                const data = d.data() as UserInvestment;
                if (data && data.id) {
                  cloudInvs.push(data);
                }
              });
              const localInvs = getInvestmentsLocal();
              const invMap = new Map<string, UserInvestment>();
              cloudInvs.forEach((inv) => invMap.set(inv.id, inv));
              localInvs.forEach((inv) => {
                if (!invMap.has(inv.id)) {
                  invMap.set(inv.id, inv);
                }
              });
              const merged = Array.from(invMap.values());
              localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(merged));
              emitDataUpdateEvents('investments');
            }
          }, (err: any) => {
            console.warn('User own investments snapshot listener warning:', err.message);
          });
        } catch (userErr: any) {
          console.warn('User listeners setup exception:', userErr);
        }
      }
    });

    // Public System Config Snapshot Listeners (wallets, plans, referral config)
    try {
      onSnapshot(collection(db, 'wallets'), (snapshot: any) => {
        if (snapshot && !snapshot.empty) {
          const cloudWallets: CryptoWalletConfig[] = [];
          snapshot.forEach((d: any) => {
            const data = d.data() as CryptoWalletConfig;
            if (data && data.symbol) cloudWallets.push(data);
          });
          if (cloudWallets.length > 0) {
            localStorage.setItem(WALLETS_KEY, JSON.stringify(cloudWallets));
            emitDataUpdateEvents('wallets');
          }
        }
      }, (err: any) => {
        console.warn('Wallets snapshot warning:', err.message);
      });

      onSnapshot(collection(db, 'plans'), (snapshot: any) => {
        if (snapshot && !snapshot.empty) {
          const cloudPlans: InvestmentPlan[] = [];
          snapshot.forEach((d: any) => {
            const data = d.data() as InvestmentPlan;
            if (data && data.id) cloudPlans.push(data);
          });
          if (cloudPlans.length > 0) {
            localStorage.setItem(PLANS_KEY, JSON.stringify(cloudPlans));
            emitDataUpdateEvents('plans');
          }
        }
      }, (err: any) => {
        console.warn('Plans snapshot warning:', err.message);
      });

      onSnapshot(doc(db, 'referral_config', 'default'), (docSnap: any) => {
        if (docSnap && docSnap.exists()) {
          const cfg = docSnap.data() as ReferralConfig;
          localStorage.setItem(REFERRAL_CONFIG_KEY, JSON.stringify(cfg));
          emitDataUpdateEvents('referral_config');
        }
      }, (err: any) => {
        console.warn('Referral config snapshot warning:', err.message);
      });
    } catch (pubErr) {
      console.warn('Public system config listeners exception:', pubErr);
    }
  } catch (err) {
    console.error('Firestore listeners initialization exception:', err);
  }
}

export function initializeDatabase() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_ACCOUNTS));
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SEED_TRANSACTIONS));
    localStorage.setItem(INVESTMENTS_KEY, JSON.stringify([]));
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify([]));
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify([]));
    localStorage.setItem(WALLETS_KEY, JSON.stringify(DEFAULT_WALLETS));
    localStorage.setItem(REFERRAL_CONFIG_KEY, JSON.stringify(DEFAULT_REFERRAL_CONFIG));
    localStorage.setItem(PLANS_KEY, JSON.stringify(DEFAULT_INVESTMENT_PLANS));
  }
  initFirestoreListeners();
}

// Helper to emit real-time window update events across components and tabs
function emitDataUpdateEvents(type: 'users' | 'txs' | 'investments' | 'wallets' | 'plans' | 'referral_config' | 'all' = 'all') {
  try {
    if (typeof window !== 'undefined') {
      if (type === 'users' || type === 'all') {
        window.dispatchEvent(new CustomEvent('vaultix_users_updated'));
      }
      if (type === 'txs' || type === 'all') {
        window.dispatchEvent(new CustomEvent('vaultix_txs_updated'));
      }
      if (type === 'investments' || type === 'all') {
        window.dispatchEvent(new CustomEvent('vaultix_investments_updated'));
      }
      if (type === 'wallets' || type === 'all') {
        window.dispatchEvent(new CustomEvent('vaultix_wallets_updated'));
      }
      if (type === 'plans' || type === 'all') {
        window.dispatchEvent(new CustomEvent('vaultix_plans_updated'));
      }
      if (type === 'referral_config' || type === 'all') {
        window.dispatchEvent(new CustomEvent('vaultix_referral_config_updated'));
      }
    }
  } catch {
    // Fallback
  }
}

// --- LOCAL & GLOBAL DATA ACCESSORS ---

function getUsersLocal(): User[] {
  try {
    const d = localStorage.getItem(USERS_KEY);
    const parsed: User[] = d ? JSON.parse(d) : [];
    const map = new Map<string, User>();
    parsed.forEach((p) => {
      if (p.userId) map.set(p.userId, p);
    });
    return Array.from(map.values());
  } catch {
    return [];
  }
}

export function getUsers(): User[] {
  processMaturedInvestments();
  return getUsersLocal();
}

export function saveUsers(users: User[], syncToCloud = true) {
  const current = getUsersLocal();
  const map = new Map<string, User>();
  current.forEach((u) => {
    if (u?.userId) map.set(u.userId, u);
  });
  users.forEach((u) => {
    if (u?.userId) {
      const existing = map.get(u.userId);
      if (existing) {
        map.set(u.userId, { ...existing, ...u });
      } else {
        map.set(u.userId, u);
      }
    }
  });
  const merged = Array.from(map.values());
  localStorage.setItem(USERS_KEY, JSON.stringify(merged));
  if (syncToCloud) {
    syncUsersToFirestore(merged);
  }
  emitDataUpdateEvents('users');
}

export function processRegistrationBonuses(
  newUser: User,
  referrerUser?: User | null
): { newUser: User; referrerUser?: User; transactions: Transaction[] } {
  const newTxs: Transaction[] = [];
  const refConfig = getReferralConfig();

  if (refConfig.isActive === false) {
    return { newUser, referrerUser: referrerUser || undefined, transactions: [] };
  }

  const welcomeBonusAmt = refConfig.signupBonusAmount || 2.0;
  const referrerRewardAmt = refConfig.bonusAmount || 3.0;

  const allTxs = getTransactionsLocal();
  const currentUsers = getUsersLocal();

  // Self-referral prevention guard
  const isSelf = Boolean(
    referrerUser && (
      (referrerUser.userId && newUser.userId && referrerUser.userId === newUser.userId) ||
      (referrerUser?.username && newUser?.username && typeof referrerUser.username === 'string' && typeof newUser.username === 'string' && referrerUser.username.toLowerCase() === newUser.username.toLowerCase()) ||
      (referrerUser?.email && newUser?.email && typeof referrerUser.email === 'string' && typeof newUser.email === 'string' && referrerUser.email.toLowerCase() === newUser.email.toLowerCase())
    )
  );

  if (referrerUser && !isSelf) {
    // 1. Welcome Bonus for new user ($2.00 into bonusBalance)
    const signupIdempKey = `SIGNUP-BONUS-${newUser.userId}`;
    const alreadyCreditedSignup = newUser.hasReceivedSignupBonus || allTxs.some((t) => t.idempotencyKey === signupIdempKey);

    if (!alreadyCreditedSignup) {
      newUser.bonusBalance = Math.round(((newUser.bonusBalance || 0) + welcomeBonusAmt) * 100) / 100;
      newUser.hasReceivedSignupBonus = true;

      const userBonusTx: Transaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: newUser.userId,
        type: 'REFERRAL_REWARD',
        amount: welcomeBonusAmt,
        currency: 'USD',
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        idempotencyKey: signupIdempKey,
        note: `Referral Welcome Bonus ($${welcomeBonusAmt.toFixed(2)})`
      };
      allTxs.unshift(userBonusTx);
      newTxs.push(userBonusTx);
    }

    // 2. Referral Reward for referrer ($3.00 into bonusBalance & referralEarnings)
    const refRewardIdempKey = `REF-REWARD-${referrerUser.userId}-${newUser.userId}`;
    const alreadyCreditedRef = allTxs.some((t) => t.idempotencyKey === refRewardIdempKey);

    const rIdx = currentUsers.findIndex((u) => u.userId === referrerUser.userId || u.username === referrerUser.username);
    const targetReferrer = rIdx !== -1 ? currentUsers[rIdx] : referrerUser;

    if (!alreadyCreditedRef && targetReferrer) {
      targetReferrer.bonusBalance = Math.round(((targetReferrer.bonusBalance || 0) + referrerRewardAmt) * 100) / 100;
      targetReferrer.referralEarnings = Math.round(((targetReferrer.referralEarnings || 0) + referrerRewardAmt) * 100) / 100;

      const refRewardTx: Transaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: targetReferrer.userId,
        type: 'REFERRAL_REWARD',
        amount: referrerRewardAmt,
        currency: 'USD',
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        idempotencyKey: refRewardIdempKey,
        note: `Referral Reward for registration of @${newUser.username} ($${referrerRewardAmt.toFixed(2)})`
      };
      allTxs.unshift(refRewardTx);
      newTxs.push(refRewardTx);

      if (rIdx !== -1) {
        currentUsers[rIdx] = targetReferrer;
      } else {
        currentUsers.push(targetReferrer);
      }

      // Sync referrer bonus update to Cloud Firestore
      try {
        setDoc(doc(db, 'users', targetReferrer.userId), cleanFirestoreData(targetReferrer), { merge: true }).catch(() => {});
      } catch {
        // Fallback
      }
    }
  }

  // Sync new user bonus update to Cloud Firestore
  try {
    setDoc(doc(db, 'users', newUser.userId), cleanFirestoreData(newUser), { merge: true }).catch(() => {});
  } catch {
    // Fallback
  }

  // Sync any generated bonus transactions to Cloud Firestore
  for (const bTx of newTxs) {
    try {
      setDoc(doc(db, 'transactions', bTx.id), cleanFirestoreData(bTx), { merge: true }).catch(() => {});
    } catch {}
  }

  // Update new user in currentUsers
  const uIdx = currentUsers.findIndex((u) => u.userId === newUser.userId);
  if (uIdx !== -1) {
    currentUsers[uIdx] = newUser;
  } else {
    currentUsers.push(newUser);
  }

  saveUsers(currentUsers);
  saveTransactions(allTxs);
  saveCurrentSession(newUser);

  emitDataUpdateEvents('users');
  emitDataUpdateEvents('txs');

  return {
    newUser,
    referrerUser: referrerUser || undefined,
    transactions: newTxs
  };
}

function getTransactionsLocal(): Transaction[] {
  try {
    const d = localStorage.getItem(TRANSACTIONS_KEY);
    return d ? JSON.parse(d) : [];
  } catch {
    return [];
  }
}

export function getTransactions(): Transaction[] {
  return getTransactionsLocal();
}

export function saveTransactions(txs: Transaction[], syncToCloud = true) {
  const current = getTransactionsLocal();
  const map = new Map<string, Transaction>();
  current.forEach((t) => {
    if (t?.id) map.set(t.id, t);
  });
  txs.forEach((t) => {
    if (t?.id) {
      const existing = map.get(t.id);
      if (existing) {
        map.set(t.id, { ...existing, ...t });
      } else {
        map.set(t.id, t);
      }
    }
  });
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(merged));
  if (syncToCloud) {
    syncTxsToFirestore(merged);
  }
  emitDataUpdateEvents('txs');
}

function getInvestmentsLocal(): UserInvestment[] {
  try {
    const d = localStorage.getItem(INVESTMENTS_KEY);
    return d ? JSON.parse(d) : [];
  } catch {
    return [];
  }
}

export function getInvestments(): UserInvestment[] {
  return getInvestmentsLocal();
}

export function saveInvestments(invs: UserInvestment[], syncToCloud = true) {
  const current = getInvestmentsLocal();
  const map = new Map<string, UserInvestment>();
  current.forEach((i) => {
    if (i?.id) map.set(i.id, i);
  });
  invs.forEach((i) => {
    if (i?.id) {
      const existing = map.get(i.id);
      if (existing) {
        map.set(i.id, { ...existing, ...i });
      } else {
        map.set(i.id, i);
      }
    }
  });
  const merged = Array.from(map.values());
  localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(merged));
  if (syncToCloud) {
    syncInvestmentsToFirestore(merged);
  }
  emitDataUpdateEvents('investments');
}

async function syncInvestmentsToFirestore(invs: UserInvestment[]) {
  try {
    for (const inv of invs.slice(0, 50)) {
      await setDoc(doc(db, 'investments', inv.id), cleanFirestoreData(inv), { merge: true });
    }
  } catch (err) {
    console.warn('Error syncing investments to Firestore:', err);
  }
}

export function getInvitations(): Invitation[] {
  try {
    const d = localStorage.getItem(INVITATIONS_KEY);
    return d ? JSON.parse(d) : [];
  } catch {
    return [];
  }
}

export function saveInvitations(invs: Invitation[]) {
  localStorage.setItem(INVITATIONS_KEY, JSON.stringify(invs));
}

export function getAuditLogs(): AuditLog[] {
  try {
    const d = localStorage.getItem(AUDIT_LOGS_KEY);
    return d ? JSON.parse(d) : [];
  } catch {
    return [];
  }
}

export function saveAuditLogs(logs: AuditLog[]) {
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
}

function getWalletsLocal(): CryptoWalletConfig[] {
  try {
    const d = localStorage.getItem(WALLETS_KEY);
    return d ? JSON.parse(d) : DEFAULT_WALLETS;
  } catch {
    return DEFAULT_WALLETS;
  }
}

export function getWallets(): CryptoWalletConfig[] {
  return getWalletsLocal();
}

export function saveWallets(wallets: CryptoWalletConfig[]) {
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
  emitDataUpdateEvents('wallets');
  try {
    for (const w of wallets) {
      setDoc(doc(db, 'wallets', w.symbol), cleanFirestoreData(w)).catch(() => {});
    }
  } catch {}
}

function getReferralConfigLocal(): ReferralConfig {
  try {
    const d = localStorage.getItem(REFERRAL_CONFIG_KEY);
    return d ? JSON.parse(d) : DEFAULT_REFERRAL_CONFIG;
  } catch {
    return DEFAULT_REFERRAL_CONFIG;
  }
}

export function getReferralConfig(): ReferralConfig {
  return getReferralConfigLocal();
}

export function saveReferralConfig(cfg: ReferralConfig) {
  localStorage.setItem(REFERRAL_CONFIG_KEY, JSON.stringify(cfg));
  emitDataUpdateEvents('referral_config');
  try {
    setDoc(doc(db, 'referral_config', 'default'), cleanFirestoreData(cfg)).catch(() => {});
  } catch {}
}

function getPlansLocal(): InvestmentPlan[] {
  try {
    const d = localStorage.getItem(PLANS_KEY);
    const stored: InvestmentPlan[] = d ? JSON.parse(d) : DEFAULT_INVESTMENT_PLANS;
    const planMap = new Map<string, InvestmentPlan>();
    DEFAULT_INVESTMENT_PLANS.forEach((p) => planMap.set(p.id, p));
    stored.forEach((p) => planMap.set(p.id, p));
    return Array.from(planMap.values());
  } catch {
    return DEFAULT_INVESTMENT_PLANS;
  }
}

export function getPlans(): InvestmentPlan[] {
  return getPlansLocal();
}

export function savePlans(plans: InvestmentPlan[]) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  emitDataUpdateEvents('plans');

  // Immediately recalculate profit returns based on the updated rate across all active plans
  try {
    const invs = getInvestmentsLocal();
    let invsChanged = false;
    for (const inv of invs) {
      if (inv.status === 'ACTIVE') {
        const matchingPlan = plans.find((p) => p.id === inv.planId || p.name === inv.planName);
        if (matchingPlan) {
          const newDailyReturn = Math.round(((inv.amount * matchingPlan.dailyYield) / 100) * 100) / 100;
          if (inv.dailyReturn !== newDailyReturn) {
            inv.dailyReturn = newDailyReturn;
            invsChanged = true;
            try {
              setDoc(doc(db, 'investments', inv.id), cleanFirestoreData(inv), { merge: true }).catch(() => {});
            } catch {
              // Fallback
            }
          }
        }
      }
    }
    if (invsChanged) {
      saveInvestments(invs, false);
      emitDataUpdateEvents('investments');
    }
  } catch (err) {
    console.warn('Could not recalculate active investment rates:', err);
  }

  try {
    for (const p of plans) {
      setDoc(doc(db, 'plans', p.id), cleanFirestoreData(p)).catch(() => {});
    }
  } catch {}
}

// --- TRIPLE-BACKED INDESTRUCTIBLE SESSION PERSISTENCE ENGINE ---

function getCookie(name: string): string | null {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  } catch {
    // Ignore cookie read failures
  }
  return null;
}

export function getCurrentSession(): User | null {
  let sessionRaw: string | null = null;

  try {
    sessionRaw = localStorage.getItem(SESSION_KEY);
    if (!sessionRaw) {
      sessionRaw = sessionStorage.getItem(SESSION_KEY);
    }
    if (!sessionRaw) {
      sessionRaw = getCookie(SESSION_KEY);
    }
  } catch {
    sessionRaw = getCookie(SESSION_KEY);
  }

  if (!sessionRaw) return null;

  try {
    const sessionUser: User = JSON.parse(sessionRaw);
    if (!sessionUser || (!sessionUser.userId && !sessionUser.email && !sessionUser.username)) return null;

    const users = getUsersLocal();
    const sUserId = sessionUser?.userId;
    const sEmail = sessionUser?.email && typeof sessionUser.email === 'string' ? sessionUser.email.toLowerCase() : '';
    const sUsername = sessionUser?.username && typeof sessionUser.username === 'string' ? sessionUser.username.toLowerCase() : '';

    const freshUser = users.find(
      (u) =>
        Boolean(u?.userId && sUserId && u.userId === sUserId) ||
        Boolean(u?.email && sEmail && typeof u.email === 'string' && u.email.toLowerCase() === sEmail) ||
        Boolean(u?.username && sUsername && typeof u.username === 'string' && u.username.toLowerCase() === sUsername)
    );
    return freshUser || sessionUser;
  } catch {
    return null;
  }
}

export function saveCurrentSession(user: User | null) {
  if (user) {
    if (
      user.email?.toLowerCase() === 'diegodaniel4401@gmail.com' ||
      user.username?.toLowerCase() === 'diegodaniel4401'
    ) {
      user.role = 'USER';
    }

    const jsonStr = JSON.stringify(user);
    try {
      localStorage.setItem(SESSION_KEY, jsonStr);
      sessionStorage.setItem(SESSION_KEY, jsonStr);
      document.cookie = `${SESSION_KEY}=${encodeURIComponent(jsonStr)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Fallback
    }
  } else {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } catch {
      // Fallback
    }
  }
}

// --- AUTOMATIC INVESTMENT MATURITY, LOCK & ACCRUAL ENGINE ---

export function validateWithdrawal(user: User, investment: UserInvestment): { success: boolean; message?: string } {
  // Check account suspension status
  if (user.accountStatus === 'SUSPENDED') {
    throw new Error('Your account has been suspended. Kindly contact support.');
  }

  // Check if maturity date has been reached
  const currentTime = Date.now();
  const startDateMs = new Date(investment.startDate).getTime();
  const maturityTime = startDateMs + investment.durationDays * 86400000;

  if (currentTime < maturityTime) {
    const daysRemaining = Math.ceil((maturityTime - currentTime) / 86400000);
    throw new Error(`Your investment is locked until the selected maturity date (${investment.durationDays} Days lock term, ~${daysRemaining} day(s) remaining).`);
  }

  return { success: true };
}

export function processMaturedInvestments() {
  try {
    const invsStr = localStorage.getItem(INVESTMENTS_KEY);
    if (!invsStr) return;

    const invs: UserInvestment[] = JSON.parse(invsStr);
    const activeInvs = invs.filter((inv) => inv.status === 'ACTIVE');

    if (activeInvs.length === 0) return;

    const usersStr = localStorage.getItem(USERS_KEY);
    if (!usersStr) return;
    const users: User[] = JSON.parse(usersStr);

    const txsStr = localStorage.getItem(TRANSACTIONS_KEY);
    const txs: Transaction[] = txsStr ? JSON.parse(txsStr) : [];

    let changed = false;
    const now = Date.now();

    for (const inv of invs) {
      if (inv.status !== 'ACTIVE') continue;

      const startDateMs = new Date(inv.startDate).getTime();
      const maturityMs = startDateMs + inv.durationDays * 86400000;

      if (now >= maturityMs) {
        const totalProfit = inv.dailyReturn * inv.durationDays;
        const totalReturn = inv.amount + totalProfit;

        inv.status = 'COMPLETED';
        changed = true;

        const userIdx = users.findIndex((u) => u.userId === inv.userId);
        if (userIdx !== -1) {
          users[userIdx].balance += totalReturn;
          users[userIdx].totalProfitLoss += totalProfit;

          txs.unshift({
            id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
            userId: inv.userId,
            type: 'YIELD',
            amount: totalReturn,
            currency: inv.asset,
            status: 'COMPLETED',
            timestamp: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            note: `Investment Matured: Principal $${inv.amount.toFixed(2)} + Profit $${totalProfit.toFixed(2)} Returned`
          });
        }
      }
    }

    if (changed) {
      localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(invs));
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));

      const currSessionUser = getCurrentSession();
      if (currSessionUser) {
        const updatedUser = users.find((u) => u.userId === currSessionUser.userId);
        if (updatedUser) {
          saveCurrentSession(updatedUser);
        }
      }
      emitDataUpdateEvents('all');
    }
  } catch {
    // Fail-safe
  }
}

// --- SERVER-SIDE FINANCIAL TRANSACTIONS ---

export async function submitDeposit(
  user: User,
  amount: number,
  currency: string,
  cryptoAmount?: number,
  txHash?: string,
  idempotencyKey?: string
): Promise<Transaction> {
  const cleanCurrency = currency.toUpperCase().trim();
  const effectiveAmount = amount > 0 ? amount : (cryptoAmount || 0);

  if (effectiveAmount <= 0) {
    throw new Error('Deposit amount must be greater than zero.');
  }

  const cleanHash = txHash?.trim();
  const txs = getTransactionsLocal();

  // Financial Security 1: Enforce blockchain transaction hash uniqueness (prevents hash reuse)
  if (cleanHash) {
    const existingWithHash = txs.find(
      (t) => t.txHash && t.txHash.toLowerCase() === cleanHash.toLowerCase()
    );
    if (existingWithHash) {
      throw new Error(`This blockchain transaction hash (${cleanHash}) has already been registered on Vaultix Income.`);
    }
  }

  // Financial Security 2: Idempotent submission lock
  if (idempotencyKey) {
    const existingIdemp = txs.find((t) => t.idempotencyKey === idempotencyKey);
    if (existingIdemp) {
      return existingIdemp;
    }
  }

  // Financial Security 3: Prevent duplicate pending deposits within 15 seconds
  const recentDuplicate = txs.find(
    (t) =>
      t.userId === user.userId &&
      t.type === 'DEPOSIT' &&
      t.status === 'PENDING' &&
      t.currency === cleanCurrency &&
      Math.abs(t.amount - effectiveAmount) < 0.0001 &&
      Date.now() - new Date(t.timestamp).getTime() < 15000
  );
  if (recentDuplicate) {
    return recentDuplicate;
  }

  const txId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;

  // Calculate live USD valuation estimate
  let estimatedUsd = effectiveAmount;
  let livePrice = 1.0;
  if (cleanCurrency !== 'USD' && cleanCurrency !== 'USDT') {
    try {
      livePrice = await cryptoPriceService.getPrice(cleanCurrency);
      estimatedUsd = effectiveAmount * livePrice;
    } catch {
      // Fallback
    }
  }

  const newTx: Transaction = {
    id: txId,
    userId: user.userId,
    type: 'DEPOSIT',
    amount: effectiveAmount,
    currency: cleanCurrency,
    cryptoAmount: cryptoAmount || (cleanCurrency !== 'USD' && cleanCurrency !== 'USDT' ? effectiveAmount : undefined),
    cryptoAsset: cleanCurrency,
    usdValuation: estimatedUsd,
    priceUsed: livePrice,
    priceTimestamp: new Date().toISOString(),
    txHash: cleanHash || undefined,
    idempotencyKey: idempotencyKey || undefined,
    status: 'PENDING',
    timestamp: new Date().toISOString(),
    note: cleanHash
      ? `Deposit request #${txId} of ${effectiveAmount} ${cleanCurrency} (TxHash: ${cleanHash.slice(0, 16)}...) submitted! Status: PENDING`
      : `Deposit request #${txId} of ${effectiveAmount} ${cleanCurrency} submitted! Status: PENDING`
  };

  // Direct Cloud Database write
  await setDoc(doc(db, 'transactions', newTx.id), cleanFirestoreData(newTx));

  txs.unshift(newTx);
  saveTransactions(txs);
  return newTx;
}

// Permanent set of completed financial operations to prevent duplicate execution across retries
const completedTransactionOperations = new Set<string>();

// In-memory set to prevent concurrent executions within the same client session
const activeDepositApprovals = new Set<string>();

export async function approveDepositTransaction(
  adminUser: User,
  transactionId: string,
  verifiedCryptoAmount?: number,
  verifiedPrice?: number
): Promise<{ user: User; tx: Transaction }> {
  if (adminUser.role !== 'ADMIN') {
    throw new Error('UNAUTHORIZED: Admin privileges required to approve deposits.');
  }

  if (completedTransactionOperations.has(transactionId)) {
    throw new Error(`TRANSACTION TERMINAL: Transaction ${transactionId} has already been approved and credited.`);
  }

  if (activeDepositApprovals.has(transactionId)) {
    throw new Error(`CONCURRENT OPERATION: Approval for deposit ${transactionId} is currently being processed.`);
  }
  activeDepositApprovals.add(transactionId);

  try {
    const txs = getTransactionsLocal();
    const txIdx = txs.findIndex((t) => t.id === transactionId);

    if (txIdx === -1) {
      throw new Error('Transaction not found.');
    }

    const localTx = txs[txIdx];
    if (localTx.status !== 'PENDING') {
      completedTransactionOperations.add(transactionId);
      throw new Error(`TRANSACTION TERMINAL: Transaction ${transactionId} is already ${localTx.status}.`);
    }

    const cleanCurrency = (localTx.currency || 'USDT').toUpperCase().trim();
    const effectiveCryptoAmt = verifiedCryptoAmount || localTx.cryptoAmount || localTx.amount;
    let finalPrice = verifiedPrice || localTx.priceUsed || 1.0;

    if (cleanCurrency !== 'USD' && cleanCurrency !== 'USDT') {
      try {
        if (!verifiedPrice) {
          finalPrice = await cryptoPriceService.getPrice(cleanCurrency);
        }
      } catch {
        // Use fallback
      }
    } else {
      finalPrice = 1.0;
    }

    const usdValuation = cleanCurrency === 'USD' || cleanCurrency === 'USDT'
      ? effectiveCryptoAmt
      : effectiveCryptoAmt * finalPrice;

    // ATOMIC FIRESTORE TRANSACTION:
    // Guarantees transaction is PENDING in cloud ledger before applying ANY balance credit,
    // updates status to APPROVED atomically, and generates cashback/bonuses idempotently.
    const atomicResult = await runTransaction(db, async (firestoreTx) => {
      const txRef = doc(db, 'transactions', transactionId);
      const cloudTxDoc = await firestoreTx.get(txRef);

      if (!cloudTxDoc.exists()) {
        throw new Error(`TRANSACTION NOT FOUND: Transaction ${transactionId} does not exist in cloud database.`);
      }

      const cloudTxData = cloudTxDoc.data() as Transaction;
      if (cloudTxData.status !== 'PENDING') {
        throw new Error(`TRANSACTION TERMINAL: Transaction ${transactionId} is already ${cloudTxData.status}.`);
      }

      const userRef = doc(db, 'users', cloudTxData.userId);
      const userDoc = await firestoreTx.get(userRef);

      if (!userDoc.exists()) {
        throw new Error(`USER NOT FOUND: Target user account ${cloudTxData.userId} does not exist in cloud database.`);
      }

      const cloudUserData = userDoc.data() as User;
      const targetUser: User = { ...cloudUserData };
      const oldBalance = targetUser.balance || 0;

      const targetTx: Transaction = {
        ...cloudTxData,
        status: 'APPROVED',
        processedAt: new Date().toISOString(),
        cryptoAmount: effectiveCryptoAmt,
        cryptoAsset: cleanCurrency,
        priceUsed: finalPrice,
        usdValuation: usdValuation,
        priceTimestamp: new Date().toISOString(),
        note: `Deposit ${transactionId} approved! Credited $${usdValuation.toFixed(2)} (${effectiveCryptoAmt} ${cleanCurrency} @ $${finalPrice.toFixed(2)}).`
      };

      // Credit user active balance and total deposits
      targetUser.balance = (targetUser.balance || 0) + usdValuation;
      targetUser.totalDeposits = (targetUser.totalDeposits || 0) + usdValuation;

      const extraTransactions: Transaction[] = [];

      // First-Deposit Cashback (Exact 0.5% on first deposit, awarded strictly once)
      if (!targetUser.hasReceivedFirstDepositBonus) {
        const cashbackAmount = parseFloat((usdValuation * 0.005).toFixed(2));
        targetUser.hasReceivedFirstDepositBonus = true;

        if (cashbackAmount > 0) {
          targetUser.balance += cashbackAmount;

          const cashbackTxId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
          const cashbackTx: Transaction = {
            id: cashbackTxId,
            userId: targetUser.userId,
            type: 'FIRST_DEPOSIT_BONUS',
            amount: cashbackAmount,
            currency: 'USD',
            status: 'COMPLETED',
            timestamp: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            relatedDepositId: targetTx.id,
            note: `0.5% First-Deposit Cashback on Deposit #${targetTx.id} ($${cashbackAmount.toFixed(2)})`
          };
          extraTransactions.push(cashbackTx);

          targetTx.cashbackAwarded = true;
          targetTx.cashbackRate = 0.005;
          targetTx.cashbackAmount = cashbackAmount;
          targetTx.cashbackTxId = cashbackTxId;
        } else {
          targetTx.cashbackAwarded = false;
        }
      } else {
        targetTx.cashbackAwarded = false;
      }

      // Referral Signup Bonuses ($2 for new user to bonusBalance, $3 for direct referrer to bonusBalance & referralEarnings)
      let referrerUserToSave: User | null = null;
      if ((targetUser.referredBy || targetUser.referredByUsername) && !targetUser.hasReceivedSignupBonus) {
        targetUser.bonusBalance = (targetUser.bonusBalance || 0) + 2.0;
        targetUser.hasReceivedSignupBonus = true;

        const userSignupBonusTx: Transaction = {
          id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: targetUser.userId,
          type: 'REFERRAL_REWARD',
          amount: 2.0,
          currency: 'USD',
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          processedAt: new Date().toISOString(),
          note: `Referral Signup Welcome Bonus ($2.00)`
        };
        extraTransactions.push(userSignupBonusTx);

        // Fetch referrer document inside transaction if possible
        const referrerId = targetUser.referredBy;
        if (referrerId) {
          const referrerRef = doc(db, 'users', referrerId);
          const referrerDoc = await firestoreTx.get(referrerRef);
          if (referrerDoc.exists()) {
            const referrerData = referrerDoc.data() as User;
            referrerUserToSave = { ...referrerData };
            referrerUserToSave.bonusBalance = (referrerUserToSave.bonusBalance || 0) + 3.0;
            referrerUserToSave.referralEarnings = (referrerUserToSave.referralEarnings || 0) + 3.0;

            const referrerBonusTx: Transaction = {
              id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
              userId: referrerUserToSave.userId,
              type: 'REFERRAL_REWARD',
              amount: 3.0,
              currency: 'USD',
              status: 'COMPLETED',
              timestamp: new Date().toISOString(),
              processedAt: new Date().toISOString(),
              note: `Referral Bonus for verified signup of @${targetUser.username} ($3.00)`
            };
            extraTransactions.push(referrerBonusTx);
            firestoreTx.set(referrerRef, cleanFirestoreData(referrerUserToSave), { merge: true });
          }
        }
      }

      // Commit atomic writes
      firestoreTx.set(txRef, cleanFirestoreData(targetTx));
      firestoreTx.set(userRef, cleanFirestoreData(targetUser));

      for (const bonus of extraTransactions) {
        const bonusRef = doc(db, 'transactions', bonus.id);
        firestoreTx.set(bonusRef, cleanFirestoreData(bonus));
      }

      return {
        user: targetUser,
        tx: targetTx,
        extraTransactions,
        referrerUserToSave,
        oldBalance
      };
    });

    // Synchronize local cache with the verified atomic database outcome
    const updatedUsers = getUsersLocal();
    const uIndex = updatedUsers.findIndex((u) => u.userId === atomicResult.user.userId);
    if (uIndex !== -1) {
      updatedUsers[uIndex] = atomicResult.user;
    } else {
      updatedUsers.push(atomicResult.user);
    }

    if (atomicResult.referrerUserToSave) {
      const rIndex = updatedUsers.findIndex((u) => u.userId === atomicResult.referrerUserToSave!.userId);
      if (rIndex !== -1) {
        updatedUsers[rIndex] = atomicResult.referrerUserToSave;
      }
    }
    saveUsers(updatedUsers);

    const updatedTxs = getTransactionsLocal();
    const tIndex = updatedTxs.findIndex((t) => t.id === atomicResult.tx.id);
    if (tIndex !== -1) {
      updatedTxs[tIndex] = atomicResult.tx;
    } else {
      updatedTxs.unshift(atomicResult.tx);
    }

    for (const bonus of atomicResult.extraTransactions) {
      if (!updatedTxs.some((t) => t.id === bonus.id)) {
        updatedTxs.unshift(bonus);
      }
    }
    saveTransactions(updatedTxs);

    const currentSession = getCurrentSession();
    if (currentSession?.userId === atomicResult.user.userId) {
      saveCurrentSession(atomicResult.user);
    }

    const logs = getAuditLogs();
    logs.unshift({
      id: `AUDIT-${Math.floor(10000 + Math.random() * 90000)}`,
      adminId: adminUser.userId,
      action: 'DEPOSIT_APPROVED',
      targetUserId: atomicResult.user.userId,
      targetUsername: atomicResult.user.username,
      transactionId: atomicResult.tx.id,
      previousValue: `$${atomicResult.oldBalance.toFixed(2)}`,
      newValue: `$${atomicResult.user.balance.toFixed(2)}`,
      timestamp: new Date().toISOString()
    });
    saveAuditLogs(logs);
    completedTransactionOperations.add(transactionId);
    return { user: atomicResult.user, tx: atomicResult.tx };
  } finally {
    activeDepositApprovals.delete(transactionId);
  }
}

export async function rejectDepositTransaction(adminUser: User, transactionId: string, reason?: string): Promise<Transaction> {
  if (adminUser.role !== 'ADMIN') {
    throw new Error('UNAUTHORIZED: Admin privileges required.');
  }

  if (completedTransactionOperations.has(transactionId)) {
    throw new Error(`TRANSACTION TERMINAL: Transaction ${transactionId} has already been processed.`);
  }

  if (activeDepositApprovals.has(transactionId)) {
    throw new Error(`CONCURRENT OPERATION: Deposit ${transactionId} is currently being processed.`);
  }
  activeDepositApprovals.add(transactionId);

  try {
    const txs = getTransactionsLocal();
    const txIdx = txs.findIndex((t) => t.id === transactionId);

    if (txIdx === -1) {
      throw new Error('Transaction not found.');
    }

    const localTx = txs[txIdx];
    if (localTx.status !== 'PENDING') {
      completedTransactionOperations.add(transactionId);
      throw new Error(`TRANSACTION TERMINAL: Transaction ${transactionId} is already ${localTx.status}.`);
    }

    let updatedTx: Transaction = {
      ...localTx,
      status: 'REJECTED',
      processedAt: new Date().toISOString(),
      note: reason ? `Deposit ${transactionId} cancelled: ${reason}` : `Deposit ${transactionId} cancelled.`
    };

    // Atomic Cloud Execution: Ensure deposit is still PENDING in cloud ledger before marking REJECTED
    try {
      await runTransaction(db, async (firestoreTx) => {
        const txRef = doc(db, 'transactions', transactionId);
        const cloudTxDoc = await firestoreTx.get(txRef);
        if (cloudTxDoc.exists()) {
          const cloudTxData = cloudTxDoc.data() as Transaction;
          if (cloudTxData.status !== 'PENDING') {
            throw new Error(`TRANSACTION TERMINAL: Transaction ${transactionId} is already ${cloudTxData.status}.`);
          }
          updatedTx = {
            ...cloudTxData,
            status: 'REJECTED',
            processedAt: new Date().toISOString(),
            note: reason ? `Deposit ${transactionId} cancelled: ${reason}` : `Deposit ${transactionId} cancelled.`
          };
          firestoreTx.set(txRef, cleanFirestoreData(updatedTx));
        } else {
          firestoreTx.set(txRef, cleanFirestoreData(updatedTx));
        }
      });
    } catch (atomicErr: any) {
      if (atomicErr.message && atomicErr.message.includes('TRANSACTION TERMINAL')) {
        completedTransactionOperations.add(transactionId);
        throw atomicErr;
      }
      await setDoc(doc(db, 'transactions', updatedTx.id), cleanFirestoreData(updatedTx));
    }

    txs[txIdx] = updatedTx;
    saveTransactions(txs);

    const logs = getAuditLogs();
    logs.unshift({
      id: `AUDIT-${Math.floor(10000 + Math.random() * 90000)}`,
      adminId: adminUser.userId,
      action: 'DEPOSIT_REJECTED',
      targetUserId: updatedTx.userId,
      targetUsername: updatedTx.userId,
      transactionId: updatedTx.id,
      reason: reason || 'Cancelled',
      timestamp: new Date().toISOString()
    });
    saveAuditLogs(logs);

    completedTransactionOperations.add(transactionId);
    emitDataUpdateEvents('txs');
    emitDataUpdateEvents('users');

    return updatedTx;
  } finally {
    activeDepositApprovals.delete(transactionId);
  }
}

export async function cancelDepositTransaction(adminUser: User, transactionId: string): Promise<Transaction> {
  return await rejectDepositTransaction(adminUser, transactionId, 'Cancelled');
}

export async function cancelOwnPendingDeposit(user: User, transactionId: string): Promise<Transaction> {
  if (activeDepositApprovals.has(transactionId)) {
    throw new Error('CONCURRENT OPERATION: This deposit request is currently being processed.');
  }
  activeDepositApprovals.add(transactionId);

  try {
    const txs = getTransactionsLocal();
    const txIdx = txs.findIndex((t) => t.id === transactionId && t.userId === user.userId);

    if (txIdx === -1) {
      throw new Error('Transaction request not found.');
    }

    const localTx = txs[txIdx];
    if (localTx.status !== 'PENDING') {
      throw new Error('This deposit request is no longer pending and cannot be cancelled.');
    }

    let updatedTx: Transaction = {
      ...localTx,
      status: 'CANCELLED',
      processedAt: new Date().toISOString(),
      note: `Deposit request #${transactionId} cancelled by user.`
    };

    try {
      await runTransaction(db, async (firestoreTx) => {
        const txRef = doc(db, 'transactions', transactionId);
        const cloudTxDoc = await firestoreTx.get(txRef);
        if (cloudTxDoc.exists()) {
          const cloudTxData = cloudTxDoc.data() as Transaction;
          if (cloudTxData.status !== 'PENDING') {
            throw new Error('This deposit request is no longer pending and cannot be cancelled.');
          }
          updatedTx = {
            ...cloudTxData,
            status: 'CANCELLED',
            processedAt: new Date().toISOString(),
            note: `Deposit request #${transactionId} cancelled by user.`
          };
          firestoreTx.set(txRef, cleanFirestoreData(updatedTx));
        } else {
          firestoreTx.set(txRef, cleanFirestoreData(updatedTx));
        }
      });
    } catch (err: any) {
      if (err.message && err.message.includes('longer pending')) {
        throw err;
      }
      await setDoc(doc(db, 'transactions', updatedTx.id), cleanFirestoreData(updatedTx));
    }

    txs[txIdx] = updatedTx;
    saveTransactions(txs);
    emitDataUpdateEvents('txs');

    return updatedTx;
  } finally {
    activeDepositApprovals.delete(transactionId);
  }
}

export function calculateWithdrawalFee(amount: number): { fee: number; netAmount: number } {
  // Required fee rule: Every withdrawal must have a fixed fee of $0.50 USD per withdrawal, regardless of the withdrawal amount.
  const fee = 0.50;
  const netAmount = Math.max(0, Math.round((amount - fee) * 100) / 100);
  return { fee, netAmount };
}

export function getEffectiveDailyReturn(inv: UserInvestment): number {
  const currentPlan = getPlansLocal().find((p) => p.id === inv.planId);
  const effectiveDailyRate = currentPlan?.dailyRate !== undefined ? currentPlan.dailyRate : (currentPlan?.dailyYield !== undefined ? currentPlan.dailyYield : null);
  return effectiveDailyRate !== null ? (inv.amount * effectiveDailyRate) / 100 : inv.dailyReturn;
}

export function getAccruedProfitForInvestment(inv: UserInvestment): number {
  const effectiveDailyReturn = getEffectiveDailyReturn(inv);

  if (inv.status === 'COMPLETED' || inv.status === 'WITHDRAWN' || inv.status === 'WITHDRAWAL_PENDING') {
    return effectiveDailyReturn * inv.durationDays;
  }
  const nowMs = Date.now();
  const startMs = new Date(inv.startDate).getTime();
  const durationMs = inv.durationDays * 86400000;
  const elapsedMs = Math.min(durationMs, Math.max(0, nowMs - startMs));
  const elapsedDays = elapsedMs / 86400000;
  return effectiveDailyReturn * elapsedDays;
}

export async function submitWithdrawalRequest(
  user: User,
  amount: number,
  currency: string,
  destinationAddress: string,
  destinationNetwork: string,
  investmentId?: string,
  idempotencyKey?: string
): Promise<Transaction> {
  if (!amount || amount <= 0) {
    throw new Error('Withdrawal amount must be greater than zero.');
  }

  if (amount <= 0.50) {
    throw new Error('Withdrawal amount must be greater than the fixed fee of $0.50 USD.');
  }

  const txs = getTransactionsLocal();

  // Idempotency / Duplicate Check
  if (idempotencyKey) {
    const existing = txs.find((t) => t.idempotencyKey === idempotencyKey);
    if (existing) return existing;
  }

  // Prevent duplicate withdrawal requests within 15 seconds
  const recentDuplicate = txs.find(
    (t) =>
      t.userId === user.userId &&
      t.type === 'WITHDRAWAL' &&
      t.status === 'PENDING' &&
      Math.abs(t.amount - amount) < 0.0001 &&
      Date.now() - new Date(t.timestamp).getTime() < 15000
  );
  if (recentDuplicate) {
    return recentDuplicate;
  }

  const { fee, netAmount } = calculateWithdrawalFee(amount);

  const txId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
  const newTx: Transaction = {
    id: txId,
    userId: user.userId,
    type: 'WITHDRAWAL',
    amount: amount,
    feeAmount: fee,
    netAmount: netAmount,
    currency: currency,
    status: 'PENDING',
    timestamp: new Date().toISOString(),
    destinationAddress: destinationAddress,
    network: destinationNetwork,
    idempotencyKey: idempotencyKey || undefined,
    note: `Withdrawal request #${txId} of $${amount.toFixed(2)} (Net: $${netAmount.toFixed(2)} after fixed $${fee.toFixed(2)} fee) submitted! Status: PENDING`
  };

  // ATOMIC FIRESTORE TRANSACTION:
  // Verifies cloud user balance and reserves/deducts gross amount while creating the pending transaction.
  const atomicResult = await runTransaction(db, async (firestoreTx) => {
    const userRef = doc(db, 'users', user.userId);
    const userDoc = await firestoreTx.get(userRef);

    if (!userDoc.exists()) {
      throw new Error('User account not found in cloud database.');
    }

    const cloudUser = userDoc.data() as User;
    const currentBalance = typeof cloudUser.balance === 'number' ? cloudUser.balance : 0;

    if (!investmentId && currentBalance < amount) {
      throw new Error(`Insufficient funds. Available balance: $${currentBalance.toFixed(2)}.`);
    }

    const updatedUser: User = {
      ...cloudUser,
      balance: investmentId ? currentBalance : Math.max(0, Math.round((currentBalance - amount) * 100) / 100)
    };

    const txRef = doc(db, 'transactions', newTx.id);
    firestoreTx.set(txRef, cleanFirestoreData(newTx));
    firestoreTx.set(userRef, cleanFirestoreData(updatedUser));

    return { user: updatedUser, tx: newTx };
  });

  const targetUser = atomicResult.user;
  txs.unshift(newTx);
  saveTransactions(txs);

  const users = getUsersLocal();
  const uIdx = users.findIndex((u) => u.userId === user.userId);
  if (uIdx !== -1) {
    users[uIdx] = targetUser;
  } else {
    users.push(targetUser);
  }
  saveUsers(users);
  saveCurrentSession(targetUser);

  return newTx;
}

export async function submitBonusWithdrawalRequest(
  user: User,
  amount: number,
  destinationAddress: string
): Promise<Transaction> {
  if (amount < 50.0) {
    throw new Error('Minimum bonus balance withdrawal threshold is $50.00.');
  }

  const users = getUsersLocal();
  const uIdx = users.findIndex((u) => u.userId === user.userId);
  if (uIdx === -1) {
    throw new Error('User account not found.');
  }

  const targetUser = { ...users[uIdx] };
  const bonusBal = targetUser.bonusBalance || targetUser.referralEarnings || 0;

  if (bonusBal < amount) {
    throw new Error(`Insufficient Bonus Balance. Available: $${bonusBal.toFixed(2)}.`);
  }

  targetUser.bonusBalance = bonusBal - amount;
  targetUser.referralEarnings = Math.max(0, (targetUser.referralEarnings || 0) - amount);

  const txId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
  const newTx: Transaction = {
    id: txId,
    userId: user.userId,
    type: 'BONUS_WITHDRAWAL',
    amount: amount,
    feeAmount: 15.0, // $15 Network Fee
    netAmount: amount,
    currency: 'USD',
    status: 'PENDING',
    timestamp: new Date().toISOString(),
    destinationAddress: destinationAddress,
    note: `Bonus Wallet Withdrawal Request #${txId} of $${amount.toFixed(2)} ($15 Network Fee Confirmed) -> ${destinationAddress}`
  };

  // MANDATORY: Await Cloud Database write for pending transaction
  await setDoc(doc(db, 'transactions', newTx.id), cleanFirestoreData(newTx));

  const txs = getTransactionsLocal();
  txs.unshift(newTx);
  saveTransactions(txs);

  users[uIdx] = targetUser;
  saveUsers(users);
  saveCurrentSession(targetUser);
  return newTx;
}

// In-memory set to prevent concurrent withdrawal approvals
const activeWithdrawalApprovals = new Set<string>();

export async function approveWithdrawalTransaction(adminUser: User, transactionId: string): Promise<{ user: User; tx: Transaction }> {
  if (adminUser.role !== 'ADMIN') {
    throw new Error('UNAUTHORIZED: Admin privileges required.');
  }

  if (activeWithdrawalApprovals.has(transactionId)) {
    throw new Error(`CONCURRENT OPERATION: Withdrawal ${transactionId} is currently being processed.`);
  }
  activeWithdrawalApprovals.add(transactionId);

  try {
    const txs = getTransactionsLocal();
    const txIdx = txs.findIndex((t) => t.id === transactionId);

    if (txIdx === -1) {
      throw new Error('Transaction not found.');
    }

    const localTx = txs[txIdx];
    if (localTx.status !== 'PENDING') {
      throw new Error(`TRANSACTION TERMINAL: Transaction ${transactionId} is already ${localTx.status}.`);
    }

    // Atomic Cloud Execution: Ensure withdrawal is still PENDING before marking APPROVED
    const atomicResult = await runTransaction(db, async (firestoreTx) => {
      const txRef = doc(db, 'transactions', transactionId);
      const cloudTxDoc = await firestoreTx.get(txRef);

      if (!cloudTxDoc.exists()) {
        throw new Error(`TRANSACTION NOT FOUND: Transaction ${transactionId} does not exist in cloud database.`);
      }

      const cloudTxData = cloudTxDoc.data() as Transaction;
      if (cloudTxData.status !== 'PENDING') {
        throw new Error(`TRANSACTION TERMINAL: Transaction ${transactionId} is already ${cloudTxData.status}.`);
      }

      const updatedTx: Transaction = {
        ...cloudTxData,
        status: 'APPROVED',
        processedAt: new Date().toISOString(),
        note: `Withdrawal ${transactionId} approved and processed!`
      };

      firestoreTx.set(txRef, cleanFirestoreData(updatedTx));

      return { tx: updatedTx };
    });

    const targetTx = atomicResult.tx;
    txs[txIdx] = targetTx;
    saveTransactions(txs);

    const users = getUsersLocal();
    const targetUser = users.find((u) => u.userId === targetTx.userId) || { ...adminUser };

    const logs = getAuditLogs();
    logs.unshift({
      id: `AUDIT-${Math.floor(10000 + Math.random() * 90000)}`,
      adminId: adminUser.userId,
      action: 'WITHDRAWAL_APPROVED',
      targetUserId: targetTx.userId,
      targetUsername: targetUser.username || targetTx.userId,
      transactionId: targetTx.id,
      timestamp: new Date().toISOString()
    });
    saveAuditLogs(logs);

    return { user: targetUser, tx: targetTx };
  } finally {
    activeWithdrawalApprovals.delete(transactionId);
  }
}

export async function cancelWithdrawalTransaction(adminUser: User, transactionId: string, reason?: string): Promise<{ user: User; tx: Transaction }> {
  if (adminUser.role !== 'ADMIN') {
    throw new Error('UNAUTHORIZED: Admin privileges required.');
  }

  if (activeWithdrawalApprovals.has(transactionId)) {
    throw new Error(`CONCURRENT OPERATION: Withdrawal ${transactionId} is currently being processed.`);
  }
  activeWithdrawalApprovals.add(transactionId);

  try {
    const txs = getTransactionsLocal();
    const txIdx = txs.findIndex((t) => t.id === transactionId);

    if (txIdx === -1) {
      throw new Error('Transaction not found.');
    }

    const localTx = txs[txIdx];
    if (localTx.status !== 'PENDING') {
      throw new Error(`TRANSACTION TERMINAL: Transaction ${transactionId} is already ${localTx.status}.`);
    }

    // Atomic Cloud Execution: Ensure withdrawal is still PENDING before refunding principal
    const atomicResult = await runTransaction(db, async (firestoreTx) => {
      const txRef = doc(db, 'transactions', transactionId);
      const cloudTxDoc = await firestoreTx.get(txRef);

      if (!cloudTxDoc.exists()) {
        throw new Error(`TRANSACTION NOT FOUND: Transaction ${transactionId} does not exist in cloud database.`);
      }

      const cloudTxData = cloudTxDoc.data() as Transaction;
      if (cloudTxData.status !== 'PENDING') {
        throw new Error(`TRANSACTION TERMINAL: Transaction ${transactionId} is already ${cloudTxData.status}.`);
      }

      const userRef = doc(db, 'users', cloudTxData.userId);
      const userDoc = await firestoreTx.get(userRef);

      let updatedUser: User | null = null;
      if (userDoc.exists()) {
        const cloudUser = userDoc.data() as User;
        updatedUser = { ...cloudUser };

        if (cloudTxData.type === 'BONUS_WITHDRAWAL') {
          updatedUser.bonusBalance = Math.round(((updatedUser.bonusBalance || 0) + cloudTxData.amount) * 100) / 100;
          updatedUser.referralEarnings = Math.round(((updatedUser.referralEarnings || 0) + cloudTxData.amount) * 100) / 100;
        } else {
          updatedUser.balance = Math.round(((updatedUser.balance || 0) + cloudTxData.amount) * 100) / 100;
        }

        firestoreTx.set(userRef, cleanFirestoreData(updatedUser));
      }

      const updatedTx: Transaction = {
        ...cloudTxData,
        status: 'REJECTED',
        processedAt: new Date().toISOString(),
        note: `Withdrawal ${transactionId} cancelled. Principal refunded.`
      };

      firestoreTx.set(txRef, cleanFirestoreData(updatedTx));

      return { tx: updatedTx, user: updatedUser };
    });

    const targetTx = atomicResult.tx;
    txs[txIdx] = targetTx;
    saveTransactions(txs);

    const users = getUsersLocal();
    const uIdx = users.findIndex((u) => u.userId === targetTx.userId);
    let targetUser = atomicResult.user || (uIdx !== -1 ? users[uIdx] : null);

    if (targetUser && uIdx !== -1) {
      users[uIdx] = targetUser;
      saveUsers(users);

      const currentSession = getCurrentSession();
      if (currentSession?.userId === targetUser.userId) {
        saveCurrentSession(targetUser);
      }
    }

    const logs = getAuditLogs();
    logs.unshift({
      id: `AUDIT-${Math.floor(10000 + Math.random() * 90000)}`,
      adminId: adminUser.userId,
      action: 'WITHDRAWAL_REJECTED',
      targetUserId: targetTx.userId,
      targetUsername: targetUser ? targetUser.username : targetTx.userId,
      transactionId: targetTx.id,
      reason: reason || 'Cancelled',
      timestamp: new Date().toISOString()
    });
    saveAuditLogs(logs);

    return { user: targetUser || adminUser, tx: targetTx };
  } finally {
    activeWithdrawalApprovals.delete(transactionId);
  }
}

// In-memory set to prevent concurrent investment subscriptions for the same user
const activeInvestmentSubscriptions = new Set<string>();

export async function subscribeInvestmentPlan(
  user: User,
  planId: string,
  amount: number,
  idempotencyKey?: string
): Promise<{ user: User; investment: UserInvestment }> {
  if (!amount || amount <= 0 || isNaN(amount)) {
    throw new Error('Investment amount must be greater than zero.');
  }

  const plans = getPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) {
    throw new Error('Selected investment plan not found.');
  }

  if (amount < plan.minDeposit || amount > plan.maxDeposit) {
    throw new Error(`Amount must be between $${plan.minDeposit.toLocaleString()} and $${plan.maxDeposit.toLocaleString()} for ${plan.name}.`);
  }

  // Idempotency: Check if this idempotency key was already processed
  if (idempotencyKey) {
    const existing = getInvestmentsLocal().find((inv) => inv.idempotencyKey === idempotencyKey);
    if (existing) {
      return { user, investment: existing };
    }
  }

  // Prevent duplicate investment submissions within 15 seconds
  const recentDuplicate = getInvestmentsLocal().find(
    (inv) =>
      inv.userId === user.userId &&
      inv.planId === planId &&
      Math.abs(inv.amount - amount) < 0.0001 &&
      Date.now() - new Date(inv.startDate).getTime() < 15000
  );
  if (recentDuplicate) {
    return { user, investment: recentDuplicate };
  }

  const currentBalance = typeof user.balance === 'number' ? user.balance : 0;
  if (currentBalance < amount) {
    throw new Error(
      `Insufficient balance. Your available balance is $${currentBalance.toFixed(2)}, but this investment requires $${amount.toFixed(2)}. Please deposit funds or choose a plan within your available balance.`
    );
  }

  if (activeInvestmentSubscriptions.has(user.userId)) {
    throw new Error('CONCURRENT OPERATION: An investment subscription is already in progress for this account. Please wait.');
  }
  activeInvestmentSubscriptions.add(user.userId);

  try {
    const invId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const txId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
    const dailyReturn = amount * (plan.dailyYield / 100);

    const newBalance = Math.max(0, Math.round((currentBalance - amount) * 100) / 100);
    const newTotalInvestments = Math.round(((user.totalInvestments || 0) + amount) * 100) / 100;

    const newInv: UserInvestment = {
      id: invId,
      userId: user.userId,
      planId: plan.id,
      planName: plan.name,
      asset: plan.asset,
      amount: amount,
      dailyReturn: dailyReturn,
      startDate: new Date().toISOString(),
      durationDays: plan.lockDays,
      status: 'ACTIVE',
      idempotencyKey: idempotencyKey || undefined
    };

    const invTx: Transaction = {
      id: txId,
      userId: user.userId,
      type: 'YIELD',
      amount: amount,
      currency: plan.asset,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      idempotencyKey: idempotencyKey || undefined,
      note: `Subscribed to ${plan.name} ($${amount.toFixed(2)})`
    };

    const updatedUser: User = {
      ...user,
      balance: newBalance,
      totalInvestments: newTotalInvestments
    };

    // 1. Direct Cloud Firestore synchronization when user is authenticated
    if (auth.currentUser && auth.currentUser.uid === user.userId) {
      try {
        await setDoc(doc(db, 'investments', newInv.id), cleanFirestoreData(newInv));
      } catch (fsErr) {
        console.warn('Firestore investment sync warning:', fsErr);
      }
      try {
        await updateDoc(doc(db, 'users', user.userId), {
          balance: newBalance,
          totalInvestments: newTotalInvestments
        });
      } catch (fsErr) {
        console.warn('Firestore user balance sync warning:', fsErr);
      }
      try {
        await setDoc(doc(db, 'transactions', invTx.id), cleanFirestoreData(invTx));
      } catch (fsErr) {
        console.warn('Firestore transaction sync warning:', fsErr);
      }
    }

    // 2. Best-effort API synchronization for dev/local backend
    try {
      fetch('/api/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          planId: plan.id,
          planName: plan.name,
          asset: plan.asset,
          amount,
          dailyYield: plan.dailyYield,
          lockDays: plan.lockDays,
          idempotencyKey
        })
      }).catch(() => {});
    } catch {
      // Ignored in static/offline environments
    }

    const targetUser = updatedUser;

    const users = getUsersLocal();
    const uIdx = users.findIndex((u) => u.userId === user.userId);
    if (uIdx !== -1) {
      users[uIdx] = targetUser;
    } else {
      users.push(targetUser);
    }
    saveUsers(users, false);

    const invs = getInvestmentsLocal();
    if (!invs.some((i) => i.id === newInv.id)) {
      invs.unshift(newInv);
      saveInvestments(invs, false);
    }

    const txs = getTransactionsLocal();
    if (!txs.some((t) => t.id === invTx.id)) {
      txs.unshift(invTx);
      saveTransactions(txs, false);
    }

    saveCurrentSession(targetUser);

    const logs = getAuditLogs();
    logs.unshift({
      id: `AUDIT-${Math.floor(10000 + Math.random() * 90000)}`,
      adminId: 'SYSTEM',
      action: 'INVESTMENT_SUBSCRIBED',
      targetUserId: targetUser.userId,
      targetUsername: targetUser.username,
      previousValue: `$${currentBalance.toFixed(2)}`,
      newValue: `$${targetUser.balance.toFixed(2)}`,
      reason: `Subscribed $${amount.toFixed(2)} to ${plan.name} (${newInv.id}) via trusted backend`,
      timestamp: new Date().toISOString()
    });
    saveAuditLogs(logs);

    emitDataUpdateEvents('all');

    // Requirement 5: Dispatch real-time investment notification toast event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('vaultix_investment_toast', {
          detail: {
            username: targetUser.username || user.username,
            amount: amount,
            asset: plan.asset,
            planName: plan.name
          }
        })
      );
    }

    return { user: targetUser, investment: newInv };
  } finally {
    activeInvestmentSubscriptions.delete(user.userId);
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
  const currentUsers = getUsersLocal();
  const idx = currentUsers.findIndex((u) => u.userId === userId);
  if (idx === -1) return null;

  const updatedUser: User = {
    ...currentUsers[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  currentUsers[idx] = updatedUser;
  saveUsers(currentUsers, false);

  const currSess = getCurrentSession();
  if (currSess && currSess.userId === userId) {
    saveCurrentSession(updatedUser);
  }

  // Persist permanently in Cloud Firestore
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, cleanFirestoreData(updatedUser), { merge: true });
  } catch (err) {
    console.warn('Could not sync user profile updates to Firestore:', err);
  }

  emitDataUpdateEvents('users');
  return updatedUser;
}

export function withdrawReferralEarnings(user: User, amount: number): User {
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero.');
  }

  const users = getUsersLocal();
  const uIdx = users.findIndex((u) => u.userId === user.userId);
  if (uIdx === -1) {
    throw new Error('User account not found.');
  }

  const targetUser = users[uIdx];
  if (targetUser.referralEarnings < amount) {
    throw new Error(`Insufficient referral earnings. Available: $${targetUser.referralEarnings.toFixed(2)}.`);
  }

  targetUser.referralEarnings -= amount;
  targetUser.balance += amount;
  users[uIdx] = targetUser;
  saveUsers(users);

  const txs = getTransactionsLocal();
  txs.unshift({
    id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
    userId: user.userId,
    type: 'REFERRAL_REWARD',
    amount: amount,
    currency: 'USD',
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    note: `Transferred $${amount.toFixed(2)} Referral Earnings to Main Balance`
  });
  saveTransactions(txs);

  saveCurrentSession(targetUser);
  return targetUser;
}
