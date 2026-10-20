import React, { useEffect } from 'react';
import { Transaction } from '../types';
import { X, CheckCircle2, Clock, AlertCircle, XCircle, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface TransactionReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({ transaction, onClose }) => {
  useEffect(() => {
    if (transaction) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [transaction, onClose]);

  if (!transaction) return null;

  const isPositive =
    transaction.type === 'DEPOSIT' ||
    transaction.type === 'REFERRAL_REWARD' ||
    transaction.type === 'FIRST_DEPOSIT_BONUS' ||
    transaction.type === 'ADMIN_CREDIT' ||
    transaction.type === 'YIELD';

  const getStatusBadge = () => {
    const status = transaction.status.toUpperCase();
    if (status === 'APPROVED' || status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
        </span>
      );
    }
    if (status === 'PENDING' || status === 'SUBMITTED' || status === 'PROCESSING') {
      return (
        <span className="inline-flex items-center space-x-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span>Processing</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold px-3 py-1 rounded-full">
        <XCircle className="w-3.5 h-3.5" />
        <span>Cancelled / Failed</span>
      </span>
    );
  };

  const formattedType = () => {
    switch (transaction.type) {
      case 'DEPOSIT':
        return 'Deposit Notification';
      case 'WITHDRAWAL':
        return 'Fund Withdrawal';
      case 'REFERRAL_REWARD':
        return 'Referral Signup Reward';
      case 'FIRST_DEPOSIT_BONUS':
        return '0.5% First-Deposit Cashback';
      case 'YIELD':
        return 'Yield Vault Return';
      case 'ADMIN_CREDIT':
        return 'System Credit';
      case 'ADMIN_DEBIT':
        return 'System Adjustment';
      default:
        return transaction.type;
    }
  };

  const formattedDate = new Date(transaction.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const formattedTime = new Date(transaction.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#141923] border border-[#2A3447] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-white my-auto transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Right Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-[#1D2432] p-2 rounded-full border border-[#2A3447] transition-all cursor-pointer"
          aria-label="Close Slip"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Receipt Header */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="relative">
            <img
              src="/logo.jpg"
              alt="Vaultix Income"
              className="w-16 h-16 rounded-full border-2 border-[#D4AF37] object-cover shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 text-black shadow-md">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-black text-[#D4AF37] tracking-wider uppercase">VAULTIX INCOME</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
              Official Transaction Receipt
            </span>
          </div>
        </div>

        {/* Amount Banner */}
        <div className="bg-[#1D2432] border border-[#2A3447] rounded-2xl p-5 text-center space-y-1">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{formattedType()}</div>
          <div className={`text-2xl sm:text-3xl font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transaction.currency || 'USD'}
          </div>
          <div className="pt-2 flex justify-center">{getStatusBadge()}</div>
        </div>

        {/* Key Transaction Detail Fields */}
        <div className="bg-[#0B0E14] border border-[#2A3447] rounded-2xl p-4 divide-y divide-[#2A3447] text-xs space-y-2.5">
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-400">Transaction ID</span>
            <span className="font-mono font-bold text-[#D4AF37]">{transaction.id}</span>
          </div>

          <div className="flex justify-between items-center pt-2.5">
            <span className="text-slate-400">Transaction Type</span>
            <span className="font-bold text-white">{formattedType()}</span>
          </div>

          <div className="flex justify-between items-center pt-2.5">
            <span className="text-slate-400">Asset Currency</span>
            <span className="font-bold text-white">{transaction.currency || 'USD'}</span>
          </div>

          {transaction.relatedDepositId && (
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-400">Qualifying Deposit</span>
              <span className="font-mono font-bold text-amber-300">{transaction.relatedDepositId}</span>
            </div>
          )}

          {transaction.type === 'DEPOSIT' && transaction.usdValuation && (
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-400">Verified USD Value</span>
              <span className="font-mono font-bold text-emerald-400">${transaction.usdValuation.toFixed(2)} USD</span>
            </div>
          )}

          {transaction.type === 'DEPOSIT' && transaction.cashbackAwarded && (
            <div className="flex justify-between items-center pt-2.5">
              <span className="text-slate-400">0.5% Cashback</span>
              <span className="font-mono font-bold text-emerald-400">
                +${(transaction.cashbackAmount || (transaction.usdValuation || transaction.amount) * 0.005).toFixed(2)} USD {transaction.cashbackTxId ? `(${transaction.cashbackTxId})` : ''}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2.5">
            <span className="text-slate-400">Date</span>
            <span className="font-medium text-slate-200">{formattedDate}</span>
          </div>

          <div className="flex justify-between items-center pt-2.5">
            <span className="text-slate-400">Time</span>
            <span className="font-mono text-slate-200">{formattedTime}</span>
          </div>

          {transaction.note && (
            <div className="pt-2.5 space-y-1">
              <span className="text-slate-400 block text-[11px]">Description / Note</span>
              <p className="text-slate-200 font-sans text-xs bg-[#141923] p-2.5 rounded-xl border border-[#2A3447] leading-relaxed">
                {transaction.note}
              </p>
            </div>
          )}
        </div>

        {/* Security & Support Footer */}
        <div className="text-[10px] text-center text-slate-400 space-y-1 pt-1">
          <p>Verified by Vaultix Income Immutable Ledger Engine</p>
          <p className="text-slate-500 font-mono">Timestamp: {new Date(transaction.timestamp).toISOString()}</p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold py-3.5 rounded-xl text-xs transition-all shadow-lg cursor-pointer uppercase tracking-wider"
        >
          CLOSE RECEIPT SLIP
        </button>
      </div>
    </div>
  );
};
