import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  History, 
  Wallet, 
  Gift, 
  UserCheck, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { User } from '../types';

export type NavTab = 
  | 'dashboard' 
  | 'investment_plans' 
  | 'my_investments' 
  | 'transactions' 
  | 'wallet' 
  | 'referrals' 
  | 'profile' 
  | 'settings' 
  | 'support' 
  | 'admin'
  // Legacy aliases for backward compatibility
  | 'vaults'
  | 'invite'
  | 'buy_crypto';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onLogout?: () => void;
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onLogout, user }) => {
  // Normalize legacy tab aliases
  const normalizedCurrentTab =
    currentTab === 'vaults' ? 'investment_plans' :
    currentTab === 'invite' ? 'referrals' :
    currentTab === 'buy_crypto' ? 'wallet' :
    currentTab;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'investment_plans', label: 'Investment Plans', icon: TrendingUp },
    { id: 'my_investments', label: 'My Investments', icon: Briefcase },
    { id: 'transactions', label: 'Transaction History', icon: History },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'referrals', label: 'Referrals', icon: Gift },
    { id: 'profile', label: 'Profile Details', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'support', label: 'Help and Support', icon: HelpCircle },
  ];

  if (user.role === 'ADMIN') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  return (
    <aside className="hidden lg:flex w-64 bg-[#141923] border-r border-[#2A3447] flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-65px)]">
      <div className="space-y-6">
        {/* User Mini Card */}
        <div 
          onClick={() => onSelectTab('profile')}
          className="p-3 bg-[#1D2432] border border-[#2A3447] rounded-xl flex items-center space-x-3 cursor-pointer hover:border-[#D4AF37]/50 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-[#10141D] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0">
            {user.username ? user.username[0].toUpperCase() : 'V'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{user.fullName || user.username}</div>
            <div className="text-[10px] text-slate-400 font-mono truncate">ID: {user.accountId || 'VX-DEFAULT'}</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              ${(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
            Main Menu
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = normalizedCurrentTab === item.id;
            const isAdmin = item.id === 'admin';

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? isAdmin
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                      : 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-[#1D2432]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? (isAdmin ? 'text-purple-400' : 'text-[#D4AF37]') : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout button at bottom */}
      {onLogout && (
        <div className="pt-4 border-t border-[#2A3447]">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
};
