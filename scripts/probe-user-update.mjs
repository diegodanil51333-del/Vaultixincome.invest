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
  const email = `diag_bal_${suffix}@vaultix-test.com`;
  const cred = await createUserWithEmailAndPassword(auth, email, 'Password123!');
  const uid = cred.user.uid;

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

  // Test: Can user update balance and totalInvestments according to:
  // request.resource.data.diff(resource.data).affectedKeys().hasOnly(['balance', 'totalInvestments']) &&
  // request.resource.data.balance >= 0 &&
  // resource.data.balance > request.resource.data.balance &&
  // (resource.data.balance - request.resource.data.balance) == (request.resource.data.totalInvestments - resource.data.totalInvestments)
  // To test this, balance must be > 0 initially. But user cannot set balance > 0!
  // Wait, what if user updates totalInvestments only?
  try {
    await updateDoc(doc(db, 'users', uid), { totalInvestments: 100 });
    console.log('Update totalInvestments: PASS');
  } catch (e) {
    console.log('Update totalInvestments: FAIL', e.code);
  }

  // Can user update only allowed profile fields?
  try {
    await updateDoc(doc(db, 'users', uid), { phoneNumber: '+1234567890' });
    console.log('Update phoneNumber: PASS');
  } catch (e) {
    console.log('Update phoneNumber: FAIL', e.code);
  }

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
