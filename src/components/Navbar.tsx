import React from 'react';
import { User } from '../types';
import { LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onNavigateToTab?: (tab: 'settings' | 'support' | 'dashboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigateToTab }) => {
  return (
    <header className="bg-[#141923] border-b border-[#2A3447] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigateToTab?.('dashboard')}>
        <img src="/logo.jpg" alt="Vaultix Income" className="w-9 h-9 rounded-full border border-[#D4AF37]/50 object-cover" />
        <div>
          <h1 className="text-base font-bold text-[#D4AF37] tracking-wider leading-none">VAULTIX INCOME</h1>
          <span className="text-xs text-[#94A3B8]">Digital Asset Management</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => onNavigateToTab?.('settings')}
          className="flex items-center space-x-2 bg-[#1D2432] hover:bg-[#2A3447] px-3 py-1.5 rounded-lg border border-[#2A3447] transition-all cursor-pointer"
          title="Open Account Settings"
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.username} className="w-5 h-5 rounded-full object-cover border border-[#D4AF37]/60" />
          ) : (
            <UserIcon className="w-4 h-4 text-[#D4AF37]" />
          )}
          <span className="text-xs font-medium text-white truncate max-w-[120px]">@{user.username}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
            {user.role}
          </span>
        </button>

        <button
          onClick={onLogout}
          className="flex items-center space-x-1.5 bg-[#1D2432] hover:bg-red-500/10 text-slate-300 hover:text-red-400 px-3 py-1.5 rounded-lg border border-[#2A3447] transition-colors text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
  );
};
