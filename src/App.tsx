import React, { useState, useEffect } from 'react';
import { User } from './types';
import { initializeDatabase, getCurrentSession, saveCurrentSession, getUsers, normalizeUser } from './db';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { LandingPage } from './components/LandingPage';
import { DashboardScreen } from './components/DashboardScreen';
import { VaultsScreen } from './components/VaultsScreen';
import { MyInvestmentsScreen } from './components/MyInvestmentsScreen';
import { TransactionsScreen } from './components/TransactionsScreen';
import { InviteScreen } from './components/InviteScreen';
import { WalletScreen } from './components/WalletScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { SupportScreen } from './components/SupportScreen';
import { AdminScreen } from './components/AdminScreen';
import { InvestmentGuideModal } from './components/InvestmentGuideModal';
import { InvestmentNotificationToast } from './components/InvestmentNotificationToast';
import { PublicWithdrawalToast } from './components/PublicWithdrawalToast';
import { AmbientBackground } from './components/AmbientBackground';
import { Footer } from './components/Footer';
import { LayoutDashboard, TrendingUp, Briefcase, History, Wallet as WalletIcon } from 'lucide-react';

const TAB_STORAGE_KEY = 'vaultix_current_tab_v11';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTabState] = useState<NavTab>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  useEffect(() => {
    // Failsafe timer to ensure UI always reveals within 300ms even on slow mobile devices
    const failsafeTimer = setTimeout(() => {
      setIsInitialized(true);
    }, 300);

    try {
      try {
        initializeDatabase();
      } catch (dbErr) {
        console.warn('Non-blocking database initialization notice:', dbErr);
      }

      // Synchronous session recovery with triple-key fallback
      const recoveredSession = getCurrentSession();
      if (recoveredSession) {
        const allUsers = getUsers();
        const recUserId = recoveredSession?.userId;
        const recEmail = recoveredSession?.email && typeof recoveredSession.email === 'string' ? recoveredSession.email.toLowerCase() : '';
        const recUsername = recoveredSession?.username && typeof recoveredSession.username === 'string' ? recoveredSession.username.toLowerCase() : '';

        const found = allUsers.find(
          (u) =>
            Boolean(u?.userId && recUserId && u.userId === recUserId) ||
            Boolean(u?.email && recEmail && typeof u.email === 'string' && u.email.toLowerCase() === recEmail) ||
            Boolean(u?.username && recUsername && typeof u.username === 'string' && u.username.toLowerCase() === recUsername)
        );
        const freshUser: User = found ? { ...found, ...recoveredSession } : { ...recoveredSession };
        if (
          (freshUser?.email && typeof freshUser.email === 'string' && freshUser.email.toLowerCase() === 'vaultixincometeam@outlook.com') ||
          recoveredSession?.role === 'ADMIN'
        ) {
          freshUser.role = 'ADMIN';
        }
        setCurrentUser(freshUser);

        // Restore saved active tab on page refresh or direct URL navigation
        const savedTab = (localStorage.getItem(TAB_STORAGE_KEY) || sessionStorage.getItem(TAB_STORAGE_KEY)) as NavTab | null;
        const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';

        if (pathname.includes('/dashboard')) {
          setCurrentTabState('dashboard');
        } else if (pathname.includes('/plans') || pathname.includes('/vaults')) {
          setCurrentTabState('investment_plans');
        } else if (pathname.includes('/my-investments') || pathname.includes('/investments')) {
          setCurrentTabState('my_investments');
        } else if (pathname.includes('/transactions') || pathname.includes('/history')) {
          setCurrentTabState('transactions');
        } else if (pathname.includes('/wallet')) {
          setCurrentTabState('wallet');
        } else if (pathname.includes('/referrals') || pathname.includes('/invite')) {
          setCurrentTabState('referrals');
        } else if (pathname.includes('/profile')) {
          setCurrentTabState('profile');
        } else if (pathname.includes('/settings')) {
          setCurrentTabState('settings');
        } else if (pathname.includes('/support')) {
          setCurrentTabState('support');
        } else if (pathname.includes('/admin') && freshUser.role === 'ADMIN') {
          setCurrentTabState('admin');
        } else if (savedTab) {
          if (savedTab === 'admin' && freshUser.role !== 'ADMIN') {
            setCurrentTabState('dashboard');
          } else {
            setCurrentTabState(savedTab);
          }
        } else if (freshUser.role === 'ADMIN') {
          setCurrentTabState('admin');
        }
      } else {
        // Auto-detect referral link or direct auth route for unauthenticated visitors
        try {
          if (typeof window !== 'undefined') {
            const fullUrl = window.location.href;
            const pathname = window.location.pathname.toLowerCase();
            const isRefLink = fullUrl.includes('=VXREF-') || fullUrl.includes('ref=') || pathname.includes('/register') || pathname.includes('/invite');
            const isLoginOrDashboardLink = pathname.includes('/login') || pathname.includes('/dashboard');

            if (isRefLink) {
              setAuthMode('register');
              setShowAuthScreen(true);
            } else if (isLoginOrDashboardLink) {
              setAuthMode('login');
              setShowAuthScreen(true);
            }
          }
        } catch {
          // Fallback
        }
      }
    } catch (err) {
      console.warn('App initialization fallback:', err);
    } finally {
      setIsInitialized(true);
    }

    const handleUpdate = () => {
      try {
        const sess = getCurrentSession();
        if (sess) {
          const all = getUsers();
          const sUserId = sess?.userId;
          const sEmail = sess?.email && typeof sess.email === 'string' ? sess.email.toLowerCase() : '';
          const sUsername = sess?.username && typeof sess.username === 'string' ? sess.username.toLowerCase() : '';

          const found = all.find(
            (u) =>
              Boolean(u?.userId && sUserId && u.userId === sUserId) ||
              Boolean(u?.email && sEmail && typeof u.email === 'string' && u.email.toLowerCase() === sEmail) ||
              Boolean(u?.username && sUsername && typeof u.username === 'string' && u.username.toLowerCase() === sUsername)
          );
          if (found) {
            setCurrentUser((prev) => (prev ? { ...prev, ...found } : found));
          }
        }
      } catch {}
    };

    window.addEventListener('vaultix_users_updated', handleUpdate);
    window.addEventListener('vaultix_txs_updated', handleUpdate);
    window.addEventListener('vaultix_investments_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      clearTimeout(failsafeTimer);
      window.removeEventListener('vaultix_users_updated', handleUpdate);
      window.removeEventListener('vaultix_txs_updated', handleUpdate);
      window.removeEventListener('vaultix_investments_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const setCurrentTab = (tab: NavTab) => {
    // Normalize aliases
    const targetTab =
      tab === 'vaults' ? 'investment_plans' :
      tab === 'invite' ? 'referrals' :
      tab === 'buy_crypto' ? 'wallet' :
      tab;

    setCurrentTabState(targetTab);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, targetTab);
      sessionStorage.setItem(TAB_STORAGE_KEY, targetTab);
    } catch {
      // Fallback
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthScreen(true);
  };

  const handleLoginSuccess = (user: User) => {
    if (!user) return;
    const allUsers = getUsers();
    const uUserId = user?.userId;
    const uEmail = user?.email && typeof user.email === 'string' ? user.email.toLowerCase() : '';
    const uUsername = user?.username && typeof user.username === 'string' ? user.username.toLowerCase() : '';

    const found = allUsers.find(
      (u) =>
        Boolean(u?.userId && uUserId && u.userId === uUserId) ||
        Boolean(u?.email && uEmail && typeof u.email === 'string' && u.email.toLowerCase() === uEmail) ||
        Boolean(u?.username && uUsername && typeof u.username === 'string' && u.username.toLowerCase() === uUsername)
    );
    const freshUser: User = found ? { ...found, ...user } : { ...user };
    if (
      (freshUser?.email && typeof freshUser.email === 'string' && freshUser.email.toLowerCase() === 'vaultixincometeam@outlook.com') ||
      user?.role === 'ADMIN'
    ) {
      freshUser.role = 'ADMIN';
    }
    setCurrentUser(freshUser);
    saveCurrentSession(freshUser);
    setShowAuthScreen(false);

    // Always navigate to Dashboard upon successful login
    setCurrentTab('dashboard');
  };

  const handleUserUpdated = (updatedUser: User) => {
    const safeUser = normalizeUser(updatedUser);
    setCurrentUser(safeUser);
    saveCurrentSession(safeUser);
  };

  const handleLogout = () => {
    saveCurrentSession(null);
    try {
      localStorage.removeItem(TAB_STORAGE_KEY);
      sessionStorage.removeItem(TAB_STORAGE_KEY);
    } catch {
      // Fallback
    }
    setCurrentUser(null);
    setShowAuthScreen(false);
    setCurrentTabState('dashboard');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-[#D4AF37] flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#D4AF37] mb-3"></div>
        <span className="text-xs font-bold tracking-widest uppercase">Verifying Authenticated Session...</span>
      </div>
    );
  }

  // Unauthenticated Visitors: Public Landing Page or Auth Screen
  if (!currentUser) {
    if (showAuthScreen) {
      return (
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          initialTab={authMode}
          onBackToLanding={() => setShowAuthScreen(false)}
        />
      );
    }
    return <LandingPage onOpenAuth={handleOpenAuth} />;
  }

  // Authenticated Users: Full Digital Asset Management Application
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans relative selection:bg-[#D4AF37] selection:text-black">
      <AmbientBackground />
      <PublicWithdrawalToast />
      <InvestmentNotificationToast />

      {/* Primary Dashboard Navbar with 3-line hamburger menu */}
      <Navbar 
        user={currentUser} 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        onLogout={handleLogout}
        onOpenGuide={() => setIsGuideModalOpen(true)}
      />

      <div className="flex-1 flex relative z-10">
        {/* Desktop Sidebar (10 options) */}
        <Sidebar 
          currentTab={currentTab} 
          onSelectTab={setCurrentTab} 
          onLogout={handleLogout} 
          user={currentUser} 
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 pb-20 max-w-7xl mx-auto w-full">
          {/* 1. Dashboard */}
          {currentTab === 'dashboard' && (
            <DashboardScreen 
              user={currentUser} 
              onNavigateToTab={setCurrentTab}
              onOpenGuide={() => setIsGuideModalOpen(true)}
            />
          )}

          {/* 2. Investment Plans */}
          {(currentTab === 'investment_plans' || currentTab === 'vaults') && (
            <VaultsScreen user={currentUser} onUserUpdated={handleUserUpdated} />
          )}

          {/* 3. My Investments */}
          {currentTab === 'my_investments' && (
            <MyInvestmentsScreen 
              user={currentUser} 
              onNavigateToPlans={() => setCurrentTab('investment_plans')}
              onNavigateToWallet={() => setCurrentTab('wallet')}
              onUserUpdated={handleUserUpdated}
            />
          )}

          {/* 4. Transaction History */}
          {currentTab === 'transactions' && (
            <TransactionsScreen 
              user={currentUser} 
              onNavigateToWallet={() => setCurrentTab('wallet')}
              onNavigateToPlans={() => setCurrentTab('investment_plans')}
            />
          )}

          {/* 5. Wallet */}
          {(currentTab === 'wallet' || currentTab === 'buy_crypto') && (
            <WalletScreen user={currentUser} onUserUpdated={handleUserUpdated} />
          )}

          {/* 6. Referrals */}
          {(currentTab === 'referrals' || currentTab === 'invite') && (
            <InviteScreen user={currentUser} onUserUpdated={handleUserUpdated} />
          )}

          {/* 7. Profile Details */}
          {currentTab === 'profile' && (
            <ProfileScreen user={currentUser} onUserUpdated={handleUserUpdated} />
          )}

          {/* 8. Settings */}
          {currentTab === 'settings' && (
            <SettingsScreen user={currentUser} onUserUpdated={handleUserUpdated} />
          )}

          {/* 9. Help and Support */}
          {currentTab === 'support' && (
            <SupportScreen user={currentUser} />
          )}

          {/* 10. Admin Panel */}
          {currentTab === 'admin' && currentUser.role === 'ADMIN' && (
            <AdminScreen currentAdmin={currentUser} />
          )}

          {/* Fallback to Dashboard if tab is unrecognized or user lacks admin permission */}
          {(
            currentTab !== 'dashboard' &&
            currentTab !== 'investment_plans' &&
            currentTab !== 'vaults' &&
            currentTab !== 'my_investments' &&
            currentTab !== 'transactions' &&
            currentTab !== 'wallet' &&
            currentTab !== 'buy_crypto' &&
            currentTab !== 'referrals' &&
            currentTab !== 'invite' &&
            currentTab !== 'profile' &&
            currentTab !== 'settings' &&
            currentTab !== 'support' &&
            !(currentTab === 'admin' && currentUser.role === 'ADMIN')
          ) && (
            <DashboardScreen 
              user={currentUser} 
              onNavigateToTab={setCurrentTab}
              onOpenGuide={() => setIsGuideModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Global 7-Step Investment Guide Modal */}
      <InvestmentGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onNavigateToPlans={() => setCurrentTab('investment_plans')}
        onNavigateToWallet={() => setCurrentTab('wallet')}
      />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#141923]/95 backdrop-blur-md border-t border-[#2A3447] z-40 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
            currentTab === 'dashboard' ? 'text-[#D4AF37] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setCurrentTab('investment_plans')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
            currentTab === 'investment_plans' || currentTab === 'vaults' ? 'text-[#D4AF37] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span>Plans</span>
        </button>
        <button
          onClick={() => setCurrentTab('my_investments')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
            currentTab === 'my_investments' ? 'text-[#D4AF37] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-5 h-5 mb-0.5" />
          <span>Portfolio</span>
        </button>
        <button
          onClick={() => setCurrentTab('transactions')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
            currentTab === 'transactions' ? 'text-[#D4AF37] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span>Activity</span>
        </button>
        <button
          onClick={() => setCurrentTab('wallet')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all ${
            currentTab === 'wallet' || currentTab === 'buy_crypto' ? 'text-[#D4AF37] font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <WalletIcon className="w-5 h-5 mb-0.5" />
          <span>Wallet</span>
        </button>
      </nav>

      <Footer onOpenSupport={() => setCurrentTab('support')} />
    </div>
  );
}

export default App;
