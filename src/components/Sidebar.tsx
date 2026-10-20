import React from 'react';
import { LayoutDashboard, TrendingUp, Bitcoin, Users, Wallet, HelpCircle, ShieldAlert, Settings } from 'lucide-react';
import { User } from '../types';

export type NavTab = 'dashboard' | 'vaults' | 'buy_crypto' | 'invite' | 'wallet' | 'support' | 'settings' | 'admin';

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
    { id: 'invite', label: 'Invite', icon: Users },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ id: 'admin', label: 'Admin', icon: ShieldAlert });
  }

  return (
    <>
      {/* DESKTOP SIDEBAR (768px+) */}
      <aside className="hidden md:flex w-64 bg-[#141923] border-r border-[#2A3447] flex-col p-4 gap-2 shrink-0">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isAdmin = item.id === 'admin';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? isAdmin
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                    : 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#1D2432]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? (isAdmin ? 'text-purple-400' : 'text-[#D4AF37]') : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (<768px - Modern Financial App Style like Bybit) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#141923]/95 backdrop-blur-lg border-t border-[#2A3447] px-1 py-2 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isAdmin = item.id === 'admin';

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all ${
                isActive
                  ? isAdmin
                    ? 'text-purple-400 font-extrabold'
                    : 'text-[#D4AF37] font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? (isAdmin ? 'text-purple-400' : 'text-[#D4AF37]') : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[55px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
