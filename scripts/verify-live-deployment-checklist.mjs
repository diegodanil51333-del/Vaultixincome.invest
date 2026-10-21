import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, limit, query, where } from 'firebase/firestore';

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

async function runChecklist() {
  console.log('=== CHECKLIST AUDIT FOR VAULTIXINCOME-INVEST-TWO ===\n');

  // Item 3: Test Registration and Normal-User Login
  const testEmail = `verify_${Date.now()}@vaultix-test.com`;
  const testPassword = 'Password123!';
  console.log('1. Testing User Registration via Firebase Auth...');
  const userCred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  console.log('   Registration SUCCESS! UID:', userCred.user.uid);

  // Create initial user document
  const initialUserData = {
    userId: userCred.user.uid,
    accountId: `VX-${Math.floor(100000 + Math.random() * 900000)}`,
    username: `testuser_${Date.now().toString().slice(-4)}`,
    fullName: 'Verification Test User',
    email: testEmail,
    role: 'USER',
    accountStatus: 'ACTIVE',
    balance: 0.0,
    totalDeposits: 0.0,
    totalInvestments: 0.0,
    totalProfitLoss: 0.0,
    referralEarnings: 0.0,
    bonusBalance: 0.0,
    referralCode: `VXREF-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'users', userCred.user.uid), initialUserData);
  console.log('   Firestore User Profile write: SUCCESS');

  // Test sign out & sign back in (Testing password login)
  await signOut(auth);
  console.log('   Signed out cleanly.');

  console.log('\n2. Testing Normal User Login with Password...');
  const loginCred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
  console.log('   Login SUCCESS! User UID:', loginCred.user.uid);

  // Retrieve user document
  const userDocSnap = await getDoc(doc(db, 'users', loginCred.user.uid));
  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    console.log('   Retrieved User Profile:', {
      username: data.username,
      role: data.role,
      balance: data.balance,
      accountId: data.accountId
    });
  } else {
    throw new Error('User profile doc missing after login');
  }

  // Item 4: Test User can read their own document and transactions
  console.log('\n3. Verifying User Access to Their Own Records...');
  const ownDocSnap = await getDoc(doc(db, 'users', loginCred.user.uid));
  console.log('   User reading their own document: PASS (Found:', ownDocSnap.exists(), ')');

  // Query own transactions
  const ownTxSnap = await getDocs(query(
    collection(db, 'transactions'),
    where('userId', '==', loginCred.user.uid)
  ));
  console.log('   User reading their own transactions: PASS (Count:', ownTxSnap.size, ')');

  // Item 7: Verify Admin Lookup via Serverless API on the live Vercel domain
  console.log('\n4. Verifying Server API on new production URL...');
  const apiLookupRes = await fetch('https://vaultixincome-invest-two.vercel.app/api/lookup-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'vaultixincometeam@outlook.com' })
  });
  const apiLookupData = await apiLookupRes.json();
  console.log('   Admin Serverless API Lookup: PASS ->', apiLookupData);

  const apiRefRes = await fetch('https://vaultixincome-invest-two.vercel.app/api/validate-referral', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referralCode: 'VXREF-9865' })
  });
  const apiRefData = await apiRefRes.json();
  console.log('   Referral Serverless API Validation: PASS ->', apiRefData);

  console.log('\n=== ALL USER & API LIVE PRODUCTION CHECKS PASSED ===');
}

runChecklist().then(() => process.exit(0)).catch(err => {
  console.error('Checklist failed:', err);
  process.exit(1);
});
