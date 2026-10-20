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
  console.log('Testing Firestore atomic pipeline...');
  const suffix = Date.now();
  const email = `pipeline_user_${suffix}@vaultix-test.com`;
  const cred = await createUserWithEmailAndPassword(auth, email, 'Password123!');
  const uid = cred.user.uid;
  console.log('User created:', uid);

  // Can we create user with balance: 15078?
  try {
    await setDoc(doc(db, 'users', uid), cleanFirestoreData({
      userId: uid,
      accountId: 'VX-999999',
      username: `user_${suffix}`,
      fullName: 'Pipeline User',
      email: email,
      role: 'USER',
      accountStatus: 'ACTIVE',
      balance: 15078,
      totalDeposits: 15078,
      totalInvestments: 0,
      totalProfitLoss: 0,
      referralEarnings: 0,
      bonusBalance: 0,
      referralCode: 'VXREF-9999',
      createdAt: new Date().toISOString()
    }));
    console.log('Create user with balance 15078: SUCCESS!');
  } catch (err) {
    console.log('Create user with balance 15078: REJECTED by rules:', err.code);
  }

  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
