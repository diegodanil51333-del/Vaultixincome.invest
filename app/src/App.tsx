import React, { useState, useEffect } from 'react';
import { User } from './types';
import { initializeDatabase, getCurrentSession, saveCurrentSession } from './db';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { VaultsScreen } from './components/VaultsScreen';
import { BuyCryptoScreen } from './components/BuyCryptoScreen';
import { InviteScreen } from './components/InviteScreen';
import { WalletScreen } from './components/WalletScreen';
import { SupportScreen } from './components/SupportScreen';
import { AdminScreen } from './components/AdminScreen';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  useEffect(() => {
    initializeDatabase();
    const session = getCurrentSession();
    if (session) {
      setCurrentUser(session);
      if (session.role === 'ADMIN') {
        setCurrentTab('admin');
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'ADMIN') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    saveCurrentSession(null);
    setCurrentUser(null);
    setCurrentTab('dashboard');
  };

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div class="min-h-screen bg-[#0B0E14] text-white flex flex-col font-sans">
      <Navbar user={currentUser} onLogout={handleLogout} />

      <div class="flex-1 flex flex-col md:flex-row">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} user={currentUser} />

        <main class="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardScreen user={currentUser} onNavigateToTab={setCurrentTab} />
          )}
          {currentTab === 'vaults' && (
            <VaultsScreen user={currentUser} onUserUpdated={setCurrentUser} />
          )}
          {currentTab === 'buy_crypto' && <BuyCryptoScreen />}
          {currentTab === 'invite' && (
            <InviteScreen user={currentUser} onUserUpdated={setCurrentUser} />
          )}
          {currentTab === 'wallet' && (
            <WalletScreen user={currentUser} onUserUpdated={setCurrentUser} />
          )}
          {currentTab === 'support' && <SupportScreen user={currentUser} />}
          {currentTab === 'admin' && currentUser.role === 'ADMIN' && (
            <AdminScreen currentAdmin={currentUser} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
