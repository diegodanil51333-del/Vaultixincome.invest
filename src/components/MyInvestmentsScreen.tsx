import React, { useState, useEffect } from 'react';
import { User, UserInvestment, InvestmentPlan } from '../types';
import { getInvestments, getPlans, getAccruedProfitForInvestment, getEffectiveDailyReturn, submitWithdrawalRequest, getUsers } from '../db';
import { 
  Briefcase, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  ArrowUpRight, 
  AlertCircle, 
  Lock, 
  Calendar, 
  ShieldCheck, 
  Percent, 
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

interface MyInvestmentsScreenProps {
  user: User;
  onNavigateToPlans: () => void;
  onNavigateToWallet?: () => void;
  onUserUpdated?: (user: User) => void;
}

export const MyInvestmentsScreen: React.FC<MyInvestmentsScreenProps> = ({
  user,
  onNavigateToPlans,
  onNavigateToWallet,
  onUserUpdated
}) => {
  const [investments, setInvestments] = useState<UserInvestment[]>(() =>
    getInvestments().filter((inv) => inv.userId === user.userId)
  );
  const [plans, setPlans] = useState<InvestmentPlan[]>(() => getPlans());
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Withdrawal modal state
  const [withdrawInv, setWithdrawInv] = useState<UserInvestment | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('TRC20 (Tron)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setInvestments(getInvestments().filter((inv) => inv.userId === user.userId));
      setPlans(getPlans());
      const freshUser = getUsers().find((u) => u.userId === user.userId);
      if (freshUser && onUserUpdated) {
        onUserUpdated(freshUser);
      }
    };

    window.addEventListener('vaultix_investments_updated', handleUpdate);
    window.addEventListener('vaultix_users_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('vaultix_investments_updated', handleUpdate);
      window.removeEventListener('vaultix_users_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user.userId, onUserUpdated]);

  const activeInvestments = investments.filter((i) => i.status === 'ACTIVE');
  const completedInvestments = investments.filter((i) => i.status === 'COMPLETED' || i.status === 'WITHDRAWN');

  const totalInvested = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalAccruedProfit = activeInvestments.reduce((sum, inv) => sum + getAccruedProfitForInvestment(inv), 0);

  const displayedInvestments = investments
    .filter((inv) => {
      if (filterStatus === 'ACTIVE') return inv.status === 'ACTIVE';
      if (filterStatus === 'COMPLETED') return inv.status === 'COMPLETED' || inv.status === 'WITHDRAWN';
      return true;
    })
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  // Calculates remaining days and progress percent
  const getProgressInfo = (inv: UserInvestment) => {
    const start = new Date(inv.startDate).getTime();
    const durationMs = inv.durationDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const elapsedMs = Math.max(0, now - start);
    const progress = Math.min(100, Math.round((elapsedMs / durationMs) * 100));
    const elapsedDays = Math.min(inv.durationDays, Math.floor(elapsedMs / (24 * 60 * 60 * 1000)));
    const remainingDays = Math.max(0, inv.durationDays - elapsedDays);
    const isMatured = remainingDays === 0;

    return { progress, elapsedDays, remainingDays, isMatured };
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawInv) return;
    setModalError(null);
    setModalSuccess(null);

    if (!withdrawAddress.trim() || withdrawAddress.trim().length < 10) {
      setModalError('Please enter a valid destination cryptocurrency wallet address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const accrued = getAccruedProfitForInvestment(withdrawInv);
      const totalPayout = withdrawInv.amount + accrued;

      await submitWithdrawalRequest(
        user,
        totalPayout,
        `${withdrawInv.asset || 'USDT'} - ${withdrawNetwork}`,
        withdrawAddress.trim(),
        `Matured Principal + Yields from ${withdrawInv.planName} (Inv: ${withdrawInv.id})`
      );

      setModalSuccess(`Withdrawal request of $${totalPayout.toFixed(2)} submitted successfully! It is now pending verification.`);
      setTimeout(() => {
        setWithdrawInv(null);
        setModalSuccess(null);
      }, 2000);
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141923] border border-[#2A3447] p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-[#D4AF37] font-semibold text-xs tracking-wider uppercase">
            <Briefcase className="w-4 h-4" />
            <span>Portfolio Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">My Investments</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time tracking of active algorithmic vaults, accrued yields, lockup countdowns, and principal returns.
          </p>
        </div>

        <button
          onClick={onNavigateToPlans}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#b8982e] text-black text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Explore Investment Plans</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#141923] border border-[#2A3447] p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Capital</span>
          <div className="text-xl font-mono font-black text-white">
            ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">{activeInvestments.length} Active Positions</span>
        </div>

        <div className="bg-[#141923] border border-[#2A3447] p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Accrued Yields</span>
          <div className="text-xl font-mono font-black text-emerald-400">
            +${totalAccruedProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-500/80">Compounding Daily</span>
        </div>

        <div className="bg-[#141923] border border-[#2A3447] p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Vaults</span>
          <div className="text-xl font-mono font-black text-[#D4AF37]">
            {investments.length}
          </div>
          <span className="text-[10px] text-slate-500">{completedInvestments.length} Completed</span>
        </div>

        <div className="bg-[#141923] border border-[#2A3447] p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Available Balance</span>
          <div className="text-xl font-mono font-black text-white">
            ${(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Unallocated Funds</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-[#141923] border border-[#2A3447] p-1.5 rounded-xl self-start max-w-fit">
        {[
          { id: 'ALL', label: `All (${investments.length})` },
          { id: 'ACTIVE', label: `Active (${activeInvestments.length})` },
          { id: 'COMPLETED', label: `Completed (${completedInvestments.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === tab.id
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Investments List */}
      {displayedInvestments.length === 0 ? (
        <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1D2432] border border-[#2A3447] flex items-center justify-center text-slate-500">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No investment records found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {filterStatus === 'ACTIVE'
                ? 'You currently have no active investment positions. Choose an investment plan to start generating daily yields.'
                : 'Your portfolio has no investment records yet. Explore our curated cryptocurrency vaults to get started.'}
            </p>
          </div>
          <button
            onClick={onNavigateToPlans}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b8982e] text-black text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>Browse Investment Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedInvestments.map((inv) => {
            const plan = plans.find((p) => p.id === inv.planId);
            const accruedProfit = getAccruedProfitForInvestment(inv);
            const dailyRate = inv.dailyReturn || plan?.dailyYield || 1.5;
            const dailyEstimated = (inv.amount * dailyRate) / 100;
            const { progress, elapsedDays, remainingDays, isMatured } = getProgressInfo(inv);
            const isActive = inv.status === 'ACTIVE';

            return (
              <div
                key={inv.id}
                className="bg-[#141923] border border-[#2A3447] hover:border-[#D4AF37]/40 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest bg-[#10141D] px-2 py-0.5 rounded border border-[#2A3447]">
                          {inv.asset || 'USDT'} Vault
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isActive
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            : 'text-slate-400 bg-slate-500/10 border-slate-500/30'
                        }`}>
                          {isActive ? '● Active' : 'Completed'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-base text-white mt-1.5">{inv.planName}</h3>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {inv.id.slice(0, 18)}</div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Principal</span>
                      <div className="text-lg font-mono font-black text-white">
                        ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Profit & Yield Metrics */}
                  <div className="grid grid-cols-3 gap-2 bg-[#10141D] p-3 rounded-xl border border-[#2A3447]">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Daily Rate</span>
                      <span className="text-xs font-mono font-bold text-[#D4AF37]">{dailyRate.toFixed(2)}% / day</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Daily Yield</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">+${dailyEstimated.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total Accrued</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">+${accruedProfit.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Progress Bar & Timeline */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lockup Timeline</span>
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-300">
                        {isMatured ? 'Strategy Matured' : `${remainingDays} days remaining (${elapsedDays}/${inv.durationDays}d)`}
                      </span>
                    </div>
                    <div className="w-full bg-[#1D2432] h-2 rounded-full overflow-hidden border border-[#2A3447]">
                      <div
                        className="bg-gradient-to-r from-[#D4AF37] to-amber-200 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-[#2A3447]/60 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Started: <span className="text-slate-300 font-mono">{new Date(inv.startDate).toLocaleDateString()}</span>
                  </div>

                  {isActive && isMatured ? (
                    <button
                      onClick={() => setWithdrawInv(inv)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded-lg shadow transition-all cursor-pointer flex items-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Withdraw Matured Vault</span>
                    </button>
                  ) : isActive ? (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Term locked until maturity</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Payout Released</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Withdrawal Modal for Matured Vault */}
      {withdrawInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141923] border border-[#D4AF37]/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A3447] pb-3">
              <h3 className="font-bold text-white text-base">Withdraw Matured Investment</h3>
              <button
                onClick={() => setWithdrawInv(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#1D2432] p-3 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan:</span>
                <span className="text-white font-bold">{withdrawInv.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Principal Amount:</span>
                <span className="text-white font-mono">${withdrawInv.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Accrued Yields:</span>
                <span className="text-emerald-400 font-mono">+${getAccruedProfitForInvestment(withdrawInv).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#2A3447] pt-2 text-sm font-bold">
                <span className="text-[#D4AF37]">Total Payout:</span>
                <span className="text-[#D4AF37] font-mono">
                  ${(withdrawInv.amount + getAccruedProfitForInvestment(withdrawInv)).toFixed(2)}
                </span>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Destination Crypto Network</label>
                <select
                  value={withdrawNetwork}
                  onChange={(e) => setWithdrawNetwork(e.target.value)}
                  className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="TRC20 (Tron)">USDT - TRC20 (Tron)</option>
                  <option value="ERC20 (Ethereum)">USDT - ERC20 (Ethereum)</option>
                  <option value="BEP20 (BNB Smart Chain)">USDT - BEP20 (BNB Chain)</option>
                  <option value="Bitcoin Network">BTC - Native Bitcoin</option>
                  <option value="Solana Network">SOL - Native Solana</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Your External Wallet Address</label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Paste your recipient address..."
                  className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawInv(null)}
                  className="px-4 py-2 bg-[#1D2432] text-slate-300 text-xs font-semibold rounded-xl hover:bg-[#2A3447]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b8982e] text-black text-xs font-bold rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
