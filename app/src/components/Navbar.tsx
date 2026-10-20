import React from 'react';
import { User } from '../types';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <header class="bg-[#141923] border-b border-[#2A3447] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div class="flex items-center space-x-3">
        <img src="/logo.jpg" alt="Vaultix Income" class="w-9 h-9 rounded-full border border-[#D4AF37]/50 object-cover" />
        <div>
          <h1 class="text-base font-bold text-[#D4AF37] tracking-wider leading-none">VAULTIX INCOME</h1>
          <span class="text-xs text-[#94A3B8]">Digital Asset Management</span>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <div class="hidden sm:flex items-center space-x-2 bg-[#1D2432] px-3 py-1.5 rounded-lg border border-[#2A3447]">
          <UserIcon class="w-4 h-4 text-[#D4AF37]" />
          <span class="text-xs font-medium text-white">@{user.username}</span>
          <span class={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
            {user.role}
          </span>
        </div>

        <button
          onClick={onLogout}
          class="flex items-center space-x-1.5 bg-[#1D2432] hover:bg-red-500/10 text-slate-300 hover:text-red-400 px-3 py-1.5 rounded-lg border border-[#2A3447] transition-colors text-xs font-medium"
        >
          <LogOut class="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
};
