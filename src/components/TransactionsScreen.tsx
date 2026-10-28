import React, { useState, useEffect } from 'react';
import { User, Transaction, TransactionType } from '../types';
import { getTransactions } from '../db';
import { 
  History, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  Gift, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Search, 
  Filter, 
  ExternalLink, 
  FileText,
  DollarSign
} from 'lucide-react';
import { TransactionReceiptModal } from './TransactionReceiptModal';

interface TransactionsScreenProps {
  user: User;
  onNavigateToWallet?: () => void;
  onNavigateToPlans?: () => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  user,
  onNavigateToWallet,
  onNavigateToPlans
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    getTransactions().filter((tx) => tx.userId === user.userId)
  );
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setTransactions(getTransactions().filter((tx) => tx.userId === user.userId));
    };

    window.addEventListener('vaultix_txs_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('vaultix_txs_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user.userId]);

  // Filtering & Sorting (newest first)
  const filteredTransactions = transactions
    .filter((tx) => {
      if (filterType === 'DEPOSIT') return tx.type === 'DEPOSIT';
      if (filterType === 'WITHDRAWAL') return tx.type === 'WITHDRAWAL';
      if (filterType === 'YIELD') return tx.type === 'YIELD';
      if (filterType === 'BONUS') return tx.type.includes('BONUS') || tx.type === 'REFERRAL_REWARD';
      return true;
    })
    .filter((tx) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q) ||
        tx.note?.toLowerCase().includes(q) ||
        tx.currency.toLowerCase().includes(q) ||
        (tx.txHash && tx.txHash.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Type styling helper
  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return {
          label: 'Deposit',
          icon: ArrowDownLeft,
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        };
      case 'WITHDRAWAL':
        return {
          label: 'Withdrawal',
          icon: ArrowUpRight,
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
        };
      case 'YIELD':
        return {
          label: 'Vault Yield',
          icon: TrendingUp,
          bg: 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30'
        };
      case 'REFERRAL_REWARD':
      case 'FIRST_DEPOSIT_BONUS':
      case 'BONUS_WITHDRAWAL':
        return {
          label: 'Bonus / Reward',
          icon: Gift,
          bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
        };
      default:
        return {
          label: type,
          icon: DollarSign,
          bg: 'bg-slate-500/15 text-slate-300 border-slate-500/30'
        };
    }
  };

  // Status styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return {
          label: 'Completed',
          icon: CheckCircle2,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        };
      case 'PENDING':
        return {
          label: 'Pending',
          icon: Clock,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        };
      case 'REJECTED':
      case 'CANCELLED':
        return {
          label: status === 'REJECTED' ? 'Rejected' : 'Cancelled',
          icon: XCircle,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
        };
      default:
        return {
          label: status,
          icon: Clock,
          color: 'text-slate-400 bg-slate-500/10 border-slate-500/30'
        };
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141923] border border-[#2A3447] p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-[#D4AF37] font-semibold text-xs tracking-wider uppercase">
            <History className="w-4 h-4" />
            <span>Financial Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Transaction History</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time verified on-chain deposits, yield payouts, withdrawals, and account audit logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigateToWallet && (
            <button
              onClick={onNavigateToWallet}
              className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b8982e] text-black text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Deposit Funds
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141923] border border-[#2A3447] p-3 rounded-xl">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'DEPOSIT', label: 'Deposits' },
            { id: 'WITHDRAWAL', label: 'Withdrawals' },
            { id: 'YIELD', label: 'Yields' },
            { id: 'BONUS', label: 'Bonuses' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-[#D4AF37] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#1D2432]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Reference, ID, or Asset..."
            className="w-full sm:w-64 pl-9 pr-3 py-1.5 bg-[#1D2432] border border-[#2A3447] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1D2432] border border-[#2A3447] flex items-center justify-center text-slate-500">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No transactions found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || filterType !== 'ALL'
                  ? 'No records match your selected filter. Clear your search or choose a different category.'
                  : 'Your account has no transactions yet. Make your first deposit or subscribe to a vault to see records here.'}
              </p>
            </div>
            {onNavigateToWallet && (
              <button
                onClick={onNavigateToWallet}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1D2432] hover:bg-[#2A3447] text-slate-200 text-xs font-bold rounded-xl border border-[#2A3447] transition-all cursor-pointer"
              >
                <span>Go to Wallet</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A3447] bg-[#10141D] text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4">Type & Details</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3447]/60 text-xs">
                {filteredTransactions.map((tx) => {
                  const typeMeta = getTypeBadge(tx.type);
                  const statusMeta = getStatusBadge(tx.status);
                  const Icon = typeMeta.icon;
                  const StatusIcon = statusMeta.icon;
                  const isPositive = tx.type === 'DEPOSIT' || tx.type === 'YIELD' || tx.type.includes('BONUS');

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-[#1D2432]/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${typeMeta.bg}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                              {typeMeta.label}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px] sm:max-w-xs">
                              {tx.note || `Ref: ${tx.id.slice(0, 16)}...`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-slate-200'}>
                          {isPositive ? '+' : '-'}${(Number(tx?.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <div className="text-[10px] text-slate-500 font-sans font-normal">
                          {tx.cryptoAmount && tx.cryptoAsset ? `${tx.cryptoAmount} ${tx.cryptoAsset}` : tx.currency}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusMeta.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                        {formatDate(tx.timestamp)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2A3447] transition-colors"
                          title="View Digital Receipt"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Digital Receipt Modal */}
      {selectedTx && (
        <TransactionReceiptModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};
