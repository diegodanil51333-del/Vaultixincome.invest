import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD0UqOpQzQ3lM7kMcDclnkZIQXFS8s0xEE",
  authDomain: "vaultixincome.firebaseapp.com",
  projectId: "vaultixincome",
  storageBucket: "vaultixincome.firebasestorage.app",
  messagingSenderId: "158283505064",
  appId: "1:158283505064:web:d9997660ea2d085386919d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testUnauthenticatedLookup() {
  console.log('Testing Unauthenticated Lookup against Live Cloud Firestore...');

  // Test 1: Query referral_codes doc for VXREF-James513322 or uppercase
  try {
    const snap1 = await getDoc(doc(db, 'referral_codes', 'VXREF-JAMES513322'));
    console.log('1. getDoc(referral_codes/VXREF-JAMES513322):', snap1.exists() ? 'EXISTS' : 'NOT FOUND', snap1.data());
  } catch (err) {
    console.error('1. getDoc(referral_codes/VXREF-JAMES513322) ERROR:', err.message);
  }

  // Test 2: Query referral_codes collection
  try {
    const qSnap = await getDocs(collection(db, 'referral_codes'));
    console.log('2. getDocs(referral_codes) count:', qSnap.size);
    qSnap.forEach(d => console.log('   -> code:', d.id, d.data()));
  } catch (err) {
    console.error('2. getDocs(referral_codes) ERROR:', err.message);
  }

  // Test 3: Query users doc for James513322
  try {
    const uSnap = await getDocs(query(collection(db, 'users'), where('username', '==', 'James513322')));
    console.log('3. getDocs(users where username == James513322):', uSnap.size);
    uSnap.forEach(d => console.log('   -> user:', d.id, d.data().username, d.data().referralCode));
  } catch (err) {
    console.error('3. getDocs(users where username == James513322) ERROR:', err.message);
  }
}

testUnauthenticatedLookup().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
