import React from 'react';
import { LayoutDashboard, TrendingUp, Bitcoin, Users, Wallet, HelpCircle, ShieldAlert } from 'lucide-react';
import { User } from '../types';

export type NavTab = 'dashboard' | 'vaults' | 'buy_crypto' | 'invite' | 'wallet' | 'support' | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'vaults', label: 'Vaults', icon: TrendingUp },
    { id: 'buy_crypto', label: 'Buy Crypto', icon: Bitcoin },
    { id: 'invite', label: 'Invite & Earn', icon: Users },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  return (
    <aside class="w-full md:w-64 bg-[#141923] border-r border-[#2A3447] flex flex-row md:flex-col justify-around md:justify-start p-2 md:p-4 gap-1 md:gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        const isAdmin = item.id === 'admin';

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id as NavTab)}
            class={`flex flex-col md:flex-row items-center space-x-0 md:space-x-3 px-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all ${
              isActive
                ? isAdmin
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30'
                : 'text-slate-400 hover:text-white hover:bg-[#1D2432]'
            }`}
          >
            <Icon class={`w-4 h-4 md:w-5 md:h-5 ${isActive ? (isAdmin ? 'text-purple-400' : 'text-[#D4AF37]') : 'text-slate-400'}`} />
            <span class="mt-1 md:mt-0">{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
};
