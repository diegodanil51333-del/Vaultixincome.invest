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
  console.log('Testing isolated investment creation in Firestore...');
  const suffix = Date.now();
  const email = `test_inv_user_${suffix}@vaultix-test.com`;
  const cred = await createUserWithEmailAndPassword(auth, email, 'Password123!');
  const uid = cred.user.uid;

  // 1. Create user document
  const userDoc = {
    userId: uid,
    accountId: `VX-${Math.floor(100000 + Math.random() * 900000)}`,
    username: `inv_tester_${suffix}`,
    fullName: 'Investment Mechanics Tester',
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
  await setDoc(doc(db, 'users', uid), cleanFirestoreData(userDoc));
  console.log('User document created.');

  // 2. Test isolated investment write
  const invId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  const newInv = {
    id: invId,
    userId: uid,
    planId: 'plan-crypto-1',
    planName: 'BTC Alpha Vault',
    asset: 'BTC',
    amount: 5000,
    dailyReturn: 75,
    startDate: new Date().toISOString(),
    durationDays: 30,
    status: 'ACTIVE'
  };

  try {
    await setDoc(doc(db, 'investments', invId), cleanFirestoreData(newInv));
    console.log('SUCCESS: Investment written to Firestore investments collection!');
  } catch (err) {
    console.error('FAILED investment write:', err.code, err.message);
  }

  // 3. Test reading the investment back
  try {
    const readSnap = await getDoc(doc(db, 'investments', invId));
    if (readSnap.exists()) {
      console.log('SUCCESS: Read back investment document! Amount:', readSnap.data().amount, 'Status:', readSnap.data().status);
    } else {
      console.error('FAILED: Investment document not found!');
    }
  } catch (err) {
    console.error('FAILED investment read:', err.code, err.message);
  }

  // 4. Test writing to transactions with PENDING vs COMPLETED
  const pendingTxId = `TX-${Date.now()}-PEND`;
  try {
    await setDoc(doc(db, 'transactions', pendingTxId), cleanFirestoreData({
      id: pendingTxId,
      userId: uid,
      type: 'DEPOSIT',
      amount: 5000,
      currency: 'USD',
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      note: 'Pending deposit'
    }));
    console.log('SUCCESS: PENDING transaction write allowed.');
  } catch (err) {
    console.log('PENDING transaction write failed:', err.code);
  }

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
