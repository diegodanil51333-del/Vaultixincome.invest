import React, { useState, useEffect } from 'react';
import { User, Transaction, InvestmentPlan, UserInvestment } from '../types';
import { getInvestments, getTransactions, getPlans, getAccruedProfitForInvestment } from '../db';
import { NavTab } from './Sidebar';
import { 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight,
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  History,
  Briefcase,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { 
  BitcoinLogo, 
  EthereumLogo, 
  TetherLogo, 
  SolanaLogo, 
  BnbLogo, 
  XrpLogo 
} from './CryptoLogos';
import { cryptoPriceService, CryptoPriceData } from '../services/cryptoPriceService';
import { TransactionReceiptModal } from './TransactionReceiptModal';

interface DashboardScreenProps {
  user: User;
  onNavigateToTab: (tab: NavTab) => void;
  onOpenGuide?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  user, 
  onNavigateToTab,
  onOpenGuide 
}) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Authenticated User Records
  // Safe defensive filtered records
  const [investments, setInvestments] = useState<UserInvestment[]>(() => 
    (getInvestments() || []).filter((inv) => Boolean(inv && inv.userId === user?.userId))
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    (getTransactions() || []).filter((tx) => Boolean(tx && tx.userId === user?.userId))
  );
  const [plans, setPlans] = useState<InvestmentPlan[]>(() => 
    (getPlans() || []).filter((p) => Boolean(p && p.isActive))
  );

  // Live Crypto Prices
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, CryptoPriceData>>(() => 
    cryptoPriceService.getAllCachedPrices()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setInvestments((getInvestments() || []).filter((inv) => Boolean(inv && inv.userId === user?.userId)));
      setTransactions((getTransactions() || []).filter((tx) => Boolean(tx && tx.userId === user?.userId)));
      setPlans((getPlans() || []).filter((p) => Boolean(p && p.isActive)));
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

  useEffect(() => {
    let isMounted = true;
    cryptoPriceService.fetchAllPrices().then((res) => {
      if (isMounted) setCryptoPrices(res);
    });
    const interval = setInterval(() => {
      cryptoPriceService.fetchAllPrices().then((res) => {
        if (isMounted) setCryptoPrices(res);
      });
    }, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeInvestments = investments.filter((i) => i.status === 'ACTIVE');
  const availableBalance = Number(user?.balance) || 0.0;
  const investmentBalance = activeInvestments.reduce((sum, inv) => sum + inv.amount, 0.0);
  const totalAccruedProfit = activeInvestments.reduce((sum, inv) => sum + getAccruedProfitForInvestment(inv), 0.0);
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const featuredPlans = plans.slice(0, 3);

  const cryptoAssetsList = [
    { symbol: 'BTC', name: 'Bitcoin', logo: <BitcoinLogo className="w-5 h-5" /> },
    { symbol: 'ETH', name: 'Ethereum', logo: <EthereumLogo className="w-5 h-5" /> },
    { symbol: 'USDT', name: 'Tether (TRC20/ERC20)', logo: <TetherLogo className="w-5 h-5" /> },
    { symbol: 'BNB', name: 'BNB Chain', logo: <BnbLogo className="w-5 h-5" /> },
    { symbol: 'SOL', name: 'Solana', logo: <SolanaLogo className="w-5 h-5" /> },
    { symbol: 'XRP', name: 'Ripple', logo: <XrpLogo className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#141923] border border-[#2A3447] p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Asset Portfolio</span>
            <span className="text-slate-400 font-normal normal-case hidden sm:inline">• Grow your wealth with institutional precision.</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Welcome, {user?.fullName || user?.username || 'Valued Investor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Account ID: <span className="font-mono text-slate-300 font-semibold">{user?.accountId || 'VX-DEFAULT'}</span> | Verified Institutional Custody
          </p>
        </div>

        {/* Quick Guide Button */}
        <div className="flex items-center space-x-2.5">
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1D2432] hover:bg-[#2A3447] text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Investment Guide</span>
            </button>
          )}
          <button
            onClick={() => onNavigateToTab('wallet')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b8982e] text-black text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>Deposit Funds</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Overview Cards (Required: Available, Investment, Profit/Loss, Active) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Available Balance */}
        <div className="bg-[#141923] border border-[#2A3447] p-5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Balance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-mono font-black text-white">
              ${(Number(availableBalance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400">Ready for Vaults or Withdrawals</div>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={() => onNavigateToTab('wallet')}
              className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Deposit <ArrowUpRight className="w-3 h-3" />
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => onNavigateToTab('wallet')}
              className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* 2. Investment Balance */}
        <div className="bg-[#141923] border border-[#2A3447] p-5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investment Balance</span>
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-mono font-black text-white">
              ${(Number(investmentBalance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400">Locked in Active Vaults</div>
          </div>
          <div className="pt-1">
            <button
              onClick={() => onNavigateToTab('my_investments')}
              className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View My Investments <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3. Total Profit or Loss */}
        <div className="bg-[#141923] border border-[#2A3447] p-5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Profit / Loss</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-mono font-black text-emerald-400">
              +${(Number(totalAccruedProfit) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-500/80">Compounded Daily Yields</div>
          </div>
          <div className="pt-1 text-[11px] text-slate-500">
            Calculated from verified contract terms
          </div>
        </div>

        {/* 4. Active Investments Counter */}
        <div className="bg-[#141923] border border-[#2A3447] p-5 rounded-2xl space-y-3 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Positions</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-mono font-black text-white">
              {activeInvestments.length}
            </div>
            <div className="text-[11px] text-slate-400">Running Strategy Vaults</div>
          </div>
          <div className="pt-1">
            <button
              onClick={() => onNavigateToTab('investment_plans')}
              className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Add New Position <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation Action Grid (Requirement 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateToTab('investment_plans')}
          className="p-3.5 bg-[#141923] hover:bg-[#1D2432] border border-[#2A3447] hover:border-[#D4AF37]/40 rounded-xl flex items-center space-x-3 transition-all cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Investment Plans</div>
            <div className="text-[10px] text-slate-400">Explore Vaults</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab('my_investments')}
          className="p-3.5 bg-[#141923] hover:bg-[#1D2432] border border-[#2A3447] hover:border-[#D4AF37]/40 rounded-xl flex items-center space-x-3 transition-all cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">My Investments</div>
            <div className="text-[10px] text-slate-400">{activeInvestments.length} Active Vaults</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab('transactions')}
          className="p-3.5 bg-[#141923] hover:bg-[#1D2432] border border-[#2A3447] hover:border-[#D4AF37]/40 rounded-xl flex items-center space-x-3 transition-all cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Transactions</div>
            <div className="text-[10px] text-slate-400">Verified History</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab('wallet')}
          className="p-3.5 bg-[#141923] hover:bg-[#1D2432] border border-[#2A3447] hover:border-[#D4AF37]/40 rounded-xl flex items-center space-x-3 transition-all cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Wallet & Balances</div>
            <div className="text-[10px] text-slate-400">Deposit & Payouts</div>
          </div>
        </button>
      </div>

      {/* Cryptocurrency Market Rates & Assets (Requirement 3 & 4) */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Cryptocurrency Assets & Live Market</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                ● Live 30s Feed
              </span>
            </h2>
            <p className="text-xs text-slate-400">Supported collateral assets for deposits, vault lockups, and withdrawals</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {cryptoAssetsList.map((asset) => {
            const priceData = cryptoPrices[asset.symbol];
            const priceFormatted = priceData
              ? priceData.priceUsd >= 1
                ? `$${priceData.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `$${priceData.priceUsd.toFixed(4)}`
              : '$0.00';
            const changeVal = priceData ? priceData.change24h : 0;
            const isPositive = changeVal >= 0;

            return (
              <div
                key={asset.symbol}
                className="bg-[#1D2432] border border-[#2A3447] p-3 rounded-xl space-y-2 hover:border-[#D4AF37]/40 transition-all"
              >
                <div className="flex items-center space-x-2">
                  {asset.logo}
                  <span className="font-extrabold text-xs text-white">{asset.symbol}</span>
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-slate-200">{priceFormatted}</div>
                  <div className={`text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : ''}{changeVal.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Investment Plans Section (Requirement 4) */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              <span>Available Investment Plans</span>
            </h2>
            <p className="text-xs text-slate-400">Institutional yield vaults with automated daily compounding</p>
          </div>
          <button
            onClick={() => onNavigateToTab('investment_plans')}
            className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
          >
            All Plans <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredPlans.map((plan) => {
            const dailyRate = plan.dailyRate !== undefined ? plan.dailyRate : plan.dailyYield;
            return (
              <div
                key={plan.id}
                className="bg-[#1D2432] border border-[#2A3447] hover:border-[#D4AF37]/50 rounded-xl p-4 flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141923] text-slate-400 border border-[#2A3447]">
                      {plan.asset} Strategy
                    </span>
                    <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">
                      {plan.riskLevel}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{plan.description}</p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2A3447] text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Daily Yield</span>
                      <span className="font-mono font-bold text-emerald-400">{dailyRate.toFixed(2)}% / day</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Duration</span>
                      <span className="font-mono font-bold text-slate-200">{plan.lockDays} Days</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Min Deposit</span>
                      <span className="font-mono font-bold text-slate-200">${(Number(plan?.minDeposit) || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Management Fee</span>
                      <span className="font-mono font-bold text-emerald-400">0.00%</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToTab('investment_plans')}
                  className="w-full py-2 bg-[#D4AF37] hover:bg-[#b8982e] text-black text-xs font-bold rounded-lg shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Invest in Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Preview (Requirement 4) */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#D4AF37]" />
              <span>Recent Transactions</span>
            </h2>
            <p className="text-xs text-slate-400">Latest deposits, yields, and withdrawals on your account</p>
          </div>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Full History <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center space-y-2 bg-[#1D2432]/50 rounded-xl border border-[#2A3447]">
            <p className="text-xs text-slate-400">No transactions recorded yet.</p>
            <button
              onClick={() => onNavigateToTab('wallet')}
              className="text-xs font-bold text-[#D4AF37] hover:underline"
            >
              Make your first deposit
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const isPositive = tx.type === 'DEPOSIT' || tx.type === 'YIELD' || tx.type.includes('BONUS');
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-3 bg-[#1D2432] hover:bg-[#252E3E] rounded-xl border border-[#2A3447] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                    }`}>
                      {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{tx.note || tx.type}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.timestamp).toLocaleDateString()} • {tx.status}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isPositive ? '+' : '-'}${(Number(tx.amount) || 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {tx.cryptoAmount ? `${tx.cryptoAmount} ${tx.cryptoAsset || ''}` : tx.currency}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Receipt Modal */}
      {selectedTx && (
        <TransactionReceiptModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};
