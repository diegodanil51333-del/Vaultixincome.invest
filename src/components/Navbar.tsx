import React, { useState } from 'react';
import { User } from '../types';
import { NavTab } from './Sidebar';
import { 
  Menu, 
  X, 
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
  BookOpen, 
  User as UserIcon,
  ChevronRight
} from 'lucide-react';

interface NavbarProps {
  user: User;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onLogout: () => void;
  onOpenGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  currentTab, 
  onSelectTab, 
  onLogout,
  onOpenGuide 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  if ((user?.role || 'USER') === 'ADMIN') {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId as NavTab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-[#141923] border-b border-[#2A3447] px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        {/* Left: Hamburger Button & Brand Logo */}
        <div className="flex items-center space-x-3">
          {/* Three-line menu button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-[#1D2432] hover:bg-[#2A3447] text-slate-300 hover:text-white border border-[#2A3447] transition-all cursor-pointer"
            aria-label="Toggle Navigation Menu"
            title="Open Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-[#D4AF37]" /> : <Menu className="w-5 h-5 text-[#D4AF37]" />}
          </button>

          {/* Logo & Platform Name */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer shrink-0" 
            onClick={() => onSelectTab('dashboard')}
          >
            <img 
              src="/logo.jpg" 
              alt="Vaultix Income" 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#D4AF37]/50 object-cover shadow-sm shrink-0" 
            />
            <div className="shrink-0">
              <h1 className="text-sm sm:text-base font-black text-[#D4AF37] tracking-wider leading-none whitespace-nowrap">
                VAULTIX INCOME
              </h1>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block whitespace-nowrap">Digital Wealth Management</span>
            </div>
          </div>
        </div>

        {/* Right: Investment Guide, User Profile Badge, Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Investment Guide Button */}
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="hidden sm:inline-flex items-center space-x-1.5 bg-[#1D2432] hover:bg-[#2A3447] text-[#D4AF37] px-3 py-1.5 rounded-xl border border-[#D4AF37]/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Open 7-Step Investment Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Investment Guide</span>
            </button>
          )}

          {/* Admin Quick Action Button (Desktop & Tablet only; mobile uses drawer & bottom nav) */}
          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => onSelectTab('admin')}
              className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm ${
                currentTab === 'admin'
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/35 border-purple-500/50'
              }`}
              title="Open Administrator Control Center"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* User Profile Mini Badge */}
          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            className="flex items-center space-x-2 bg-[#1D2432] hover:bg-[#2A3447] px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#2A3447] transition-all cursor-pointer"
            title="View Profile Details"
          >
            <div className="w-6 h-6 rounded-full bg-[#10141D] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] text-xs font-bold shrink-0 overflow-hidden">
              {(user?.photoURL || user?.avatarUrl) ? (
                <img src={user.photoURL || user.avatarUrl} alt={user?.username || "user"} className="w-full h-full object-cover" />
              ) : (
                (user?.username || "user") ? (user?.username || "user")[0].toUpperCase() : "U"
              )}
            </div>
            <span className="text-xs font-bold text-white truncate max-w-[100px] sm:max-w-[130px]">
              @{(user?.username || 'user')}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline-block ${
              (user?.role || 'USER') === 'ADMIN'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}>
              {(user?.role || 'USER') === 'ADMIN' ? 'ADMIN' : 'Verified Investor'}
            </span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center space-x-1.5 bg-[#1D2432] hover:bg-rose-500/15 text-slate-300 hover:text-rose-400 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#2A3447] hover:border-rose-500/30 transition-all text-xs font-semibold cursor-pointer"
            title="Log Out of Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* THREE-LINE HAMBURGER SLIDE-OVER DRAWER MENU (Mobile & Tablet) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-[#141923] border-r border-[#2A3447] h-full shadow-2xl flex flex-col justify-between p-5 z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A3447]">
                <div className="flex items-center space-x-2.5">
                  <img src="/logo.jpg" alt="Vaultix Income" className="w-8 h-8 rounded-full border border-[#D4AF37]/50 object-cover" />
                  <div>
                    <div className="text-sm font-black text-[#D4AF37]">VAULTIX MENU</div>
                    <div className="text-[10px] text-slate-400">Settings & Navigation</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1D2432]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Account Card */}
              <div 
                onClick={() => handleNavClick('profile')}
                className="p-3 bg-[#1D2432] border border-[#2A3447] rounded-xl flex items-center space-x-3 cursor-pointer hover:border-[#D4AF37]/50"
              >
                <div className="w-10 h-10 rounded-full bg-[#10141D] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0 overflow-hidden shadow-inner">
                  {(user?.photoURL || user?.avatarUrl) ? (
                    <img src={user.photoURL || user.avatarUrl} alt={user?.username || "user"} className="w-full h-full object-cover" />
                  ) : (
                    (user?.username || "user") ? (user?.username || "user")[0].toUpperCase() : "V"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{(user?.fullName || 'Valued User') || (user?.username || 'user')}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">ID: {(user?.accountId || 'VX-DEFAULT') || 'VX-DEFAULT'}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                    Balance: ${(Number(user?.balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Quick Investment Guide button inside drawer */}
              {onOpenGuide && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenGuide();
                  }}
                  className="w-full flex items-center justify-center space-x-2 p-2.5 bg-[#1D2432] hover:bg-[#2A3447] border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>How to Invest Guide</span>
                </button>
              )}

              {/* 10 Required Menu Options */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1.5">
                  Platform Menu
                </div>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = normalizedCurrentTab === item.id;
                  const isAdmin = item.id === 'admin';

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? isAdmin
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold shadow-sm'
                            : 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40 font-bold shadow-sm'
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

            {/* Logout option at the very bottom (Option 10) */}
            <div className="pt-4 border-t border-[#2A3447]">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
