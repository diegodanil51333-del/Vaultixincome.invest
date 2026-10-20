import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { auth, db, collection, onSnapshot, query, where } from '../firebase';
import { getUsers } from '../db';

import { ArrowUpRight, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface ActiveNotification {
  id: string;
  maskedUserId: string;
  amountFormatted: string;
  planName: string;
}

export const PublicWithdrawalToast: React.FC = () => {
  const [activeToast, setActiveToast] = useState<ActiveNotification | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track shown withdrawal transaction IDs in sessionStorage to prevent repeating
    const getShownTxIds = (): Set<string> => {
      try {
        const stored = sessionStorage.getItem('vaultix_shown_withdrawal_txs');
        return stored ? new Set(JSON.parse(stored)) : new Set();
      } catch {
        return new Set();
      }
    };

    const markTxAsShown = (txId: string) => {
      try {
        const set = getShownTxIds();
        set.add(txId);
        sessionStorage.setItem('vaultix_shown_withdrawal_txs', JSON.stringify(Array.from(set)));
      } catch {
        // Fallback
      }
    };

    // Helper to mask account/user ID strictly into `VX****1234` format
    const maskAccountId = (rawId?: string, rawAccountId?: string): string => {
      const source = rawAccountId || rawId || 'VX100000';
      const clean = source.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const lastFour = clean.slice(-4) || '1234';
      return `VX****${lastFour}`;
    };

    // Helper to format plan name cleanly from note/transaction
    const parsePlanName = (tx: Transaction): string => {
      if (tx.note) {
        if (tx.note.includes('VVIP')) return 'VVIP Executive Plan';
        if (tx.note.includes('BTC') || tx.note.includes('Bitcoin')) return 'Bitcoin Alpha Vault';
        if (tx.note.includes('ETH') || tx.note.includes('Ethereum')) return 'Ethereum Staking Plus';
        if (tx.note.includes('XRP')) return 'XRP Cross-Border Liquidity';
        if (tx.note.includes('Starter')) return 'Micro Starter Vault';
        if (tx.note.includes('Bonus')) return 'Bonus Wallet Yield';
      }
      return tx.currency ? `${tx.currency} Vault` : 'Crypto Yield Vault';
    };

    // Only listen to Firestore if user is authenticated administrator with access to all transactions
    if (!auth.currentUser || auth.currentUser.email?.toLowerCase() !== 'vaultixincometeam@outlook.com') {
      return;
    }

    // Real-time Firestore snapshot listener for APPROVED / COMPLETED withdrawals
    const q = query(
      collection(db, 'transactions'),
      where('status', 'in', ['APPROVED', 'COMPLETED'])
    );


    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot) return;

        const shownIds = getShownTxIds();
        const freshApprovedWithdrawals: Transaction[] = [];

        snapshot.forEach((docSnap) => {
          const tx = docSnap.data() as Transaction;
          if (
            tx &&
            (tx.type === 'WITHDRAWAL' || tx.type === 'BONUS_WITHDRAWAL') &&
            (tx.status === 'APPROVED' || tx.status === 'COMPLETED') &&
            tx.id &&
            !shownIds.has(tx.id)
          ) {
            freshApprovedWithdrawals.push(tx);
          }
        });

        if (freshApprovedWithdrawals.length > 0) {
          // Sort by timestamp descending (newest first)
          freshApprovedWithdrawals.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          const targetTx = freshApprovedWithdrawals[0];
          const allUsers = getUsers();
          const targetUser = allUsers.find((u) => u.userId === targetTx.userId);

          const maskedId = maskAccountId(targetTx.userId, targetUser?.accountId);
          const plan = parsePlanName(targetTx);
          const amt = `$${targetTx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

          const notification: ActiveNotification = {
            id: targetTx.id,
            maskedUserId: maskedId,
            amountFormatted: amt,
            planName: plan
          };

          markTxAsShown(targetTx.id);
          setActiveToast(notification);

          // Auto-dismiss strictly after 5 seconds
          const timer = setTimeout(() => {
            setActiveToast((curr) => (curr?.id === targetTx.id ? null : curr));
          }, 5000);

          return () => clearTimeout(timer);
        }
      },
      (err) => {
        console.error('Public withdrawal toast listener error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  if (!activeToast) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md pointer-events-auto transition-all duration-300 ease-out transform animate-in fade-in slide-in-from-top-4">
      <div className="bg-[#141923]/95 backdrop-blur-md border border-[#D4AF37]/50 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center justify-between space-x-3 text-white">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/30 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white font-mono">{activeToast.maskedUserId}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>WITHDRAWAL</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 truncate">
              User <span className="font-mono font-bold text-amber-300">{activeToast.maskedUserId}</span> withdrew{' '}
              <span className="font-extrabold text-emerald-400">{activeToast.amountFormatted}</span> from{' '}
              <span className="font-medium text-white">{activeToast.planName}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
