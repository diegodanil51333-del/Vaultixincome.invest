import React, { useState, useEffect } from 'react';
import { User } from './types';
import { initializeDatabase, getCurrentSession, saveCurrentSession, getUsers } from './db';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { LandingPage } from './components/LandingPage';
import { DashboardScreen } from './components/DashboardScreen';
import { VaultsScreen } from './components/VaultsScreen';
import { BuyCryptoScreen } from './components/BuyCryptoScreen';
import { InviteScreen } from './components/InviteScreen';
import { WalletScreen } from './components/WalletScreen';
import { SupportScreen } from './components/SupportScreen';
import { AdminScreen } from './components/AdminScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { InvestmentNotificationToast } from './components/InvestmentNotificationToast';
import { PublicWithdrawalToast } from './components/PublicWithdrawalToast';
import { AmbientBackground } from './components/AmbientBackground';
import { Footer } from './components/Footer';

const TAB_STORAGE_KEY = 'vaultix_current_tab_v10';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTabState] = useState<NavTab>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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
        const freshUser: User = found ? { ...found, ...recoveredSession } : recoveredSession;
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
        } else if (pathname.includes('/vaults') || pathname.includes('/plans') || pathname.includes('/invest')) {
          setCurrentTabState('vaults');
        } else if (pathname.includes('/wallet')) {
          setCurrentTabState('wallet');
        } else if (pathname.includes('/invite') || pathname.includes('/referral')) {
          setCurrentTabState('invite');
        } else if (pathname.includes('/buy') || pathname.includes('/crypto')) {
          setCurrentTabState('buy_crypto');
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
    setCurrentTabState(tab);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tab);
      sessionStorage.setItem(TAB_STORAGE_KEY, tab);
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

    if (freshUser.role === 'ADMIN') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleUserUpdated = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    saveCurrentSession(updatedUser);
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

  // Authenticated Users: Full Wealth Management Application
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans relative">
      <AmbientBackground />
      <PublicWithdrawalToast />
      <InvestmentNotificationToast />
      <Navbar user={currentUser} onLogout={handleLogout} onNavigateToTab={setCurrentTab} />

      <div className="flex-1 flex flex-col md:flex-row relative z-10">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} user={currentUser} />

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardScreen user={currentUser} onNavigateToTab={setCurrentTab} />
          )}
          {currentTab === 'vaults' && (
            <VaultsScreen user={currentUser} onUserUpdated={handleUserUpdated} />
          )}
          {currentTab === 'buy_crypto' && <BuyCryptoScreen />}
          {currentTab === 'invite' && (
            <InviteScreen user={currentUser} onUserUpdated={handleUserUpdated} />
          )}
          {currentTab === 'wallet' && (
            <WalletScreen user={currentUser} onUserUpdated={handleUserUpdated} />
          )}
          {currentTab === 'settings' && (
            <SettingsScreen user={currentUser} onUserUpdated={handleUserUpdated} />
          )}
          {currentTab === 'support' && <SupportScreen user={currentUser} />}
          {currentTab === 'admin' && currentUser.role === 'ADMIN' && (
            <AdminScreen currentAdmin={currentUser} />
          )}
        </main>
      </div>

      <Footer onOpenSupport={() => setCurrentTab('support')} />
    </div>
  );
}

export default App;
