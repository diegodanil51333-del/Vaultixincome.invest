import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD0UqOpQzQ3lM7kMcDclnkZIQXFS8s0xEE",
  authDomain: "vaultixincome.firebaseapp.com",
  projectId: "vaultixincome",
  storageBucket: "vaultixincome.firebasestorage.app",
  messagingSenderId: "158283505064",
  appId: "1:158283505064:web:d9997660ea2d085386919d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function cleanFirestoreData(data) {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'passwordHash' || key === 'password') continue;
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

async function run() {
  const suffix = Date.now();
  const email = `diag_${suffix}@vaultix-test.com`;
  const cred = await createUserWithEmailAndPassword(auth, email, 'Password123!');
  const uid = cred.user.uid;
  console.log('User UID:', uid);

  // 1. Create user document
  const initialUser = {
    userId: uid,
    accountId: `VX-${Math.floor(100000 + Math.random() * 900000)}`,
    username: `user_${suffix}`,
    fullName: 'Test User',
    email: email,
    role: 'USER',
    accountStatus: 'ACTIVE',
    balance: 0,
    totalDeposits: 0,
    totalInvestments: 0,
    totalProfitLoss: 0,
    referralEarnings: 0,
    bonusBalance: 0,
    referralCode: `VXREF-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'users', uid), cleanFirestoreData(initialUser));
  console.log('User created: PASS');

  // Test A: Can user update profile name?
  try {
    await updateDoc(doc(db, 'users', uid), { fullName: 'Updated Name' });
    console.log('Update fullName: PASS');
  } catch (e) {
    console.log('Update fullName: FAIL', e.code, e.message);
  }

  // Test B: Can user update balance directly?
  try {
    await updateDoc(doc(db, 'users', uid), { balance: 100 });
    console.log('Update balance=100 directly: PASS (Security warning!)');
  } catch (e) {
    console.log('Update balance=100 directly: BLOCKED (Good! Zero trust security)');
  }

  // Test C: Transaction with type: DEPOSIT, status: PENDING
  const txDepositId = `TX-${Date.now()}-DEP`;
  try {
    await setDoc(doc(db, 'transactions', txDepositId), cleanFirestoreData({
      id: txDepositId,
      userId: uid,
      type: 'DEPOSIT',
      amount: 100,
      currency: 'USDT',
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      note: 'Deposit request'
    }));
    console.log('Transaction DEPOSIT PENDING: PASS');
  } catch (e) {
    console.log('Transaction DEPOSIT PENDING: FAIL', e.code, e.message);
  }

  // Test D: Transaction with type: WITHDRAWAL, status: PENDING
  const txWithdrawId = `TX-${Date.now()}-WIT`;
  try {
    await setDoc(doc(db, 'transactions', txWithdrawId), cleanFirestoreData({
      id: txWithdrawId,
      userId: uid,
      type: 'WITHDRAWAL',
      amount: 10,
      currency: 'USDT',
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      note: 'Withdrawal request'
    }));
    console.log('Transaction WITHDRAWAL PENDING: PASS');
  } catch (e) {
    console.log('Transaction WITHDRAWAL PENDING: FAIL', e.code, e.message);
  }

  // Test E: Transaction with type: YIELD, status: COMPLETED
  const txYieldId = `TX-${Date.now()}-YLD`;
  try {
    await setDoc(doc(db, 'transactions', txYieldId), cleanFirestoreData({
      id: txYieldId,
      userId: uid,
      type: 'YIELD',
      amount: 10,
      currency: 'BTC',
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      note: 'Yield transaction'
    }));
    console.log('Transaction YIELD COMPLETED: PASS');
  } catch (e) {
    console.log('Transaction YIELD COMPLETED: FAIL', e.code, e.message);
  }

  // Test F: Transaction with type: YIELD, status: PENDING
  const txYieldPendId = `TX-${Date.now()}-YLP`;
  try {
    await setDoc(doc(db, 'transactions', txYieldPendId), cleanFirestoreData({
      id: txYieldPendId,
      userId: uid,
      type: 'YIELD',
      amount: 10,
      currency: 'BTC',
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      note: 'Yield pending transaction'
    }));
    console.log('Transaction YIELD PENDING: PASS');
  } catch (e) {
    console.log('Transaction YIELD PENDING: FAIL', e.code, e.message);
  }

  // Test G: Investment creation
  const invId = `INV-${Date.now()}`;
  try {
    await setDoc(doc(db, 'investments', invId), cleanFirestoreData({
      id: invId,
      userId: uid,
      planId: 'plan-1',
      planName: 'BTC Plan',
      asset: 'BTC',
      amount: 100,
      dailyReturn: 1.5,
      startDate: new Date().toISOString(),
      durationDays: 30,
      status: 'ACTIVE'
    }));
    console.log('Investment creation: PASS');
  } catch (e) {
    console.log('Investment creation: FAIL', e.code, e.message);
  }

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
