import React, { useState, useEffect } from 'react';
import { User, Transaction, InvestmentPlan } from '../types';
import { getInvestments, getTransactions, getPlans } from '../db';
import { 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Calculator, 
  Layers, 
  Crown, 
  Zap, 
  DollarSign, 
  CheckCircle2, 
  Building2, 
  Sparkles,
  Lock,
  ChevronRight,
  Activity
} from 'lucide-react';

import { 
  BitcoinLogo, 
  EthereumLogo, 
  TetherLogo, 
  SolanaLogo, 
  BnbLogo, 
  XrpLogo 
} from './CryptoLogos';
import { HowItWorks } from './HowItWorks';
import { MarketTracker } from './MarketTracker';
import { TransactionReceiptModal } from './TransactionReceiptModal';

interface DashboardScreenProps {
  user: User;
  onNavigateToTab: (tab: 'vaults' | 'invite' | 'wallet') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onNavigateToTab }) => {
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  // Return Calculator State
  const [calcAsset, setCalcAsset] = useState<'USDT' | 'BTC' | 'ETH' | 'SOL'>('USDT');
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [calcDays, setCalcDays] = useState<number>(14);

  const [allInvestments, setAllInvestments] = useState<any[]>(() => getInvestments().filter((inv) => inv.userId === user.userId));
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(() => getTransactions().filter((tx) => tx.userId === user.userId));

  useEffect(() => {
    const handleUpdate = () => {
      setAllInvestments(getInvestments().filter((inv) => inv.userId === user.userId));
      setAllTransactions(getTransactions().filter((tx) => tx.userId === user.userId));
    };

    window.addEventListener('vaultix_txs_updated', handleUpdate);
    window.addEventListener('vaultix_investments_updated', handleUpdate);
    window.addEventListener('vaultix_users_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('vaultix_txs_updated', handleUpdate);
      window.removeEventListener('vaultix_investments_updated', handleUpdate);
      window.removeEventListener('vaultix_users_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user.userId]);

  const activeInvestments = allInvestments.filter((inv) => inv.status === 'ACTIVE');
  const completedInvestments = allInvestments.filter((inv) => inv.status === 'COMPLETED');
  const availablePlans = getPlans().filter((p) => p.isActive);

  // Dynamic Financial Metrics Calculation
  const mainBalance = user.balance || 0.0;
  const referralBalance = user.referralEarnings || 0.0;
  const activeVaultsValue = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0.0);
  
  const completedYields = completedInvestments.reduce((sum, inv) => sum + (inv.dailyReturn * inv.durationDays), 0.0);
  const totalYieldProfit = Math.max(user.totalProfitLoss || 0.0, completedYields);

  // Real Calculator Yield Rates based on institutional strategies
  const assetRates: Record<string, { dailyPct: number; planName: string }> = {
    USDT: { dailyPct: 2.5, planName: 'USDT High-Yield Liquidity Vault' },
    BTC: { dailyPct: 1.8, planName: 'Bitcoin Prime Reserve Vault' },
    ETH: { dailyPct: 2.2, planName: 'Ethereum Smart Arbitrage Vault' },
    SOL: { dailyPct: 3.0, planName: 'Solana High-Velocity Node' }
  };

  const selectedRate = assetRates[calcAsset] || assetRates.USDT;
  const calcDailyYield = (calcAmount * selectedRate.dailyPct) / 100;
  const calcTotalProfit = calcDailyYield * calcDays;
  const calcTotalReturn = calcAmount + calcTotalProfit;

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Institutional Crypto Reserve Header Banner */}
      <div className="bg-gradient-to-r from-[#141923] via-[#1A2230] to-[#141923] border border-[#D4AF37]/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle Treasury Glow Elements */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex items-center space-x-1.5 bg-[#10141D] border border-[#D4AF37]/50 px-3 py-1 rounded-full text-[#D4AF37] font-extrabold uppercase tracking-widest text-[10px] shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>VAULTIX DIGITAL ASSET PLATFORM</span>
              </div>
              <div className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 font-mono bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>100% Full Reserve Custody</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Institutional Wealth Terminal & Vaults
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Real-time multi-signature digital asset treasury custody, automated algorithmic arbitrage yield, and private wealth allocations for <span className="font-bold text-white">{user.fullName}</span> (Account <span className="font-mono text-[#D4AF37]">{user.accountId}</span>).
            </p>
          </div>

          <div className="flex flex-row lg:flex-col sm:flex-row gap-3 items-stretch lg:items-end">
            <button
              onClick={() => onNavigateToTab('wallet')}
              className="flex-1 sm:flex-initial bg-[#D4AF37] hover:bg-[#b8982e] text-black font-black px-5 py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-xl shadow-[#D4AF37]/15 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>DEPOSIT CAPITAL</span>
            </button>
            <button
              onClick={() => onNavigateToTab('vaults')}
              className="flex-1 sm:flex-initial bg-[#141923] hover:bg-[#1D2432] text-white font-bold px-5 py-3 rounded-xl text-xs border border-[#2A3447] hover:border-slate-500 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>EXPLORE ALL VAULTS</span>
            </button>
          </div>
        </div>

        {/* Dynamic Financial Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-[#2A3447]/80">
          <div className="bg-[#0B0E14]/80 p-4 rounded-2xl border border-[#2A3447]/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Main Available Balance</span>
              <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>
            <div className="text-xl md:text-2xl font-black text-[#D4AF37] mt-1 font-mono">
              ${mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Instant TRC20 Liquidity</span>
          </div>

          <div className="bg-[#0B0E14]/80 p-4 rounded-2xl border border-[#2A3447]/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Active Deployed Capital</span>
              <Lock className="w-3.5 h-3.5 text-[#06B6D4]" />
            </div>
            <div className="text-xl md:text-2xl font-black text-[#06B6D4] mt-1 font-mono">
              ${activeVaultsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">In Compounding Vaults</span>
          </div>

          <div className="bg-[#0B0E14]/80 p-4 rounded-2xl border border-[#2A3447]/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Yield & Profit</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1 font-mono">
              +${totalYieldProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-1 block">Daily Compound Interest</span>
          </div>

          <div className="bg-[#0B0E14]/80 p-4 rounded-2xl border border-[#2A3447]/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Referral Tier Balance</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl md:text-2xl font-black text-amber-300 mt-1 font-mono">
              ${referralBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Affiliate Commission Tier</span>
          </div>
        </div>
      </div>

      {/* Interactive Return & Yield Calculator Module */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#2A3447]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-lg md:text-xl font-black text-white">Investment Yield & Return Calculator</h2>
            </div>
            <p className="text-xs text-slate-400">
              Calculate projected compounding yield across crypto vaults and VVIP fixed-term strategies.
            </p>
          </div>

          {/* Asset Selection Tabs */}
          <div className="flex items-center bg-[#0B0E14] border border-[#2A3447] p-1 rounded-2xl">
            {(['USDT', 'BTC', 'ETH', 'SOL'] as const).map((ast) => (
              <button
                key={ast}
                onClick={() => setCalcAsset(ast)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                  calcAsset === ast
                    ? 'bg-[#D4AF37] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ast === 'BTC' && <BitcoinLogo className="w-3.5 h-3.5" />}
                {ast === 'ETH' && <EthereumLogo className="w-3.5 h-3.5" />}
                {ast === 'USDT' && <TetherLogo className="w-3.5 h-3.5" />}
                {ast === 'SOL' && <SolanaLogo className="w-3.5 h-3.5" />}
                <span>{ast}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                <span>Investment Capital ($ USD)</span>
                <span className="font-mono text-[#D4AF37] text-sm">${calcAmount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="50"
                max="50000"
                step="50"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="w-full h-2 bg-[#0B0E14] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {[100, 500, 1000, 5000, 10000, 25000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCalcAmount(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      calcAmount === preset
                        ? 'bg-[#1D2432] border-[#D4AF37] text-[#D4AF37]'
                        : 'bg-[#0B0E14] border-[#2A3447] text-slate-400 hover:text-white'
                    }`}
                  >
                    ${preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Strategy Term Duration</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { days: 7, label: '7 Days', badge: 'Starter' },
                  { days: 14, label: '14 Days', badge: 'Alpha' },
                  { days: 30, label: '30 Days', badge: 'Prime' },
                  { days: 60, label: '60 Days', badge: 'Executive' }
                ].map((term) => (
                  <button
                    key={term.days}
                    onClick={() => setCalcDays(term.days)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      calcDays === term.days
                        ? 'bg-[#1D2432] border-[#D4AF37] shadow-md shadow-[#D4AF37]/5'
                        : 'bg-[#0B0E14] border-[#2A3447] hover:border-slate-500'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 block">{term.badge}</span>
                    <span className="font-extrabold text-sm text-white">{term.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-5 bg-[#0B0E14] border border-[#2A3447] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="text-xs font-extrabold text-[#D4AF37] uppercase tracking-wider flex items-center justify-between">
              <span>Projected Yield Metrics</span>
              <span className="text-[10px] text-emerald-400 font-mono">+{selectedRate.dailyPct}% / DAY</span>
            </div>

            <div className="space-y-3 divide-y divide-[#2A3447]/60 text-xs">
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Daily Accrual:</span>
                <span className="font-mono font-bold text-emerald-400">+${calcDailyYield.toFixed(2)} / day</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Total Yield ({calcDays} Days):</span>
                <span className="font-mono font-bold text-emerald-400">+${calcTotalProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Total Maturity Payout:</span>
                <span className="font-mono font-black text-lg text-[#D4AF37]">${calcTotalReturn.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('vaults')}
              className="w-full bg-[#D4AF37] hover:bg-[#b8982e] text-black font-black py-3 rounded-xl text-xs transition-all shadow-lg shadow-[#D4AF37]/10 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>DEPLOY IN {calcAsset} VAULT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Featured Core Investment Strategy Vaults Layout */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-[#D4AF37]" />
              <span>Core Institutional Yield Vaults</span>
            </h3>
            <p className="text-xs text-slate-400">Verified algorithmic staking strategies and VVIP institutional allocations</p>
          </div>
          <button
            onClick={() => onNavigateToTab('vaults')}
            className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Plans</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Vault 1: USDT Liquidity */}
          <div className="bg-[#141923] border border-[#2A3447] hover:border-[#26A17B]/60 p-5 rounded-2xl space-y-4 transition-all shadow-xl group">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <TetherLogo className="w-9 h-9" />
                <div>
                  <h4 className="font-black text-white text-sm">USDT Prime Vault</h4>
                  <span className="text-[10px] text-slate-400 font-mono">TRC20 Liquidity Routing</span>
                </div>
              </div>
              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black px-2.5 py-1 rounded-full">
                2.5% / DAY
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Automated high-frequency arbitrage deployed across top decentralized lending markets.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#2A3447]">
              <div>
                <span className="text-slate-400 block text-[10px]">Min. Capital</span>
                <span className="font-bold text-white font-mono">$50.00</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Term Duration</span>
                <span className="font-bold text-slate-300">7 Days</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('vaults')}
              className="w-full bg-[#1D2432] hover:bg-[#26A17B] hover:text-black text-white font-extrabold py-2.5 rounded-xl text-xs transition-all border border-[#2A3447] cursor-pointer"
            >
              SUBSCRIBE STRATEGY
            </button>
          </div>

          {/* Vault 2: Bitcoin Alpha Staking */}
          <div className="bg-[#141923] border border-[#2A3447] hover:border-[#F7931A]/60 p-5 rounded-2xl space-y-4 transition-all shadow-xl group">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <BitcoinLogo className="w-9 h-9" />
                <div>
                  <h4 className="font-black text-white text-sm">Bitcoin Alpha Vault</h4>
                  <span className="text-[10px] text-slate-400 font-mono">BTC Sovereign Staking</span>
                </div>
              </div>
              <span className="bg-[#F7931A]/15 border border-[#F7931A]/30 text-[#F7931A] text-xs font-black px-2.5 py-1 rounded-full">
                1.8% / DAY
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Institutional cold-custody yield strategy generating daily satoshi compounding.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#2A3447]">
              <div>
                <span className="text-slate-400 block text-[10px]">Min. Capital</span>
                <span className="font-bold text-white font-mono">$100.00</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Term Duration</span>
                <span className="font-bold text-slate-300">14 Days</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('vaults')}
              className="w-full bg-[#1D2432] hover:bg-[#F7931A] hover:text-black text-white font-extrabold py-2.5 rounded-xl text-xs transition-all border border-[#2A3447] cursor-pointer"
            >
              SUBSCRIBE STRATEGY
            </button>
          </div>

          {/* Vault 3: VVIP Executive Tier 1 */}
          <div className="bg-[#141923] border border-amber-500/40 hover:border-amber-400 p-5 rounded-2xl space-y-4 transition-all shadow-xl shadow-amber-500/5 group relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-sm">VVIP Executive Tier</h4>
                  <span className="text-[10px] text-amber-400 font-mono">1-Month Fixed Lock</span>
                </div>
              </div>
              <span className="bg-amber-400 text-black text-xs font-black px-2.5 py-1 rounded-full">
                20% RETURN
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Private wealth institutional allocation with fixed 1-month return guarantee.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#2A3447]">
              <div>
                <span className="text-slate-400 block text-[10px]">Capital Range</span>
                <span className="font-bold text-white font-mono">$10,000 – $50,000</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Term Duration</span>
                <span className="font-bold text-amber-400">30 Days</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('vaults')}
              className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
            >
              INVEST IN VVIP TIER
            </button>
          </div>
        </div>
      </div>

      {/* Live Market Tracker Component */}
      <MarketTracker />

      {/* Active Investment Vaults Live Tracking */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            <span>Active Investment Vaults ({activeInvestments.length})</span>
          </h3>
          <button
            onClick={() => onNavigateToTab('vaults')}
            className="text-xs font-bold text-[#D4AF37] hover:underline cursor-pointer"
          >
            + Subscribe New Vault
          </button>
        </div>

        {activeInvestments.length === 0 ? (
          <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#1D2432] text-[#D4AF37] flex items-center justify-center mx-auto border border-[#2A3447]">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Active Vaults Subscribed</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You do not have any active yield vaults deployed. Select an algorithmic strategy or use the calculator above to begin earning daily compound interest.
            </p>
            <button
              onClick={() => onNavigateToTab('vaults')}
              className="bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Browse Yield Vaults
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeInvestments.map((inv) => (
              <div key={inv.id} className="bg-[#141923] border border-[#2A3447] rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{inv.planName}</h4>
                    <span className="text-[10px] text-[#D4AF37] font-semibold">{inv.asset} Institutional Strategy</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
                    <span>ACTIVE</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#2A3447] text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Principal</span>
                    <span className="font-bold text-white font-mono">${inv.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Daily Return</span>
                    <span className="font-bold text-emerald-400 font-mono">+${inv.dailyReturn.toFixed(2)}/d</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Duration</span>
                    <span className="font-bold text-slate-300 font-mono">{inv.durationDays} Days</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Started: {new Date(inv.startDate).toLocaleDateString()}</span>
                  <span className="text-emerald-400 font-semibold font-mono">Compounding Daily</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Recent Transactions Activity */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#06B6D4]" />
          <span>Recent Treasury Ledger Activity</span>
        </h3>

        {allTransactions.length === 0 ? (
          <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 text-center text-slate-400 text-xs">
            No recent transaction history recorded.
          </div>
        ) : (
          <div className="bg-[#141923] border border-[#2A3447] rounded-2xl divide-y divide-[#2A3447] overflow-hidden shadow-xl">
            {allTransactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTxForReceipt(tx)}
                className="p-4 flex items-center justify-between text-xs hover:bg-[#1D2432] transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_REWARD' || tx.type === 'FIRST_DEPOSIT_BONUS' || tx.type === 'ADMIN_CREDIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_REWARD' || tx.type === 'FIRST_DEPOSIT_BONUS' || tx.type === 'ADMIN_CREDIT' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-white">{tx.note || tx.type}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{new Date(tx.timestamp).toLocaleString()}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`font-black font-mono text-sm ${tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_REWARD' || tx.type === 'FIRST_DEPOSIT_BONUS' || tx.type === 'ADMIN_CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_REWARD' || tx.type === 'FIRST_DEPOSIT_BONUS' || tx.type === 'ADMIN_CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tx.status === 'APPROVED' || tx.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : tx.status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {tx.status === 'PENDING' ? 'Processing' : tx.status === 'APPROVED' || tx.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        transaction={selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
      />
    </div>
  );
};
