import React, { useState } from 'react';
import { User } from '../types';
import { getUsers, saveUsers, saveCurrentSession } from '../db';
import { Lock, Mail, User as UserIcon, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setError('Please enter your username/email and password.');
      return;
    }

    const users = getUsers();
    const foundUser = users.find(
      (u) =>
        (u.username.toLowerCase() === loginIdentifier.trim().toLowerCase() ||
          u.email.toLowerCase() === loginIdentifier.trim().toLowerCase()) &&
        u.passwordHash === loginPassword
    );

    if (!foundUser) {
      setError('Invalid login credentials. Please check your username/email and password.');
      return;
    }

    if (foundUser.accountStatus === 'SUSPENDED') {
      setError('Account suspended. Please contact Vaultix Income support.');
      return;
    }

    saveCurrentSession(foundUser);
    onLoginSuccess(foundUser);
  };

  const handleRegister = (e: React.FormEvent) => {
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

    // Duplicate check
    if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setError('Username is already taken by another user.');
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setError('Email address is already registered.');
      return;
    }

    let referrerUsername: string | undefined = undefined;
    if (referralCodeInput.trim()) {
      const referrer = users.find((u) => u.referralCode.toLowerCase() === referralCodeInput.trim().toLowerCase());
      if (referrer) {
        referrerUsername = referrer.username;
        // Award referral bonus $25 to referrer
        referrer.balance += 25.0;
      }
    }

    const newUser: User = {
      userId: `USR-${Math.floor(100000 + Math.random() * 900000)}`,
      accountId: `VX-${Math.floor(100000 + Math.random() * 900000)}`,
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      passwordHash: password,
      role: 'USER',
      accountStatus: 'ACTIVE',
      balance: 1000.0, // Welcome deposit
      totalDeposits: 1000.0,
      totalInvestments: 0,
      totalProfitLoss: 0,
      referralCode: `VXREF-${Math.floor(1000 + Math.random() * 9000)}`,
      referredByUsername: referrerUsername,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    setMessage('Registration successful! Logging you in...');
    setTimeout(() => {
      saveCurrentSession(newUser);
      onLoginSuccess(newUser);
    }, 1000);
  };

  return (
    <div class="min-h-screen bg-[#0B0E14] text-white flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-md bg-[#141923] border border-[#2A3447] rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Brand Logo & Header */}
        <div class="flex flex-col items-center text-center mb-6">
          <img src="/logo.jpg" alt="Vaultix Income" class="w-20 h-20 rounded-full border-2 border-[#D4AF37]/60 object-cover shadow-lg mb-3" />
          <h1 class="text-2xl font-extrabold text-[#D4AF37] tracking-wider">VAULTIX INCOME</h1>
          <p class="text-xs text-[#94A3B8] mt-1">Digital Asset Management & Wealth Platform</p>
        </div>

        {/* Tab Switcher */}
        <div class="flex border-b border-[#2A3447] mb-6">
          <button
            onClick={() => { setTab('login'); setError(null); setMessage(null); }}
            class={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all ${
              tab === 'login' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            LOG IN
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); setMessage(null); }}
            class={`flex-1 py-2.5 text-sm font-bold border-b-2 transition-all ${
              tab === 'register' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div class="mb-4 bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-3 rounded-lg flex items-center space-x-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div class="mb-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3 rounded-lg flex items-center space-x-2">
            <CheckCircle class="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Username or Email</label>
              <div class="relative">
                <UserIcon class="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  class="w-full bg-[#1D2432] border border-[#2A3447] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div class="relative">
                <Lock class="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  class="w-full bg-[#1D2432] border border-[#2A3447] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              class="w-full bg-[#D4AF37] hover:bg-[#b8982e] text-black font-bold py-2.5 rounded-lg text-sm transition-all shadow-md mt-2"
            >
              SECURE LOG IN
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username"
                class="w-full bg-[#1D2432] border border-[#2A3447] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="First and last name"
                class="w-full bg-[#1D2432] border border-[#2A3447] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Valid Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                class="w-full bg-[#1D2432] border border-[#2A3447] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                class="w-full bg-[#1D2432] border border-[#2A3447] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repeat password"
                class="w-full bg-[#1D2432] border border-[#2A3447] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Referral Code (Optional)</label>
              <input
                type="text"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value)}
                placeholder="e.g. VXREF-8921"
                class="w-full bg-[#1D2432] border border-[#2A3447] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              class="w-full bg-[#10B981] hover:bg-[#0d9668] text-black font-bold py-2.5 rounded-lg text-sm transition-all shadow-md mt-2"
            >
              CREATE ACCOUNT
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
