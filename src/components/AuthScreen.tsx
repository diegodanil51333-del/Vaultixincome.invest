import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { getUsers, saveUsers, saveCurrentSession, getTransactions, saveTransactions, processRegistrationBonuses } from '../db';
import { auth, db, doc, setDoc, getDoc, collection, getDocs, query, where, isFirebaseConfigured, cleanFirestoreData } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, User as FirebaseUser } from 'firebase/auth';
import { Lock, User as UserIcon, CheckCircle, AlertCircle, Gift, ArrowLeft, RefreshCw } from 'lucide-react';
import { AmbientBackground } from './AmbientBackground';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  initialTab?: 'login' | 'register';
  onBackToLanding?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, initialTab = 'login', onBackToLanding }) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register Form
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref') || urlParams.get('referral');
        if (refParam && refParam.trim()) {
          setReferralCodeInput(refParam.trim().toUpperCase());
          setTab('register');
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [initialTab]);

  // Auto-detect referral code from URL formats like `https://vaultixincome.vercel.app/=VXREF-3316` or `?ref=VXREF-3316`
  useEffect(() => {
    try {
      const fullUrl = window.location.href;
      let detectedCode = '';

      // Check for `=VXREF-` pattern anywhere in path/query/hash
      const matchEqual = fullUrl.match(/=(VXREF-[A-Za-z0-9-]+)/i);
      if (matchEqual && matchEqual[1]) {
        detectedCode = matchEqual[1];
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref');
        if (refParam) {
          detectedCode = refParam;
        }
      }

      if (detectedCode) {
        setReferralCodeInput(detectedCode.toUpperCase());
        setTab('register');
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const cleanId = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanId || !cleanPass) {
      setError('Please enter your username/email and password.');
      return;
    }

    try {
      // 1. Resolve email address for Firebase Authentication (case-insensitive)
      let targetEmail = cleanId.toLowerCase();
      if (
        cleanId.toLowerCase() === 'vaultix_admin' ||
        cleanId.toLowerCase() === 'admin' ||
        cleanId.toLowerCase() === 'administrator'
      ) {
        targetEmail = 'vaultixincometeam@outlook.com';
      } else if (!cleanId.includes('@')) {
        const localUsers = getUsers();
        const found = localUsers.find(
          (u) =>
            Boolean(u?.username && typeof u.username === 'string' && u.username.toLowerCase() === cleanId.toLowerCase()) ||
            Boolean(u?.email && typeof u.email === 'string' && u.email.toLowerCase() === cleanId.toLowerCase())
        );
        if (found?.email && typeof found.email === 'string') {
          targetEmail = found.email.toLowerCase();
        } else {
          // Check backend lookup for user by username or identifier
          try {
            const res = await fetch('/api/lookup-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: cleanId, username: cleanId })
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.email && typeof data.email === 'string') {
                targetEmail = data.email.toLowerCase();
              }
            }
          } catch {
            // Ignore offline/lookup errors
          }

          if (!targetEmail.includes('@')) {
            try {
              const q = query(collection(db, 'users'), where('username', '==', cleanId));
              const snap = await getDocs(q);
              if (!snap.empty) {
                const uData = snap.docs[0].data() as User;
                if (uData?.email && typeof uData.email === 'string') {
                  targetEmail = uData.email.toLowerCase();
                }
              } else if (cleanId !== cleanId.toLowerCase()) {
                const qLower = query(collection(db, 'users'), where('username', '==', cleanId.toLowerCase()));
                const snapLower = await getDocs(qLower);
                if (!snapLower.empty) {
                  const uData = snapLower.docs[0].data() as User;
                  if (uData?.email && typeof uData.email === 'string') {
                    targetEmail = uData.email.toLowerCase();
                  }
                }
              }
            } catch {
              // Ignore offline/permission lookup errors
            }
          }
        }

        if (!targetEmail || !targetEmail.includes('@')) {
          setError(`No account found with username "${cleanId}". Please check your username or enter your email address.`);
          return;
        }
      }

      // 2. Authenticate strictly via Firebase Authentication
      let authUser: FirebaseUser | null = null;
      try {
        const userCred = await signInWithEmailAndPassword(auth, targetEmail, cleanPass);
        authUser = userCred.user;
      } catch (authErr: any) {
        console.error('Firebase Auth sign-in error:', authErr);
        if (
          authErr.code === 'auth/invalid-credential' ||
          authErr.code === 'auth/wrong-password' ||
          authErr.code === 'auth/user-not-found'
        ) {
          setError('Invalid login credentials. Please check your username/email and password.');
          return;
        } else if (authErr.code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Access has been temporarily restricted. Please wait a few moments or use Forgot Password to reset.');
          return;
        } else {
          setError('Authentication failed. Please check your credentials or reset your password.');
          return;
        }
      }

      const uid = authUser.uid;
      const userEmail = (authUser?.email || targetEmail || '').toLowerCase();
      let idTokenResult: any = null;
      try {
        idTokenResult = await authUser.getIdTokenResult();
      } catch {
        // Fallback
      }
      const isUserAdmin =
        userEmail === 'vaultixincometeam@outlook.com' ||
        idTokenResult?.claims?.role === 'ADMIN' ||
        idTokenResult?.claims?.admin === true;

      let loggedInUser: User | null = null;

      // 3. Retrieve user profile from Cloud Firestore
      try {
        const docSnap = await getDoc(doc(db, 'users', uid));
        if (docSnap.exists()) {
          loggedInUser = docSnap.data() as User;
        }
      } catch (fsErr) {
        console.warn('Could not read user profile from Firestore:', fsErr);
      }

      // Ensure critical fields are populated safely on retrieved profile
      if (loggedInUser) {
        if (!loggedInUser.email && userEmail) {
          loggedInUser.email = userEmail;
        }
        if (!loggedInUser.username && userEmail) {
          loggedInUser.username = userEmail.split('@')[0];
        }
      }

      // 4. Fallback profile initialization if not yet present in Firestore
      if (!loggedInUser) {
        if (isUserAdmin) {
          loggedInUser = {
            userId: uid,
            accountId: 'VX-100001',
            username: 'vaultix_admin',
            fullName: 'Vaultix Administrator',
            email: userEmail || 'vaultixincometeam@outlook.com',
            role: 'ADMIN',
            accountStatus: 'ACTIVE',
            balance: 0.0,
            referralEarnings: 0.0,
            bonusBalance: 0.0,
            totalDeposits: 0.0,
            totalInvestments: 0.0,
            totalProfitLoss: 0.0,
            referralCode: 'VXREF-ADMIN',
            createdAt: new Date().toISOString()
          };
          try {
            await setDoc(doc(db, 'users', uid), cleanFirestoreData(loggedInUser), { merge: true });
          } catch (writeErr) {
            console.warn('Could not write admin profile to Firestore:', writeErr);
          }
        } else {
          const localUsers = getUsers();
          const found = localUsers.find(
            (u) =>
              Boolean(u?.userId && u.userId === uid) ||
              Boolean(u?.email && userEmail && typeof u.email === 'string' && u.email.toLowerCase() === userEmail) ||
              Boolean(u?.username && cleanId && typeof u.username === 'string' && u.username.toLowerCase() === cleanId.toLowerCase())
          );
          if (found) {
            loggedInUser = { ...found, userId: uid, email: found.email || userEmail };
          } else {
            const fallbackUsername = userEmail ? userEmail.split('@')[0] : cleanId;
            loggedInUser = {
              userId: uid,
              accountId: `VX-${Math.floor(100000 + Math.random() * 900000)}`,
              username: fallbackUsername,
              fullName: fallbackUsername,
              email: userEmail,
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
          }
          if (loggedInUser) {
            try {
              await setDoc(doc(db, 'users', uid), cleanFirestoreData(loggedInUser), { merge: true });
            } catch (err) {
              console.warn('Could not heal user profile in Firestore:', err);
            }
          }
        }
      }

      if (isUserAdmin && loggedInUser) {
        loggedInUser.role = 'ADMIN';
      }

      if (loggedInUser?.accountStatus === 'SUSPENDED') {
        setError('Account suspended. Please contact Vaultix Income support.');
        return;
      }

      saveCurrentSession(loggedInUser);
      onLoginSuccess(loggedInUser);
    } catch (err: any) {
      console.error('Login process error:', err);
      let errMsg = err?.message || 'Authentication could not be completed. Please check your credentials and try again.';
      if (
        typeof errMsg === 'string' &&
        (errMsg.includes('undefined is not an object') ||
          errMsg.includes('Cannot read property') ||
          errMsg.includes('Cannot read properties') ||
          errMsg.includes('null is not an object') ||
          errMsg.includes('is not a function'))
      ) {
        errMsg = 'Login failed: Invalid credentials or account record. Please check your username or email and try again.';
      }
      setError(errMsg);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setMessage(null);
    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setError('Please enter your email or username above to receive a password reset link.');
      return;
    }

    let targetEmail = cleanId.toLowerCase();
    if (
      cleanId.toLowerCase() === 'vaultix_admin' ||
      cleanId.toLowerCase() === 'admin' ||
      cleanId.toLowerCase() === 'administrator'
    ) {
      targetEmail = 'vaultixincometeam@outlook.com';
    } else if (!cleanId.includes('@')) {
      const localUsers = getUsers();
      const found = localUsers.find((u) => Boolean(u?.username && typeof u.username === 'string' && u.username.toLowerCase() === cleanId.toLowerCase()));
      if (found?.email && typeof found.email === 'string') {
        targetEmail = found.email.toLowerCase();
      }
    }

    if (!targetEmail.includes('@') || !targetEmail.includes('.')) {
      setError('Please enter a valid email address to receive password reset instructions.');
      return;
    }

    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setMessage(`Password reset email sent to ${targetEmail}! Please check your inbox and junk folder.`);
      setError(null);
    } catch (resetErr: any) {
      console.error('Password reset error:', resetErr);
      setError('Could not send password reset email. Please ensure the email address is registered.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!username.trim() || !fullName.trim() || !email.trim() || !password || !passwordConfirm) {
      setError('All required registration fields must be completed.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    const users = getUsers();

    if (users.some((u) => Boolean(u?.username && typeof u.username === 'string' && u.username.toLowerCase() === username.trim().toLowerCase()))) {
      setError('Username is already taken by another user.');
      return;
    }

    if (users.some((u) => Boolean(u?.email && typeof u.email === 'string' && u.email.toLowerCase() === email.trim().toLowerCase()))) {
      setError('Email address is already registered.');
      return;
    }

    let referrerUsername: string | undefined = undefined;
    let referrerDisplayName: string | undefined = undefined;
    let referrerUser: any | undefined = undefined;

    if (referralCodeInput.trim()) {
      const codeClean = referralCodeInput.trim().toUpperCase();

      // Check self-referral against registration inputs
      if (
        codeClean === username.trim().toUpperCase() ||
        codeClean === email.trim().toLowerCase() ||
        codeClean === email.trim().toUpperCase()
      ) {
        setError('You cannot refer yourself. Please enter a valid referral code or leave the field blank.');
        return;
      }

      // Backend validation via /api/validate-referral
      try {
        const valRes = await fetch('/api/validate-referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode: referralCodeInput.trim(),
            currentUsername: username.trim(),
            currentEmail: email.trim().toLowerCase()
          })
        });

        const valData = await valRes.json();
        if (!valRes.ok || !valData.valid) {
          setError(valData.error || `Invalid referral code "${referralCodeInput.trim()}" provided.`);
          return;
        }

        if (valData.referrer) {
          referrerUser = valData.referrer;
          referrerUsername = valData.referrer.username;
          referrerDisplayName = valData.referrer.fullName || valData.referrer.username;
        }
      } catch {
        // Local fallback check
        const localUsers = getUsers();
        referrerUser = localUsers.find(
          (u) =>
            u?.referralCode?.trim().toUpperCase() === codeClean ||
            u?.username?.trim().toUpperCase() === codeClean
        );

        if (!referrerUser && codeClean === 'VXREF-ADMIN') {
          referrerUser = localUsers.find((u) => u?.role === 'ADMIN');
        }

        if (referrerUser) {
          const rUsername = referrerUser?.username && typeof referrerUser.username === 'string' ? referrerUser.username.toLowerCase() : '';
          const rEmail = referrerUser?.email && typeof referrerUser.email === 'string' ? referrerUser.email.toLowerCase() : '';

          if (
            (rUsername && rUsername === username.trim().toLowerCase()) ||
            (rEmail && rEmail === email.trim().toLowerCase())
          ) {
            setError('You cannot refer yourself. Please enter a valid referral code or leave the field blank.');
            return;
          }
          referrerUsername = referrerUser.username;
          referrerDisplayName = referrerUser.fullName || referrerUser.username;
        } else {
          setError(`Invalid referral code "${referralCodeInput.trim()}" provided.`);
          return;
        }
      }
    }

    let uid = '';
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      uid = userCredential.user.uid;
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        try {
          const signCred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
          uid = signCred.user.uid;
        } catch {
          setError('This email address is already registered. Please log in to your account.');
          return;
        }
      } else if (authErr.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
        return;
      } else if (authErr.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
        return;
      } else {
        console.error('Registration auth error:', authErr);
        setError('Registration could not be completed. Please check your information and try again.');
        return;
      }
    }

    // Construct secure default user document (strictly 0 balances, NO password fields)
    const newUser: User = {
      userId: uid,
      accountId: `VX-${Math.floor(100000 + Math.random() * 900000)}`,
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
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

    if (phoneNumber.trim()) {
      newUser.phoneNumber = phoneNumber.trim();
    }
    if (referrerUser?.userId) {
      newUser.referredBy = referrerUser.userId;
    }
    if (referrerUsername) {
      newUser.referredByUsername = referrerUsername;
    }
    if (referrerDisplayName) {
      newUser.referredByDisplayName = referrerDisplayName;
    }


    // Direct Awaited Firestore Document Creation with Real-Time Diagnostics
    const cleanedUserData = cleanFirestoreData(newUser);
    const authCurrentUid = auth.currentUser?.uid || '';

    const ruleEvaluationDiagnostics = {
      timestamp: new Date().toISOString(),
      authCurrentUid,
      newUserUserId: newUser.userId,
      uidMatchesUserId: authCurrentUid === newUser.userId,
      targetDocumentPath: `users/${newUser.userId}`,
      userObjectPayload: cleanedUserData,
      ruleChecks: {
        isAuthenticated: Boolean(auth.currentUser),
        isOwnerOfPath: authCurrentUid === newUser.userId,
        userIdMatchesDocument: cleanedUserData.userId === newUser.userId,
        roleIsUser: cleanedUserData.role === 'USER',
        accountStatusIsActive: cleanedUserData.accountStatus === 'ACTIVE',
        balanceZero: cleanedUserData.balance === 0,
        totalDepositsZero: cleanedUserData.totalDeposits === 0,
        totalInvestmentsZero: cleanedUserData.totalInvestments === 0,
        totalProfitLossZero: cleanedUserData.totalProfitLoss === 0,
        referralEarningsZero: cleanedUserData.referralEarnings === 0,
        bonusBalanceZero: !cleanedUserData.bonusBalance || cleanedUserData.bonusBalance === 0,
        noPasswordHash: !('passwordHash' in cleanedUserData),
        noPassword: !('password' in cleanedUserData)
      }
    };

    console.group('🔍 [VAULTIX REGISTRATION DIAGNOSTIC] Firestore Rule Evaluation');
    console.log('Firebase Auth UID:', authCurrentUid);
    console.log('New User ID:', newUser.userId);
    console.log('Document Path:', `users/${newUser.userId}`);
    console.log('Payload Data Structure:', cleanedUserData);
    console.table(ruleEvaluationDiagnostics.ruleChecks);
    console.groupEnd();

    try {
      await setDoc(doc(db, 'users', newUser.userId), cleanedUserData);
      console.log('✅ [VAULTIX REGISTRATION] Document successfully written to Firestore:', `users/${newUser.userId}`);
    } catch (fsErr: any) {
      console.error('❌ [VAULTIX REGISTRATION ERROR] Firestore rejected document write:', fsErr);
      setError('Registration could not be completed at this time. Please check your connection and try again.');
      return;
    }

    // Process welcome bonus & referral reward atomically and idempotently
    const bonusResult = processRegistrationBonuses(newUser, referrerUser);
    const finalUser = bonusResult.newUser;

    // Best-effort backend authoritative store sync
    try {
      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: finalUser,
          referralCode: referralCodeInput.trim()
        })
      }).catch(() => {});
    } catch {
      // Ignored in offline mode
    }

    setMessage('Your account has been created successfully. Welcome to Vaultix Income!');

    setTimeout(() => {
      saveCurrentSession(finalUser);
      onLoginSuccess(finalUser);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-x-hidden">
      <AmbientBackground />

      {/* Top Navigation / Back Button */}
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="absolute top-6 left-6 text-xs text-slate-300 hover:text-[#D4AF37] flex items-center space-x-1.5 transition-colors cursor-pointer z-20 bg-[#141923]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#2A3447] shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>
      )}

      {/* Main Container: Dual-Panel Showcase on Desktop, Stacked on Mobile */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 py-12 md:py-8">
        
        {/* Left Side: Visual Showcase Cards using the 3 Reference Images */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#141923]/80 backdrop-blur-xl border border-[#2A3447] rounded-3xl p-5 md:p-6 shadow-2xl space-y-4 relative overflow-hidden">
            
            {/* Top Showcase Image (bg_profit.jpg) */}
            <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/30 group shadow-xl">
              <img
                src="/bg_profit.jpg"
                alt="Vaultix Income Profit Portfolio"
                className="w-full h-48 sm:h-56 object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/40 to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-bold text-white">
                <span className="bg-emerald-500/90 text-black px-2.5 py-1 rounded-lg text-[11px] font-extrabold shadow-md">
                  PROFIT GROWTH +$157,000
                </span>
                <span className="text-[10px] text-amber-300 bg-black/60 px-2 py-0.5 rounded-full border border-amber-500/40">
                  Verified Yield
                </span>
              </div>
            </div>

            {/* Bottom Dual Grid (bg_savings.jpg & bg_growth.jpg) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative rounded-2xl overflow-hidden border border-[#2A3447] group shadow-lg">
                <img
                  src="/bg_savings.jpg"
                  alt="Vaultix Income Savings"
                  className="w-full h-32 sm:h-36 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/90 via-transparent to-transparent"></div>
                <span className="absolute bottom-2 left-2 text-[10px] font-bold text-[#D4AF37] bg-black/70 px-2 py-0.5 rounded-md border border-[#D4AF37]/30">
                  Smart Wealth Savings
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-[#2A3447] group shadow-lg">
                <img
                  src="/bg_growth.jpg"
                  alt="Vaultix Income Investment Growth"
                  className="w-full h-32 sm:h-36 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/90 via-transparent to-transparent"></div>
                <span className="absolute bottom-2 left-2 text-[10px] font-bold text-emerald-400 bg-black/70 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Compounding Capital
                </span>
              </div>
            </div>

            {/* Platform Tagline */}
            <div className="pt-2 border-t border-[#2A3447]/60 flex items-center justify-between text-[11px] text-slate-300 font-semibold">
              <span>Automated Yield Vaults</span>
              <span>•</span>
              <span>Multi-Asset Protection</span>
              <span>•</span>
              <span className="text-[#D4AF37]">256-Bit TLS</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form Card (Fully visible, readable, interactive) */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-[#141923]/95 backdrop-blur-2xl border border-[#2A3447] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
            <div className="flex flex-col items-center text-center mb-6">
              <img src="/logo.jpg" alt="Vaultix Income" className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/60 object-cover shadow-lg mb-2" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#D4AF37] tracking-wider">VAULTIX INCOME</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Digital Asset Management & Wealth Platform</p>
            </div>

            <div className="flex border-b border-[#2A3447] mb-6">
              <button
                onClick={() => { setTab('login'); setError(null); setMessage(null); }}
                className={`flex-1 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  tab === 'login' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                LOG IN
              </button>
              <button
                onClick={() => { setTab('register'); setError(null); setMessage(null); }}
                className={`flex-1 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  tab === 'register' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                REGISTER
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="mb-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3 rounded-xl flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Username or Email</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Enter username or email"
                      className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end -mt-1 mb-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isSendingReset}
                    className="text-[11px] font-semibold text-[#D4AF37] hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {isSendingReset ? 'Sending reset link...' : 'Forgot password?'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold py-3 rounded-xl text-xs transition-all shadow-lg mt-2 cursor-pointer uppercase tracking-wider"
                >
                  SECURE LOG IN
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose username"
                    className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="First and last name"
                    className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valid Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Invite / Referral Code</label>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                      <Gift className="w-3 h-3" />
                      <span>Get $2 Welcome Bonus</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value)}
                    placeholder="Enter referral code (optional)"
                    className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#10B981] hover:bg-[#0d9668] text-black font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md mt-2 cursor-pointer uppercase tracking-wider"
                >
                  CREATE ACCOUNT
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
