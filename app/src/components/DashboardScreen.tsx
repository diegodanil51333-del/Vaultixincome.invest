import React from 'react';
import { User, UserInvestment, Transaction } from '../types';
import { getInvestments, getTransactions } from '../db';
import { Wallet, TrendingUp, ShieldCheck, ArrowUpRight, ArrowDownLeft, Award, Clock } from 'lucide-react';

interface DashboardScreenProps {
  user: User;
  onNavigateToTab: (tab: 'vaults' | 'invite' | 'wallet') => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onNavigateToTab }) => {
  const allInvestments = getInvestments().filter((inv) => inv.userId === user.userId);
  const allTransactions = getTransactions().filter((tx) => tx.userId === user.userId);

  return (
    <div class="space-y-6">
      {/* Top Banner Card */}
      <div class="bg-gradient-to-r from-[#141923] via-[#1D2432] to-[#141923] border border-[#D4AF37]/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2 text-[#D4AF37] mb-1">
              <ShieldCheck class="w-4 h-4" />
              <span class="text-xs font-bold uppercase tracking-wider">Account ID: {user.accountId}</span>
            </div>
            <h2 class="text-2xl font-bold text-white">Welcome, {user.fullName}</h2>
            <p class="text-xs text-slate-400 mt-1">Portfolio overview and active yield strategies</p>
          </div>

          <div class="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('wallet')}
              class="bg-[#D4AF37] hover:bg-[#b8982e] text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all"
            >
              <Wallet class="w-4 h-4" />
              <span>Deposit Funds</span>
            </button>
            <button
              onClick={() => onNavigateToTab('vaults')}
              class="bg-[#10B981] hover:bg-[#0d9668] text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all"
            >
              <TrendingUp class="w-4 h-4" />
              <span>Explore Vaults</span>
            </button>
          </div>
        </div>

        {/* Financial Metrics Cards */}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#2A3447]">
          <div>
            <span class="text-[11px] text-slate-400 font-medium">Total Balance</span>
            <div class="text-xl font-extrabold text-[#D4AF37] mt-0.5">
              ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <span class="text-[11px] text-slate-400 font-medium">Total Deposits</span>
            <div class="text-xl font-extrabold text-white mt-0.5">
              ${user.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <span class="text-[11px] text-slate-400 font-medium">Active Vaults Value</span>
            <div class="text-xl font-extrabold text-[#06B6D4] mt-0.5">
              ${user.totalInvestments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <span class="text-[11px] text-slate-400 font-medium">Total Yield & Profit</span>
            <div class="text-xl font-extrabold text-[#10B981] mt-0.5 flex items-center space-x-1">
              <span>+${user.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Investment Vaults */}
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp class="w-4 h-4 text-[#D4AF37]" />
            <span>Active Investment Vaults ({allInvestments.length})</span>
          </h3>
          <button
            onClick={() => onNavigateToTab('vaults')}
            class="text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            + Subscribe New Vault
          </button>
        </div>

        {allInvestments.length === 0 ? (
          <div class="bg-[#141923] border border-[#2A3447] rounded-xl p-8 text-center text-slate-400 text-xs">
            No active vaults currently. Subscribe to a yield vault to start earning daily compound returns.
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allInvestments.map((inv) => (
              <div key={inv.id} class="bg-[#141923] border border-[#2A3447] rounded-xl p-4 space-y-2">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-bold text-white">{inv.planName}</h4>
                    <span class="text-[10px] text-[#D4AF37] font-semibold">{inv.asset} Asset Strategy</span>
                  </div>
                  <span class="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    ACTIVE
                  </span>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-[#2A3447] text-xs">
                  <div>
                    <span class="text-slate-400">Principal Amount:</span>
                    <span class="font-bold text-white ml-1.5">${inv.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span class="text-slate-400">Daily Return:</span>
                    <span class="font-bold text-[#10B981] ml-1.5">+${inv.dailyReturn.toFixed(2)}/day</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions Activity */}
      <div>
        <h3 class="text-sm font-bold text-white mb-3 flex items-center space-x-2">
          <Clock class="w-4 h-4 text-[#06B6D4]" />
          <span>Recent Transaction Activity</span>
        </h3>

        {allTransactions.length === 0 ? (
          <div class="bg-[#141923] border border-[#2A3447] rounded-xl p-6 text-center text-slate-400 text-xs">
            No recent transaction history recorded.
          </div>
        ) : (
          <div class="bg-[#141923] border border-[#2A3447] rounded-xl divide-y divide-[#2A3447] overflow-hidden">
            {allTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} class="p-3.5 flex items-center justify-between text-xs hover:bg-[#1D2432]/50 transition-colors">
                <div class="flex items-center space-x-3">
                  <div class={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_REWARD' || tx.type === 'ADMIN_CREDIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_REWARD' || tx.type === 'ADMIN_CREDIT' ? <ArrowDownLeft class="w-4 h-4" /> : <ArrowUpRight class="w-4 h-4" />}
                  </div>
                  <div>
                    <div class="font-bold text-white">{tx.note || tx.type}</div>
                    <div class="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleString()}</div>
                  </div>
                </div>

                <div class="text-right">
                  <div class={`font-bold ${tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_REWARD' || tx.type === 'ADMIN_CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'DEPOSIT' || tx.type === 'REFERRAL_REWARD' || tx.type === 'ADMIN_CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </div>
                  <span class="text-[10px] font-bold text-emerald-400">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
