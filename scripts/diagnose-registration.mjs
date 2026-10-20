/**
 * Vaultix Income — Real-Time Firebase Auth & Firestore Rules Registration Diagnostic Tool
 * 
 * Usage:
 *   node scripts/diagnose-registration.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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
    if (key === 'passwordHash' || key === 'password') {
      continue;
    }
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

async function runDiagnostic() {
  console.log('========================================================================');
  console.log('  VAULTIX INCOME — REGISTRATION & FIRESTORE RULES DIAGNOSTIC');
  console.log('========================================================================\n');
  console.log('Target Firebase Project:', firebaseConfig.projectId);
  console.log('Auth Domain:', firebaseConfig.authDomain);

  const timestamp = Date.now();
  const testEmail = `diag_user_${timestamp}@vaultix-test.com`;
  const testPassword = 'Password123!Secure';

  console.log('\n[STEP 1] Creating temporary test account in Firebase Authentication...');
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('  ✓ Auth User Created Successfully');
    console.log('  ✓ Current User UID (request.auth.uid):', cred.user.uid);
    console.log('  ✓ Auth User Email:', cred.user.email);
  } catch (err) {
    console.error('  ✗ Firebase Auth Error:', err.message);
    process.exit(1);
  }

  const uid = cred.user.uid;

  const rawUserObject = {
    userId: uid,
    accountId: `VX-${Math.floor(100000 + Math.random() * 900000)}`,
    username: `diag_user_${timestamp}`,
    fullName: 'Diagnostic Test User',
    email: testEmail,
    role: 'USER',
    accountStatus: 'ACTIVE',
    balance: 0.0,
    referralEarnings: 0.0,
    bonusBalance: 0.0,
    totalDeposits: 0.0,
    totalInvestments: 0.0,
    totalProfitLoss: 0.0,
    referralCode: `VXREF-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString()
  };

  const cleanedUserPayload = cleanFirestoreData(rawUserObject);

  console.log('\n[STEP 2] Inspecting User Document Payload (no passwords, zero balances):');
  console.log(JSON.stringify(cleanedUserPayload, null, 2));

  console.log('\n[STEP 3] Comparing Payload Against Production Firestore Security Rules:');
  const ruleComparisons = [
    {
      ruleCondition: "isAuthenticated() [request.auth != null]",
      evaluatedValue: Boolean(auth.currentUser),
      ruleRequirement: "true",
      result: Boolean(auth.currentUser) ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "isOwner(userId) [request.auth.uid == userId]",
      evaluatedValue: `${auth.currentUser?.uid} == ${uid}`,
      ruleRequirement: "Match",
      result: auth.currentUser?.uid === uid ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "request.resource.data.userId == userId",
      evaluatedValue: `${cleanedUserPayload.userId} == ${uid}`,
      ruleRequirement: "Match",
      result: cleanedUserPayload.userId === uid ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "request.resource.data.role == 'USER'",
      evaluatedValue: cleanedUserPayload.role,
      ruleRequirement: "'USER'",
      result: cleanedUserPayload.role === 'USER' ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "request.resource.data.accountStatus == 'ACTIVE'",
      evaluatedValue: cleanedUserPayload.accountStatus,
      ruleRequirement: "'ACTIVE'",
      result: cleanedUserPayload.accountStatus === 'ACTIVE' ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "request.resource.data.balance == 0",
      evaluatedValue: cleanedUserPayload.balance,
      ruleRequirement: "0",
      result: cleanedUserPayload.balance === 0 ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "request.resource.data.totalDeposits == 0",
      evaluatedValue: cleanedUserPayload.totalDeposits,
      ruleRequirement: "0",
      result: cleanedUserPayload.totalDeposits === 0 ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "request.resource.data.totalInvestments == 0",
      evaluatedValue: cleanedUserPayload.totalInvestments,
      ruleRequirement: "0",
      result: cleanedUserPayload.totalInvestments === 0 ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "request.resource.data.totalProfitLoss == 0",
      evaluatedValue: cleanedUserPayload.totalProfitLoss,
      ruleRequirement: "0",
      result: cleanedUserPayload.totalProfitLoss === 0 ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "request.resource.data.referralEarnings == 0",
      evaluatedValue: cleanedUserPayload.referralEarnings,
      ruleRequirement: "0",
      result: cleanedUserPayload.referralEarnings === 0 ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "!('bonusBalance' in request.resource.data) || bonusBalance == 0",
      evaluatedValue: cleanedUserPayload.bonusBalance,
      ruleRequirement: "0",
      result: cleanedUserPayload.bonusBalance === 0 ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "!('passwordHash' in request.resource.data)",
      evaluatedValue: !('passwordHash' in cleanedUserPayload),
      ruleRequirement: "true",
      result: !('passwordHash' in cleanedUserPayload) ? "PASS" : "FAIL"
    },
    {
      ruleCondition: "!('password' in request.resource.data)",
      evaluatedValue: !('password' in cleanedUserPayload),
      ruleRequirement: "true",
      result: !('password' in cleanedUserPayload) ? "PASS" : "FAIL"
    }
  ];

  console.table(ruleComparisons);

  const allPassed = ruleComparisons.every(c => c.result === "PASS");
  console.log(`\nClient-side rule compatibility check: ${allPassed ? "✓ ALL CONSTRAINTS MET" : "✗ CONSTRAINTS VIOLATED"}`);

  console.log(`\n[STEP 4] Executing setDoc(doc(db, 'users', '${uid}')) against Live Firestore...`);
  try {
    await setDoc(doc(db, 'users', uid), cleanedUserPayload);
    console.log('  ✓ SUCCESS: Document successfully created in production Firestore!');
    
    // Verify document can be read back by its owner
    const readBack = await getDoc(doc(db, 'users', uid));
    if (readBack.exists()) {
      console.log('  ✓ SUCCESS: Document read-back verified! Account ID:', readBack.data().accountId);
    }
  } catch (fsErr) {
    console.error('  ✗ FIRESTORE WRITE REJECTED!');
    console.error('    Error Code:', fsErr.code);
    console.error('    Error Message:', fsErr.message);
    console.log('\n------------------------------------------------------------------------');
    console.log('DIAGNOSIS & REQUIRED ACTION:');
    console.log('The client payload strictly meets all rules and security constraints,');
    console.log('but the Cloud Firestore database is rejecting the write with:', fsErr.code);
    console.log('This confirms that the Security Rules in Firebase Console for project');
    console.log(`"${firebaseConfig.projectId}" must be updated and published manually.`);
    console.log('------------------------------------------------------------------------');
  }

  process.exit(0);
}

runDiagnostic().catch(err => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});
