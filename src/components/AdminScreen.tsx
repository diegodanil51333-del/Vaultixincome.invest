import React, { useState, useEffect, useRef } from 'react';
import { User, CryptoWalletConfig, ReferralConfig, InvestmentPlan, Transaction, AuditLog, UserInvestment } from '../types';
import {
  getUsers, saveUsers, getTransactions, saveTransactions, approveDepositTransaction, rejectDepositTransaction,
  cancelDepositTransaction, approveWithdrawalTransaction, cancelWithdrawalTransaction,
  getAuditLogs, saveAuditLogs, getWallets, saveWallets, getReferralConfig, saveReferralConfig, getPlans, savePlans,
  getInvestments, saveInvestments, getAccruedProfitForInvestment
} from '../db';
import { db, collection, onSnapshot } from '../firebase';
import { cryptoPriceService } from '../services/cryptoPriceService';
import {
  ShieldAlert, Search, CheckCircle, AlertCircle, X, DollarSign, Wallet, ArrowUpRight,
  Layers, Sliders, Activity, RefreshCw, Copy, Check, TrendingUp
} from 'lucide-react';
import { TransactionReceiptModal } from './TransactionReceiptModal';

interface AdminScreenProps {
  currentAdmin: User;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ currentAdmin }) => {
  const [tab, setTab] = useState<'users' | 'deposits' | 'withdrawals' | 'investments' | 'all_txs' | 'wallets' | 'plans' | 'referral' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [users, setUsers] = useState<User[]>(getUsers());
  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions());
  const [wallets, setWallets] = useState<CryptoWalletConfig[]>(getWallets());
  const [refConfig, setRefConfig] = useState<ReferralConfig>(getReferralConfig());
  const [plans, setPlans] = useState<InvestmentPlan[]>(getPlans());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(getAuditLogs());
  const [investments, setInvestments] = useState<UserInvestment[]>(getInvestments());
  const [cryptoPrices, setCryptoPrices] = useState(cryptoPriceService.getAllCachedPrices());
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Balance Adjust Form
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  // Alert Feedback
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const refreshData = () => {
    setUsers(getUsers());
    setTransactions(getTransactions());
    setWallets(getWallets());
    setRefConfig(getReferralConfig());
    setPlans(getPlans());
    setAuditLogs(getAuditLogs());
    setInvestments(getInvestments());
    setCryptoPrices(cryptoPriceService.getAllCachedPrices());
  };

  // REALTIME FIRESTORE DIRECT SNAPSHOT LISTENER & EVENT SYNC
  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener('vaultix_users_updated', handleUpdate);
    window.addEventListener('vaultix_txs_updated', handleUpdate);
    window.addEventListener('vaultix_investments_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Initial live price fetch
    cryptoPriceService.fetchAllLivePrices().then(() => {
      setCryptoPrices(cryptoPriceService.getAllCachedPrices());
    });

    const priceInterval = setInterval(() => {
      cryptoPriceService.fetchAllLivePrices().then(() => {
        setCryptoPrices(cryptoPriceService.getAllCachedPrices());
      });
    }, 30000);

    // 1. Subscribe to Firestore Users collection in real time
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const fetchedUsers: User[] = [];
        snapshot.forEach((docSnap) => {
          const u = docSnap.data() as User;
          if (u && u.userId) {
            fetchedUsers.push(u);
          }
        });
        if (fetchedUsers.length > 0) {
          saveUsers(fetchedUsers, false);
        }
        refreshData();
      },
      (err) => {
        console.error('Admin users snapshot listener error:', err);
      }
    );

    // 2. Subscribe to Firestore Transactions collection in real time
    const unsubscribeTxs = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        const fetchedTxs: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const t = docSnap.data() as Transaction;
          if (t && t.id) {
            fetchedTxs.push(t);
          }
        });
        if (fetchedTxs.length > 0) {
          saveTransactions(fetchedTxs, false);
        }
        refreshData();
      },
      (err) => {
        console.error('Admin transactions snapshot listener error:', err);
      }
    );

    // 3. Subscribe to Firestore Investments collection in real time
    const unsubscribeInvestments = onSnapshot(
      collection(db, 'investments'),
      (snapshot) => {
        const fetchedInvs: UserInvestment[] = [];
        snapshot.forEach((docSnap) => {
          const inv = docSnap.data() as UserInvestment;
          if (inv && inv.id) {
            fetchedInvs.push(inv);
          }
        });
        if (fetchedInvs.length > 0) {
          saveInvestments(fetchedInvs, false);
        }
        refreshData();
      },
      (err) => {
        console.error('Admin investments snapshot listener error:', err);
      }
    );

    return () => {
      window.removeEventListener('vaultix_users_updated', handleUpdate);
      window.removeEventListener('vaultix_txs_updated', handleUpdate);
      window.removeEventListener('vaultix_investments_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(priceInterval);
      unsubscribeUsers();
      unsubscribeTxs();
      unsubscribeInvestments();
    };
  }, []);

  // Filtered Users Search (Username, Email, Account ID)
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      Boolean(u?.username && typeof u.username === 'string' && u.username.toLowerCase().includes(q)) ||
      Boolean(u?.email && typeof u.email === 'string' && u.email.toLowerCase().includes(q)) ||
      Boolean(u?.accountId && typeof u.accountId === 'string' && u.accountId.toLowerCase().includes(q)) ||
      Boolean(u?.userId && typeof u.userId === 'string' && u.userId.toLowerCase().includes(q)) ||
      Boolean(u?.fullName && typeof u.fullName === 'string' && u.fullName.toLowerCase().includes(q))
    );
  });

  const pendingDeposits = transactions.filter((t) => t.type === 'DEPOSIT' && t.status === 'PENDING');
  const approvedDeposits = transactions.filter((t) => t.type === 'DEPOSIT' && (t.status === 'APPROVED' || t.status === 'COMPLETED'));
  const pendingWithdrawals = transactions.filter((t) => t.type === 'WITHDRAWAL' && t.status === 'PENDING');

  const [processingTxId, setProcessingTxId] = useState<string | null>(null);
  const processingTxIdsRef = useRef<Set<string>>(new Set());

  // Deposit Actions
  const handleApproveDeposit = async (txId: string) => {
    if (processingTxIdsRef.current.has(txId)) return; // Synchronous zero-latency double-click guard
    processingTxIdsRef.current.add(txId);
    setProcessingTxId(txId);
    setError(null);
    try {
      const res = await approveDepositTransaction(currentAdmin, txId);
      const cbNote = res.tx.cashbackAwarded && res.tx.cashbackAmount
        ? ` (including +$${res.tx.cashbackAmount.toFixed(2)} 0.5% First-Deposit Cashback)`
        : '';
      setMsg(`Deposit ${txId} approved! Credited $${(res.tx.usdValuation || res.tx.amount).toFixed(2)} USD${cbNote} to @${res.user.username}.`);
      refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve deposit.');
    } finally {
      processingTxIdsRef.current.delete(txId);
      setProcessingTxId(null);
    }
  };

  const handleRejectDeposit = async (txId: string) => {
    if (processingTxIdsRef.current.has(txId)) return;
    processingTxIdsRef.current.add(txId);
    setProcessingTxId(txId);
    setError(null);
    try {
      await rejectDepositTransaction(currentAdmin, txId, rejectReason || 'Admin Rejection');
      setMsg(`Deposit ${txId} rejected.`);
      setRejectReason('');
      refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject deposit.');
    } finally {
      processingTxIdsRef.current.delete(txId);
      setProcessingTxId(null);
    }
  };

  const handleCancelDeposit = async (txId: string) => {
    if (processingTxIdsRef.current.has(txId)) return;
    processingTxIdsRef.current.add(txId);
    setProcessingTxId(txId);
    setError(null);
    try {
      await cancelDepositTransaction(currentAdmin, txId);
      setMsg(`Deposit ${txId} cancelled.`);
      refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel deposit.');
    } finally {
      processingTxIdsRef.current.delete(txId);
      setProcessingTxId(null);
    }
  };

  // Withdrawal Actions
  const handleApproveWithdrawal = async (txId: string) => {
    if (processingTxIdsRef.current.has(txId)) return;
    processingTxIdsRef.current.add(txId);
    setProcessingTxId(txId);
    setError(null);
    try {
      const res = await approveWithdrawalTransaction(currentAdmin, txId);
      setMsg(`Withdrawal ${txId} approved and completed for @${res.user.username}!`);
      refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve withdrawal.');
    } finally {
      processingTxIdsRef.current.delete(txId);
      setProcessingTxId(null);
    }
  };

  const handleCancelWithdrawal = async (txId: string) => {
    if (processingTxIdsRef.current.has(txId)) return;
    processingTxIdsRef.current.add(txId);
    setProcessingTxId(txId);
    setError(null);
    try {
      const res = await cancelWithdrawalTransaction(currentAdmin, txId, rejectReason || 'Administrative cancellation');
      setMsg(`Withdrawal ${txId} cancelled. Refunded $${res.tx.amount.toFixed(2)} back to @${res.user.username}.`);
      setRejectReason('');
      refreshData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel withdrawal.');
    } finally {
      processingTxIdsRef.current.delete(txId);
      setProcessingTxId(null);
    }
  };

  const handleToggleUserStatus = (targetUser: User) => {
    const newStatus = targetUser.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const allUsers = getUsers();
    const idx = allUsers.findIndex((u) => u.userId === targetUser.userId);
    if (idx !== -1) {
      allUsers[idx].accountStatus = newStatus;
      saveUsers(allUsers);
    }

    const logs = getAuditLogs();
    logs.unshift({
      id: `AUDIT-${Math.floor(10000 + Math.random() * 90000)}`,
      adminId: currentAdmin.userId,
      action: 'USER_STATUS_CHANGE',
      targetUserId: targetUser.userId,
      targetUsername: targetUser.username,
      previousValue: targetUser.accountStatus,
      newValue: newStatus,
      timestamp: new Date().toISOString()
    });
    saveAuditLogs(logs);

    setMsg(`Account status for @${targetUser.username} set to ${newStatus}.`);
    refreshData();
    if (selectedUser?.userId === targetUser.userId) {
      setSelectedUser({ ...targetUser, accountStatus: newStatus });
    }
  };

  const handleAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const amt = Number(adjustAmount);
    if (isNaN(amt) || amt === 0) {
      setError('Please enter a valid non-zero adjustment amount.');
      return;
    }

    const allUsers = getUsers();
    const idx = allUsers.findIndex((u) => u.userId === selectedUser.userId);
    if (idx !== -1) {
      const oldBal = allUsers[idx].balance;
      allUsers[idx].balance += amt;
      saveUsers(allUsers);

      const logs = getAuditLogs();
      logs.unshift({
        id: `AUDIT-${Math.floor(10000 + Math.random() * 90000)}`,
        adminId: currentAdmin.userId,
        action: 'BALANCE_ADJUST',
        targetUserId: selectedUser.userId,
        targetUsername: selectedUser.username,
        previousValue: `$${oldBal.toFixed(2)}`,
        newValue: `$${allUsers[idx].balance.toFixed(2)}`,
        reason: adjustNote || 'Manual Balance Adjustment',
        timestamp: new Date().toISOString()
      });
      saveAuditLogs(logs);

      setSelectedUser({ ...allUsers[idx] });
      setAdjustAmount('');
      setAdjustNote('');
      setMsg(`Adjusted balance for @${selectedUser.username} by $${amt.toFixed(2)}.`);
      refreshData();
    }
  };

  const handleSaveWallets = (updatedWallets: CryptoWalletConfig[]) => {
    saveWallets(updatedWallets);
    setWallets(updatedWallets);

    const logs = getAuditLogs();
    logs.unshift({
      id: `AUDIT-${Math.floor(10000 + Math.random() * 90000)}`,
      adminId: currentAdmin.userId,
      action: 'WALLET_CONFIG_CHANGED',
      targetUserId: 'SYSTEM',
      targetUsername: 'ALL_WALLETS',
      newValue: 'Updated Crypto Wallet Addresses',
      timestamp: new Date().toISOString()
    });
    saveAuditLogs(logs);

    setMsg('Crypto wallet configuration saved successfully!');
  };

  const handleSaveReferralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveReferralConfig(refConfig);
    setMsg('Referral parameters updated server-side!');
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-400 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5" />
            <span>Administrator Control Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Realtime user directory, deposit & withdrawal approvals, wallets, and audit logs
          </p>
        </div>

        <div className="flex flex-wrap gap-1 bg-[#141923] border border-[#2A3447] p-1 rounded-xl">
          <button
            onClick={() => setTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'users' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Users ({users.length})
          </button>

          <button
            onClick={() => setTab('deposits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              tab === 'deposits' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Deposits ({pendingDeposits.length})
            {pendingDeposits.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-amber-500 text-black font-extrabold rounded-full">
                {pendingDeposits.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('withdrawals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              tab === 'withdrawals' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Withdrawals ({pendingWithdrawals.length})
            {pendingWithdrawals.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-rose-500 text-white font-extrabold rounded-full">
                {pendingWithdrawals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('investments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'investments' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Investments ({investments.length})
          </button>

          <button
            onClick={() => setTab('all_txs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'all_txs' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Activity ({transactions.length})
          </button>

          <button
            onClick={() => setTab('wallets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'wallets' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Wallets & XRP
          </button>
          <button
            onClick={() => setTab('plans')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'plans' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => setTab('referral')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'referral' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Referral Config
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'audit' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{msg}</span>
          </div>
          <button onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* TAB 1: Realtime Users Directory */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by Username, Email, or Account ID..."
              className="w-full bg-[#141923] border border-[#2A3447] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="bg-[#141923] border border-[#2A3447] rounded-2xl overflow-hidden divide-y divide-[#2A3447]">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No user accounts found matching query.</div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.userId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1D2432]/50 transition-colors">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">@{u.username}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-300'}`}>
                        {u.role}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.accountStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {u.accountStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 space-y-1">
                      <div>
                        <span className="font-bold text-white">{u.fullName}</span> • {u.email} • Phone: <span className="font-mono text-emerald-400">{u.phoneNumber || 'N/A'}</span> • UID: <span className="font-mono text-slate-300">{u.userId}</span> • Acc ID: <span className="font-mono text-slate-300">{u.accountId}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] pt-0.5">
                        <span className="text-amber-400/90 font-semibold">Ref Code: <span className="font-mono text-amber-300">{u.referralCode || 'N/A'}</span></span>
                        <span className="text-indigo-400 font-semibold">
                          Invited By: <span className="font-mono text-indigo-300">{u.referredByDisplayName ? `${u.referredByDisplayName} (@${u.referredByUsername})` : u.referredByUsername ? `@${u.referredByUsername}` : 'Direct Signup'}</span>
                        </span>
                        <span className="text-emerald-400 font-semibold">Ref Rewards: <span className="font-mono text-emerald-300">${(u.referralEarnings || 0).toFixed(2)} USD</span></span>
                        <span className="text-slate-400">Registered: <span className="font-medium text-slate-300">{new Date(u.createdAt).toLocaleDateString()}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-2">
                      <div className="text-xs font-bold text-[#D4AF37]">${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-slate-400">Balance</div>
                    </div>

                    <button
                      onClick={() => handleToggleUserStatus(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        u.accountStatus === 'ACTIVE'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                      }`}
                    >
                      {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>

                    <button
                      onClick={() => setSelectedUser(u)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
                    >
                      Profile Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Pending Deposit Approvals */}
      {tab === 'deposits' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Pending Deposit Requests ({pendingDeposits.length})</span>
          </h3>

          {pendingDeposits.length === 0 ? (
            <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-8 text-center text-xs text-slate-400">
              No pending deposit requests awaiting authorization.
            </div>
          ) : (
            <div className="bg-[#141923] border border-[#2A3447] rounded-2xl divide-y divide-[#2A3447] overflow-hidden">
              {pendingDeposits.map((tx) => {
                const targetUser = users.find((u) => u.userId === tx.userId);
                return (
                  <div key={tx.id} className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-[#D4AF37]">{tx.id}</span>
                          <span className="text-xs text-white font-bold">@{targetUser?.username || tx.userId} ({targetUser?.fullName})</span>
                          <span className="text-[10px] text-slate-400">{targetUser?.email}</span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                            PENDING
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 space-x-2">
                          <span>Deposit: <strong className="text-emerald-400 font-mono">{tx.cryptoAmount || tx.amount} {tx.currency}</strong></span>
                          {tx.usdValuation && tx.currency !== 'USD' && tx.currency !== 'USDT' && (
                            <span className="text-[#D4AF37] font-mono font-bold">
                              (USD Equivalent: ${tx.usdValuation.toFixed(2)} USD • Price: ${tx.priceUsed?.toLocaleString()} USD)
                            </span>
                          )}
                          <span className="text-slate-500">• Submitted: {new Date(tx.timestamp).toLocaleString()}</span>
                        </div>

                        {tx.txHash && (
                          <div className="text-[11px] font-mono text-slate-400 bg-[#0B0E14] px-2.5 py-1 rounded-lg border border-[#2A3447]/60 select-all break-all">
                            <span className="text-slate-500">Blockchain Hash: </span>
                            <span className="text-emerald-400">{tx.txHash}</span>
                          </div>
                        )}

                        {targetUser && !targetUser.hasReceivedFirstDepositBonus && (
                          <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded inline-block border border-emerald-500/20">
                            ★ Qualifying for 0.5% First-Deposit Cashback (Est: ${((tx.usdValuation || tx.amount) * 0.005).toFixed(2)} USD)
                          </div>
                        )}
                        {targetUser && targetUser.hasReceivedFirstDepositBonus && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            First-Deposit Cashback: Already Claimed for this account
                          </div>
                        )}
                        {targetUser && (targetUser.referredBy || targetUser.referredByUsername) && !targetUser.hasReceivedSignupBonus && (
                          <div className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded inline-block border border-amber-500/20">
                            ★ Qualifying for $2 User Welcome Bonus & $5 Referrer (@{targetUser.referredByUsername}) Bonus
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleApproveDeposit(tx.id)}
                          disabled={processingTxId === tx.id}
                          className={`font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-md flex items-center space-x-1 ${
                            processingTxId === tx.id
                              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-black cursor-pointer'
                          }`}
                        >
                          {processingTxId === tx.id ? (
                            <span>Processing...</span>
                          ) : (
                            <span>Approve & Credit</span>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectDeposit(tx.id)}
                          disabled={processingTxId === tx.id}
                          className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleCancelDeposit(tx.id)}
                          disabled={processingTxId === tx.id}
                          className="bg-[#2A3447] hover:bg-slate-600 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Approved Deposits & 0.5% Cashback Ledger Audit Section */}
          <div className="pt-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Approved Deposits & 0.5% Cashback Audit Records ({approvedDeposits.length})</span>
            </h4>

            {approvedDeposits.length === 0 ? (
              <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 text-center text-xs text-slate-400">
                No approved deposits recorded yet.
              </div>
            ) : (
              <div className="bg-[#141923] border border-[#2A3447] rounded-2xl divide-y divide-[#2A3447] overflow-hidden">
                {approvedDeposits.map((tx) => {
                  const targetUser = users.find((u) => u.userId === tx.userId);
                  const isCashbackAwarded = Boolean(tx.cashbackAwarded);
                  const cashbackAmt = tx.cashbackAmount || (isCashbackAwarded ? (tx.usdValuation || tx.amount) * 0.005 : 0);

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTxForReceipt(tx)}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#1D2432]/40 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-[#D4AF37]">{tx.id}</span>
                          <span className="text-xs text-white font-bold">@{targetUser?.username || tx.userId}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                            APPROVED
                          </span>
                        </div>
                        <div className="text-xs text-slate-300">
                          <span>Verified Value: <strong className="text-emerald-400 font-mono">${(tx.usdValuation || tx.amount).toFixed(2)} USD</strong> ({tx.cryptoAmount || tx.amount} {tx.currency})</span>
                          <span className="text-slate-500"> • Processed: {new Date(tx.processedAt || tx.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-[11px] flex flex-wrap gap-x-4 gap-y-1 pt-1">
                          <span className="text-slate-400">
                            Cashback Rate: <span className="font-mono text-white font-semibold">0.5%</span>
                          </span>
                          <span className={isCashbackAwarded ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                            Cashback Status: {isCashbackAwarded ? `Awarded ($${cashbackAmt.toFixed(2)} USD)` : 'Not Awarded / Repeat Deposit'}
                          </span>
                          {tx.cashbackTxId && (
                            <span className="text-amber-400 font-mono">
                              Cashback TX: {tx.cashbackTxId}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-purple-400 font-bold hover:underline">View Deposit Slip →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Withdrawal Authorization & Processing */}
      {tab === 'withdrawals' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
              <span>Pending Withdrawal Authorization Requests ({pendingWithdrawals.length})</span>
            </h3>

            {pendingWithdrawals.length === 0 ? (
              <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-8 text-center text-xs text-slate-400">
                No pending withdrawal requests. All withdrawal requests are processed.
              </div>
            ) : (
              <div className="bg-[#141923] border border-[#2A3447] rounded-2xl divide-y divide-[#2A3447] overflow-hidden">
                {pendingWithdrawals.map((tx) => {
                  const targetUser = users.find((u) => u.userId === tx.userId);
                  const destAddr = tx.destinationAddress || (tx.note?.includes('->') ? tx.note.split('->')[1]?.trim() : '') || 'Address on file';
                  return (
                    <div key={tx.id} className="p-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-rose-400">{tx.id}</span>
                            <span className="text-xs text-white font-bold">@{targetUser?.username || 'Unknown'} ({targetUser?.fullName})</span>
                            <span className="text-[10px] text-slate-400">{targetUser?.email} • ID: {targetUser?.accountId}</span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                              PENDING
                            </span>
                            {tx.network && (
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                                {tx.network}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0B0E14] border border-[#2A3447] rounded-xl p-2.5 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Requested Amount</span>
                              <span className="font-extrabold text-white">${tx.amount.toFixed(2)} {tx.currency}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Fixed Fee</span>
                              <span className="font-bold text-rose-400">-${(tx.feeAmount !== undefined ? tx.feeAmount : 0.50).toFixed(2)} USD</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Net Payout</span>
                              <span className="font-extrabold text-emerald-400">${(tx.netAmount !== undefined ? tx.netAmount : Math.max(0, tx.amount - (tx.feeAmount ?? 0.50))).toFixed(2)} USD</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Request Time</span>
                              <span className="font-mono text-slate-300 text-[11px]">{new Date(tx.timestamp).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="bg-[#0B0E14] border border-slate-700/80 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                Full Destination Crypto Wallet Address (Not Truncated):
                              </span>
                              <button
                                onClick={() => copyToClipboard(destAddr)}
                                className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center space-x-1 cursor-pointer"
                              >
                                {copiedText === destAddr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedText === destAddr ? 'Copied' : 'Copy Address'}</span>
                              </button>
                            </div>
                            <span className="font-mono text-xs text-[#D4AF37] select-all font-bold break-all block">
                              {destAddr}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 self-start md:self-center pt-2 md:pt-0">
                          <button
                            onClick={() => handleApproveWithdrawal(tx.id)}
                            disabled={processingTxId === tx.id}
                            className={`font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md ${
                              processingTxId === tx.id
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-black cursor-pointer'
                            }`}
                          >
                            {processingTxId === tx.id ? 'Processing...' : 'Approve Withdrawal'}
                          </button>

                          <button
                            onClick={() => handleCancelWithdrawal(tx.id)}
                            disabled={processingTxId === tx.id}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                          >
                            Cancel & Refund
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Processed Withdrawals History */}
          <div className="space-y-3 pt-4 border-t border-[#2A3447]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Processed Withdrawal Decisions History
            </h4>
            <div className="bg-[#141923] border border-[#2A3447] rounded-2xl divide-y divide-[#2A3447] overflow-hidden">
              {transactions
                .filter((t) => (t.type === 'WITHDRAWAL' || t.type === 'BONUS_WITHDRAWAL') && t.status !== 'PENDING')
                .slice(0, 15)
                .map((tx) => {
                  const targetUser = users.find((u) => u.userId === tx.userId);
                  const isApproved = tx.status === 'APPROVED';
                  return (
                    <div key={tx.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-300">{tx.id}</span>
                          <span className="text-white font-semibold">@{targetUser?.username || tx.userId}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${
                              isApproved
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Net: <strong className="text-white font-mono">${(tx.netAmount || tx.amount).toFixed(2)} {tx.currency}</strong> • Decision Time: {new Date(tx.processedAt || tx.timestamp).toLocaleString()}
                        </div>
                        {tx.destinationAddress && (
                          <div className="text-[10px] font-mono text-slate-500 truncate max-w-md">
                            To: {tx.destinationAddress}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-[11px] text-slate-500 font-mono">
                        {tx.processedAt ? new Date(tx.processedAt).toLocaleDateString() : ''}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3.2: User Investment Portfolios & Active Yield Plans */}
      {tab === 'investments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              <span>User Investments & Active Vaults ({investments.length})</span>
            </h3>
            <span className="text-xs text-slate-400">
              Total Invested Capital: <strong className="text-[#D4AF37] font-mono">${investments.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString()}</strong>
            </span>
          </div>

          {investments.length === 0 ? (
            <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-8 text-center text-xs text-slate-400">
              No user investments currently active or subscribed.
            </div>
          ) : (
            <div className="bg-[#141923] border border-[#2A3447] rounded-2xl divide-y divide-[#2A3447] overflow-hidden">
              {investments.map((inv) => {
                const targetUser = users.find((u) => u.userId === inv.userId);
                const accrued = getAccruedProfitForInvestment(inv);
                const isCompleted = inv.status === 'COMPLETED';

                return (
                  <div key={inv.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#1D2432]/30 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#D4AF37]">{inv.id}</span>
                        <span className="text-xs text-white font-bold">@{targetUser?.username || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Account {targetUser?.accountId}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {inv.status || 'ACTIVE'}
                        </span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-400 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
                          {inv.asset}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 font-semibold">
                        {inv.planName}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0B0E14] border border-[#2A3447] rounded-xl p-2.5 text-xs mt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Principal Invested</span>
                          <span className="font-extrabold text-white">${inv.amount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Daily Return</span>
                          <span className="font-bold text-emerald-400 font-mono">+${inv.dailyReturn.toFixed(2)}/day</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Accrued Yield</span>
                          <span className="font-bold text-[#D4AF37] font-mono">+${accrued.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Lock Duration</span>
                          <span className="font-mono text-slate-300">{inv.durationDays} Days</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">
                        Started: {new Date(inv.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3.5: All Platform Activity & Transaction History */}
      {tab === 'all_txs' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter activity by Username, Email, TX ID, or Note..."
              className="w-full bg-[#141923] border border-[#2A3447] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="bg-[#141923] border border-[#2A3447] rounded-2xl overflow-hidden divide-y divide-[#2A3447]">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No platform activity recorded yet.</div>
            ) : (
              transactions
                .filter((tx) => {
                  const q = searchQuery.toLowerCase().trim();
                  if (!q) return true;
                  const u = users.find((x) => x?.userId === tx?.userId);
                  return (
                    Boolean(tx?.id && typeof tx.id === 'string' && tx.id.toLowerCase().includes(q)) ||
                    Boolean(tx?.type && typeof tx.type === 'string' && tx.type.toLowerCase().includes(q)) ||
                    Boolean(tx?.note && typeof tx.note === 'string' && tx.note.toLowerCase().includes(q)) ||
                    (u && (
                      Boolean(u?.username && typeof u.username === 'string' && u.username.toLowerCase().includes(q)) ||
                      Boolean(u?.email && typeof u.email === 'string' && u.email.toLowerCase().includes(q)) ||
                      Boolean(u?.userId && typeof u.userId === 'string' && u.userId.toLowerCase().includes(q))
                    ))
                  );
                })
                .map((tx) => {
                  const targetUser = users.find((u) => u.userId === tx.userId);
                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTxForReceipt(tx)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1D2432] transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-[#D4AF37]">{tx.id}</span>
                          <span className="font-bold text-white text-xs">@{targetUser?.username || tx.userId}</span>
                          <span className="text-[10px] text-slate-400">({targetUser?.fullName || 'User'})</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tx.status === 'APPROVED' || tx.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1">
                          {tx.note || tx.type} • <span className="text-slate-400">{new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`font-extrabold text-sm ${tx.type === 'WITHDRAWAL' || tx.type === 'ADMIN_DEBIT' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {tx.type === 'WITHDRAWAL' || tx.type === 'ADMIN_DEBIT' ? '-' : '+'}${tx.amount.toFixed(2)} {tx.currency || 'USD'}
                        </div>
                        <span className="text-[10px] text-purple-400 font-bold block">Click to view receipt</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Crypto Wallets & XRP Control */}
      {tab === 'wallets' && (
        <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-purple-400" />
              <span>Configure Admin Crypto Wallets (Includes XRP)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure wallet addresses, networks, and XRP Destination Tags</p>
          </div>

          <div className="space-y-4">
            {wallets.map((w, idx) => (
              <div key={w.symbol} className="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{w.name} ({w.symbol})</span>
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={w.isActive}
                      onChange={(e) => {
                        const next = [...wallets];
                        next[idx].isActive = e.target.checked;
                        setWallets(next);
                      }}
                      className="rounded accent-purple-500"
                    />
                    <span>Active</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Network</label>
                    <input
                      type="text"
                      value={w.network}
                      onChange={(e) => {
                        const next = [...wallets];
                        next[idx].network = e.target.value;
                        setWallets(next);
                      }}
                      className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Wallet Address</label>
                    <input
                      type="text"
                      value={w.address}
                      onChange={(e) => {
                        const next = [...wallets];
                        next[idx].address = e.target.value;
                        setWallets(next);
                      }}
                      className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                {w.symbol === 'XRP' && (
                  <div>
                    <label className="block text-xs text-amber-400 font-bold mb-1">XRP Destination Tag / Memo</label>
                    <input
                      type="text"
                      value={w.destinationTag || ''}
                      onChange={(e) => {
                        const next = [...wallets];
                        next[idx].destinationTag = e.target.value;
                        setWallets(next);
                      }}
                      placeholder="e.g. 908124"
                      className="w-full bg-[#0B0E14] border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => handleSaveWallets(wallets)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              SAVE CRYPTO WALLET CONFIGURATIONS
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: Investment Plans Config */}
      {tab === 'plans' && (
        <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Investment Plans Configuration ($10 – $100,000)</span>
          </h3>

          <div className="space-y-3">
            {plans.map((p, idx) => (
              <div key={p.id} className="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{p.name} ({p.asset})</span>
                  <label className="flex items-center space-x-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={p.isActive}
                      onChange={(e) => {
                        const next = [...plans];
                        next[idx].isActive = e.target.checked;
                        setPlans(next);
                        savePlans(next);
                      }}
                      className="rounded accent-purple-500"
                    />
                    <span>Active Plan</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-400 block">Min ($)</span>
                    <input
                      type="number"
                      value={p.minDeposit}
                      onChange={(e) => {
                        const next = [...plans];
                        next[idx].minDeposit = Number(e.target.value);
                        setPlans(next);
                        savePlans(next);
                      }}
                      className="w-full bg-[#0B0E14] border border-[#2A3447] rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block">Max ($)</span>
                    <input
                      type="number"
                      value={p.maxDeposit}
                      onChange={(e) => {
                        const next = [...plans];
                        next[idx].maxDeposit = Number(e.target.value);
                        setPlans(next);
                        savePlans(next);
                      }}
                      className="w-full bg-[#0B0E14] border border-[#2A3447] rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block">Daily Yield %</span>
                    <input
                      type="number"
                      step="0.1"
                      value={p.dailyYield}
                      onChange={(e) => {
                        const next = [...plans];
                        next[idx].dailyYield = Number(e.target.value);
                        setPlans(next);
                        savePlans(next);
                      }}
                      className="w-full bg-[#0B0E14] border border-[#2A3447] rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block">Lock Days</span>
                    <input
                      type="number"
                      value={p.lockDays}
                      onChange={(e) => {
                        const next = [...plans];
                        next[idx].lockDays = Number(e.target.value);
                        setPlans(next);
                        savePlans(next);
                      }}
                      className="w-full bg-[#0B0E14] border border-[#2A3447] rounded px-2 py-1 text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Referral Config */}
      {tab === 'referral' && (
        <form onSubmit={handleSaveReferralConfig} className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Central Referral Rules & Withdrawal Threshold</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Referral Reward Bonus ($)</label>
              <input
                type="number"
                value={refConfig.bonusAmount}
                onChange={(e) => setRefConfig({ ...refConfig, bonusAmount: Number(e.target.value) })}
                className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Referral Withdrawal Threshold ($)</label>
              <input
                type="number"
                value={refConfig.withdrawalThreshold}
                onChange={(e) => setRefConfig({ ...refConfig, withdrawalThreshold: Number(e.target.value) })}
                className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            SAVE REFERRAL CONFIGURATION
          </button>
        </form>
      )}

      {/* TAB 7: Administrative Audit Logs */}
      {tab === 'audit' && (
        <div className="bg-[#141923] border border-[#2A3447] rounded-2xl overflow-hidden divide-y divide-[#2A3447]">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No admin audit log actions recorded.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>Audit ID: {log.id} • Admin ID: {log.adminId}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="font-bold text-white">Target: @{log.targetUsername} ({log.action})</div>
                <div className="text-slate-300 text-[11px]">
                  {log.previousValue && `Previous: ${log.previousValue} -> `}
                  {log.newValue && `New: ${log.newValue}`}
                  {log.reason && ` Reason: ${log.reason}`}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Full Profile Inspection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141923] border border-[#2A3447] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <span>Full User Profile Inspection</span>
            </h3>

            <div className="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Username:</span><span className="font-bold text-white">@{selectedUser.username}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Full Name:</span><span className="text-white">{selectedUser.fullName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="text-white">{selectedUser.email}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Account ID:</span><span className="font-mono text-[#D4AF37]">{selectedUser.accountId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">User ID:</span><span className="font-mono text-slate-300">{selectedUser.userId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Registration Date:</span><span className="text-slate-300">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Account Status:</span><span className="font-bold text-emerald-400">{selectedUser.accountStatus}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Main Balance:</span><span className="font-extrabold text-[#D4AF37]">${selectedUser.balance.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Referral Earnings:</span><span className="font-bold text-emerald-400">${selectedUser.referralEarnings.toFixed(2)}</span></div>
            </div>

            {/* Adjust Balance Form */}
            <form onSubmit={handleAdjustBalance} className="space-y-3 pt-2 border-t border-[#2A3447]">
              <h4 className="text-xs font-bold text-white">Modify User Balance ($ USD)</h4>
              <input
                type="number"
                step="any"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Amount (e.g. 500 or -200)"
                className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                required
              />
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Reason for balance modification"
                className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                APPLY BALANCE ADJUSTMENT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Receipt Slip Modal */}
      <TransactionReceiptModal
        transaction={selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
      />
    </div>
  );
};
