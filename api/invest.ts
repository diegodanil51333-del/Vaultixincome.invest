import { authoritativeStore } from './authoritative-store.js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD0UqOpQzQ3lM7kMcDclnkZIQXFS8s0xEE",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "vaultixincome.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "vaultixincome",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "vaultixincome.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "158283505064",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:158283505064:web:d9997660ea2d085386919d"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

function cleanFirestoreData(data: Record<string, any>) {
  const cleaned: Record<string, any> = {};
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, planId, amount, planName, asset, dailyYield, lockDays, idempotencyKey } = req.body || {};

  if (!userId || !planId || !amount || amount <= 0 || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid investment parameters. Amount must be positive.' });
  }

  try {
    // 1. ATOMIC COMMIT VIA AUTHORITATIVE STORE
    // Guarantees balance check, atomic deduction, investment creation, and ledger record
    const result = await authoritativeStore.executeInvestmentAtomic({
      userId,
      planId,
      planName,
      asset,
      amount,
      dailyYield,
      lockDays,
      idempotencyKey
    });

    // 2. Best-effort Cloud Firestore sync for investment record, user balance, and ledger
    try {
      await setDoc(doc(db, 'investments', result.investment.id), cleanFirestoreData(result.investment));
    } catch {
      // Handled cleanly
    }
    try {
      await updateDoc(doc(db, 'users', userId), {
        balance: result.user.balance,
        totalInvestments: result.user.totalInvestments
      });
    } catch {
      // Handled cleanly
    }
    try {
      await setDoc(doc(db, 'transactions', result.tx.id), cleanFirestoreData(result.tx));
    } catch {
      // Handled cleanly
    }

    return res.status(200).json({
      success: true,
      user: result.user,
      investment: result.investment,
      tx: result.tx,
      alreadyProcessed: result.alreadyProcessed || false
    });
  } catch (err: any) {
    console.error('Investment processing backend error:', err);
    // Replace raw database/Firebase errors with clear user-facing messages
    const message = err.message || '';
    let userMessage = 'Investment could not be completed. Your balance was not deducted. Please try again.';

    if (message.includes('Insufficient balance')) {
      userMessage = message;
    } else if (message.includes('CONCURRENT OPERATION')) {
      userMessage = message;
    } else if (message.includes('parameters') || message.includes('boundaries')) {
      userMessage = message;
    }

    return res.status(400).json({
      success: false,
      error: userMessage
    });
  }
}
