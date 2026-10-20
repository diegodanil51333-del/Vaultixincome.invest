import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  runTransaction
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
  console.log('Testing live Firestore investment permissions...');
  const suffix = Date.now();
  const email = `invest_tester_${suffix}@vaultix-test.com`;
  const pass = 'TestPassword123!';

  // 1. Create authenticated user
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;
  console.log('1. User created with UID:', uid);

  // 2. Create user document with 0 balance
  const initialUserData = {
    userId: uid,
    accountId: `VX-${Math.floor(100000 + Math.random() * 900000)}`,
    username: `invest_tester_${suffix}`,
    fullName: 'Investment Tester',
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

  await setDoc(doc(db, 'users', uid), cleanFirestoreData(initialUserData));
  console.log('2. User doc created successfully in Firestore.');

  // Test 3: Can user write to investments collection?
  const testInvId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  const testInv = {
    id: testInvId,
    userId: uid,
    planId: 'plan-crypto-1',
    planName: 'BTC Alpha Vault',
    asset: 'BTC',
    amount: 500,
    dailyReturn: 7.5,
    startDate: new Date().toISOString(),
    durationDays: 30,
    status: 'ACTIVE'
  };

  try {
    await setDoc(doc(db, 'investments', testInvId), cleanFirestoreData(testInv));
    console.log('3. investments create PASSED.');
  } catch (err) {
    console.error('3. investments create FAILED:', err.code, err.message);
  }

  // Test 4: Can user write to transactions collection for YIELD COMPLETED?
  const testTxId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
  const testTx = {
    id: testTxId,
    userId: uid,
    type: 'YIELD',
    amount: 500,
    currency: 'BTC',
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    note: 'Subscribed to BTC Alpha Vault ($500.00)'
  };

  try {
    await setDoc(doc(db, 'transactions', testTxId), cleanFirestoreData(testTx));
    console.log('4. transactions create (type: YIELD, status: COMPLETED) PASSED.');
  } catch (err) {
    console.error('4. transactions create FAILED:', err.code, err.message);
  }

  // Test 5: Can user update their balance + totalInvestments according to rule?
  // Rule requires:
  // request.resource.data.diff(resource.data).affectedKeys().hasOnly(['balance', 'totalInvestments']) &&
  // request.resource.data.balance >= 0 &&
  // resource.data.balance > request.resource.data.balance &&
  // (resource.data.balance - request.resource.data.balance) == (request.resource.data.totalInvestments - resource.data.totalInvestments)
  // But wait! Initial balance is 0, so resource.data.balance cannot decrease without going negative!
  // What if we try updating balance with different conditions?
}

run().catch(console.error);
