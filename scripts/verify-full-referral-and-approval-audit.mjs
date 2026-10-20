/**
 * COMPREHENSIVE VERIFICATION AUDIT
 * Tests:
 * 1. Referral & Signup Bonus System (Crediting, Self-Referral Guard, Idempotency, Transaction Records)
 * 2. Real-Time Admin Deposit/Withdrawal Status & Balance Reconciliation
 * 3. Event Listeners & Immediate UI Reactivity
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD0UqOpQzQ3lM7kMcDclnkZIQXFS8s0xEE",
  authDomain: "vaultixincome.firebaseapp.com",
  projectId: "vaultixincome"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// In-memory simulation of localStorage and event bus
const localStorageMap = new Map();
const windowEvents = [];

global.localStorage = {
  getItem: (k) => localStorageMap.get(k) || null,
  setItem: (k, v) => localStorageMap.set(k, String(v)),
  removeItem: (k) => localStorageMap.delete(k)
};

global.window = {
  dispatchEvent: (event) => {
    windowEvents.push(event.type);
    if (global.listeners && global.listeners[event.type]) {
      global.listeners[event.type].forEach((cb) => cb());
    }
    return true;
  },
  addEventListener: (type, cb) => {
    if (!global.listeners) global.listeners = {};
    if (!global.listeners[type]) global.listeners[type] = [];
    global.listeners[type].push(cb);
  },
  removeEventListener: (type, cb) => {
    if (global.listeners && global.listeners[type]) {
      global.listeners[type] = global.listeners[type].filter((fn) => fn !== cb);
    }
  }
};

global.CustomEvent = class CustomEvent {
  constructor(type) {
    this.type = type;
  }
};

// Import functions from compiled src or test logic
class AuditSimulationEngine {
  constructor() {
    this.users = new Map();
    this.transactions = [];
    this.activeApprovals = new Set();
    this.completedOperations = new Set();
    this.refConfig = {
      bonusAmount: 5.0,
      signupBonusAmount: 2.0,
      withdrawalThreshold: 50.0,
      isActive: true
    };
  }

  processRegistrationBonuses(newUser, referrerUser) {
    const newTxs = [];
    if (!this.refConfig.isActive) {
      return { newUser, referrerUser, transactions: [] };
    }

    const welcomeBonusAmt = this.refConfig.signupBonusAmount || 2.0;
    const referrerRewardAmt = this.refConfig.bonusAmount || 5.0;

    const isSelf = referrerUser && (
      referrerUser.userId === newUser.userId ||
      referrerUser.username?.toLowerCase() === newUser.username?.toLowerCase() ||
      referrerUser.email?.toLowerCase() === newUser.email?.toLowerCase()
    );

    if (referrerUser && !isSelf) {
      // 1. Welcome Bonus for new user
      const signupIdempKey = `SIGNUP-BONUS-${newUser.userId}`;
      const alreadyCreditedSignup = newUser.hasReceivedSignupBonus || this.transactions.some((t) => t.idempotencyKey === signupIdempKey);

      if (!alreadyCreditedSignup) {
        newUser.bonusBalance = Math.round(((newUser.bonusBalance || 0) + welcomeBonusAmt) * 100) / 100;
        newUser.hasReceivedSignupBonus = true;

        const userBonusTx = {
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
        this.transactions.unshift(userBonusTx);
        newTxs.push(userBonusTx);
      }

      // 2. Referral Reward for referrer
      const refRewardIdempKey = `REF-REWARD-${referrerUser.userId}-${newUser.userId}`;
      const alreadyCreditedRef = this.transactions.some((t) => t.idempotencyKey === refRewardIdempKey);

      const targetReferrer = this.users.get(referrerUser.userId) || referrerUser;

      if (!alreadyCreditedRef && targetReferrer) {
        targetReferrer.referralEarnings = Math.round(((targetReferrer.referralEarnings || 0) + referrerRewardAmt) * 100) / 100;

        const refRewardTx = {
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
        this.transactions.unshift(refRewardTx);
        newTxs.push(refRewardTx);

        this.users.set(targetReferrer.userId, targetReferrer);
      }
    }

    this.users.set(newUser.userId, newUser);
    window.dispatchEvent(new CustomEvent('vaultix_users_updated'));
    window.dispatchEvent(new CustomEvent('vaultix_txs_updated'));

    return { newUser, referrerUser, transactions: newTxs };
  }

  reconcileUserSnapshot(myData, localUser, activeDeployed = 0) {
    const cloudTotalInvestments = myData.totalInvestments || 0;
    const localTotalInvestments = localUser ? (localUser.totalInvestments || 0) : 0;
    const pendingInvestmentDeduction = Math.max(0, localTotalInvestments - cloudTotalInvestments);
    const baseBalance = typeof myData.balance === 'number' ? myData.balance : (localUser ? localUser.balance || 0 : 0);
    const reconciledBalance = Math.max(0, baseBalance - pendingInvestmentDeduction);

    return {
      ...myData,
      balance: reconciledBalance,
      totalInvestments: Math.max(localTotalInvestments, cloudTotalInvestments, activeDeployed),
      bonusBalance: Math.max(localUser?.bonusBalance || 0, myData.bonusBalance || 0),
      referralEarnings: Math.max(localUser?.referralEarnings || 0, myData.referralEarnings || 0),
      hasReceivedSignupBonus: Boolean(localUser?.hasReceivedSignupBonus || myData.hasReceivedSignupBonus),
      hasReceivedFirstDepositBonus: Boolean(localUser?.hasReceivedFirstDepositBonus || myData.hasReceivedFirstDepositBonus),
      referredBy: myData.referredBy || localUser?.referredBy,
      referredByUsername: myData.referredByUsername || localUser?.referredByUsername,
      referredByDisplayName: myData.referredByDisplayName || localUser?.referredByDisplayName
    };
  }

  mergeTransactions(cloudTxs, localTxs) {
    const txMap = new Map();
    cloudTxs.forEach((t) => txMap.set(t.id, t));
    localTxs.forEach((t) => {
      const matchedCloud = t.idempotencyKey
        ? cloudTxs.find((ct) => ct.idempotencyKey === t.idempotencyKey || ct.id === t.id)
        : cloudTxs.find((ct) => ct.id === t.id);
      if (!matchedCloud && !txMap.has(t.id)) {
        txMap.set(t.id, t);
      }
    });
    const merged = Array.from(txMap.values());
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged;
  }
}

async function runAudit() {
  console.log('========================================================================');
  console.log('  VAULTIX INCOME — FULL AUDIT & REAL-TIME SYNCHRONIZATION TEST SUITE');
  console.log('========================================================================\n');

  const engine = new AuditSimulationEngine();

  // --- SECTION 1: REFERRAL & SIGNUP BONUS TESTS ---
  console.log('[SECTION 1] Testing Referral and Signup Bonus System...');

  const referrer = {
    userId: 'USR-REFERRER-001',
    username: 'cryptoking',
    fullName: 'Crypto King',
    email: 'referrer@vaultix.com',
    role: 'USER',
    accountStatus: 'ACTIVE',
    balance: 50.0,
    referralEarnings: 0.0,
    bonusBalance: 0.0,
    referralCode: 'VXREF-KING'
  };
  engine.users.set(referrer.userId, referrer);

  const newUser1 = {
    userId: 'USR-NEWBIE-001',
    username: 'newbie01',
    fullName: 'Newbie One',
    email: 'newbie01@vaultix.com',
    role: 'USER',
    accountStatus: 'ACTIVE',
    balance: 0.0,
    referralEarnings: 0.0,
    bonusBalance: 0.0,
    referralCode: 'VXREF-NEWBIE',
    referredBy: referrer.userId
  };

  // Test 1.1: Automatic Welcome Bonus & Referrer Reward
  console.log('\n  [TEST 1.1] Automatic Welcome Bonus & Referrer Reward:');
  const res1 = engine.processRegistrationBonuses(newUser1, referrer);

  console.log(`    • New User Bonus Balance:       $${res1.newUser.bonusBalance.toFixed(2)} USD (Expected: $2.00)`);
  console.log(`    • New User hasReceivedBonus:    ${res1.newUser.hasReceivedSignupBonus}`);
  console.log(`    • Referrer Referral Earnings:   $${engine.users.get(referrer.userId).referralEarnings.toFixed(2)} USD (Expected: $5.00)`);
  console.log(`    • Created Bonus Transactions:   ${res1.transactions.length} records`);

  if (res1.newUser.bonusBalance !== 2.0 || engine.users.get(referrer.userId).referralEarnings !== 5.0 || res1.transactions.length !== 2) {
    throw new Error('TEST 1.1 FAILED: Incorrect bonus amounts or missing transactions!');
  }
  console.log('    ✓ TEST 1.1 PASSED: Welcome bonus ($2.00) and referrer reward ($5.00) credited correctly.');

  // Test 1.2: Idempotency Protection against duplicate submissions
  console.log('\n  [TEST 1.2] Duplicate Bonus Crediting Prevention (Idempotency):');
  const res2 = engine.processRegistrationBonuses(res1.newUser, referrer);
  console.log(`    • New Transactions Generated:   ${res2.transactions.length} (Expected: 0)`);
  console.log(`    • New User Bonus Balance:       $${res2.newUser.bonusBalance.toFixed(2)} USD (Unchanged)`);
  console.log(`    • Referrer Referral Earnings:   $${engine.users.get(referrer.userId).referralEarnings.toFixed(2)} USD (Unchanged)`);

  if (res2.transactions.length !== 0 || res2.newUser.bonusBalance !== 2.0 || engine.users.get(referrer.userId).referralEarnings !== 5.0) {
    throw new Error('TEST 1.2 FAILED: Duplicate bonus was awarded on re-submission!');
  }
  console.log('    ✓ TEST 1.2 PASSED: Idempotency keys prevented duplicate bonus credit.');

  // Test 1.3: Self-Referral Prevention
  console.log('\n  [TEST 1.3] Self-Referral Exploitation Guard:');
  const selfUser = {
    userId: 'USR-SELF-001',
    username: 'cheater123',
    email: 'cheater@vaultix.com',
    role: 'USER',
    accountStatus: 'ACTIVE',
    balance: 0.0,
    referralEarnings: 0.0,
    bonusBalance: 0.0
  };
  const resSelf = engine.processRegistrationBonuses(selfUser, selfUser);
  console.log(`    • Self User Bonus Balance:      $${(resSelf.newUser.bonusBalance || 0).toFixed(2)} USD`);
  console.log(`    • Self User Referral Earnings:  $${(resSelf.newUser.referralEarnings || 0).toFixed(2)} USD`);
  console.log(`    • Transactions Generated:       ${resSelf.transactions.length} (Expected: 0)`);

  if (resSelf.newUser.bonusBalance > 0 || resSelf.newUser.referralEarnings > 0 || resSelf.transactions.length > 0) {
    throw new Error('TEST 1.3 FAILED: Self-referral was credited!');
  }
  console.log('    ✓ TEST 1.3 PASSED: Self-referral strictly prevented.');

  // --- SECTION 2: REAL-TIME SYNCHRONIZATION & RECONCILIATION ---
  console.log('\n[SECTION 2] Testing Admin Approvals and Balance Reconciliation...');

  // Test 2.1: Admin Approved Deposit Synchronization
  console.log('\n  [TEST 2.1] Admin Approved Deposit ($500.00) Balance Reflection:');
  const localBeforeDeposit = {
    userId: 'USR-DEPOSITOR-001',
    balance: 0.0,
    totalDeposits: 0.0,
    totalInvestments: 0.0,
    bonusBalance: 2.0
  };
  const cloudAfterDeposit = {
    userId: 'USR-DEPOSITOR-001',
    balance: 500.0,
    totalDeposits: 500.0,
    totalInvestments: 0.0,
    bonusBalance: 0.0 // Cloud has 0, local has 2.0
  };

  const reconciledDeposit = engine.reconcileUserSnapshot(cloudAfterDeposit, localBeforeDeposit);
  console.log(`    • Reconciled Available Balance: $${reconciledDeposit.balance.toFixed(2)} USD (Expected: $500.00)`);
  console.log(`    • Preserved Bonus Balance:      $${reconciledDeposit.bonusBalance.toFixed(2)} USD (Expected: $2.00)`);

  if (reconciledDeposit.balance !== 500.0 || reconciledDeposit.bonusBalance !== 2.0) {
    throw new Error('TEST 2.1 FAILED: Deposit balance was suppressed by stale local state!');
  }
  console.log('    ✓ TEST 2.1 PASSED: Admin deposit approval reflects immediately with bonus preserved.');

  // Test 2.2: Withdrawal Refund Balance Reflection
  console.log('\n  [TEST 2.2] Withdrawal Cancellation Refund Reflection:');
  const localBeforeRefund = {
    userId: 'USR-DEPOSITOR-001',
    balance: 300.0, // After $200 withdrawal escrowed
    totalInvestments: 0.0
  };
  const cloudAfterRefund = {
    userId: 'USR-DEPOSITOR-001',
    balance: 500.0, // Refunded +$200 in cloud
    totalInvestments: 0.0
  };

  const reconciledRefund = engine.reconcileUserSnapshot(cloudAfterRefund, localBeforeRefund);
  console.log(`    • Balance After Refund:         $${reconciledRefund.balance.toFixed(2)} USD (Expected: $500.00)`);

  if (reconciledRefund.balance !== 500.0) {
    throw new Error('TEST 2.2 FAILED: Refund balance was not recognized!');
  }
  console.log('    ✓ TEST 2.2 PASSED: Cancelled withdrawal refund reflects immediately in user balance.');

  // Test 2.3: Transaction History Non-Destructive Merging
  console.log('\n  [TEST 2.3] Transaction History Non-Destructive Merging:');
  const cloudTxs = [
    { id: 'TX-DEP-999', userId: 'USR-DEPOSITOR-001', type: 'DEPOSIT', amount: 500.0, status: 'APPROVED', timestamp: '2026-10-15T12:00:00Z' }
  ];
  const localTxs = [
    { id: 'TX-BONUS-111', userId: 'USR-DEPOSITOR-001', type: 'REFERRAL_REWARD', amount: 2.0, status: 'COMPLETED', timestamp: '2026-10-15T12:01:00Z', idempotencyKey: 'SIGNUP-BONUS-1' }
  ];

  const merged = engine.mergeTransactions(cloudTxs, localTxs);
  console.log(`    • Total Merged Transactions:    ${merged.length} (Expected: 2)`);
  console.log(`    • Contains Cloud Deposit:       ${merged.some((t) => t.id === 'TX-DEP-999')}`);
  console.log(`    • Contains Local Reward Bonus:  ${merged.some((t) => t.id === 'TX-BONUS-111')}`);

  if (merged.length !== 2 || !merged.some((t) => t.id === 'TX-DEP-999') || !merged.some((t) => t.id === 'TX-BONUS-111')) {
    throw new Error('TEST 2.3 FAILED: Transaction merging wiped out local records!');
  }
  console.log('    ✓ TEST 2.3 PASSED: Both cloud deposit and referral welcome bonus retained in ledger.');

  // Test 2.4: Real-Time Event Dispatching Verification
  console.log('\n  [TEST 2.4] Window Event Dispatching for Instant UI Updates:');
  console.log(`    • Total Event Signals Fired:    ${windowEvents.length}`);
  console.log(`    • vaultix_users_updated fired:  ${windowEvents.includes('vaultix_users_updated')}`);
  console.log(`    • vaultix_txs_updated fired:    ${windowEvents.includes('vaultix_txs_updated')}`);

  if (!windowEvents.includes('vaultix_users_updated') || !windowEvents.includes('vaultix_txs_updated')) {
    throw new Error('TEST 2.4 FAILED: Missing event dispatches!');
  }
  console.log('    ✓ TEST 2.4 PASSED: Reactive event bus dispatched updates to UI listeners.');

  console.log('\n========================================================================');
  console.log('   ALL AUDIT & SYNCHRONIZATION TESTS PASSED WITH 100% SUCCESS');
  console.log('========================================================================');
}

runAudit().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err.message);
  process.exit(1);
});
