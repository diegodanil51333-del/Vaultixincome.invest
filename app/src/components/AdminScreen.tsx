import React, { useState } from 'react';
import { User, AuditLog } from '../types';
import { getUsers, saveUsers, getAuditLogs, saveAuditLogs, getTransactions, saveTransactions } from '../db';
import { ShieldAlert, Search, UserCheck, UserX, DollarSign, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

interface AdminScreenProps {
  currentAdmin: User;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ currentAdmin }) => {
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Balance Adjustment Form inside modal
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const users = getUsers();
  const auditLogs = getAuditLogs();

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.accountId.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q)
    );
  });

  const handleToggleStatus = (targetUser: User) => {
    const newStatus = targetUser.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updatedUser: User = { ...targetUser, accountStatus: newStatus };

    const allUsers = getUsers();
    const idx = allUsers.findIndex((u) => u.userId === targetUser.userId);
    if (idx !== -1) {
      allUsers[idx] = updatedUser;
      saveUsers(allUsers);
    }

    // Log Audit
    const newLog: AuditLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      adminUsername: currentAdmin.username,
      targetUsername: targetUser.username,
      action: 'STATUS_TOGGLE',
      details: `Changed status from ${targetUser.accountStatus} to ${newStatus}`,
      timestamp: new Date().toISOString()
    };
    const logs = getAuditLogs();
    logs.unshift(newLog);
    saveAuditLogs(logs);

    if (selectedUser?.userId === targetUser.userId) {
      setSelectedUser(updatedUser);
    }
    setMsg(`Account status for @${targetUser.username} set to ${newStatus}.`);
  };

  const handleAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const amount = Number(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      alert('Please enter a non-zero adjustment amount.');
      return;
    }

    const updatedUser: User = {
      ...selectedUser,
      balance: selectedUser.balance + amount
    };

    const allUsers = getUsers();
    const idx = allUsers.findIndex((u) => u.userId === selectedUser.userId);
    if (idx !== -1) {
      allUsers[idx] = updatedUser;
      saveUsers(allUsers);
    }

    // Log Audit & Transaction
    const logs = getAuditLogs();
    logs.unshift({
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      adminUsername: currentAdmin.username,
      targetUsername: selectedUser.username,
      action: 'BALANCE_ADJUST',
      details: `Adjusted balance by $${amount.toFixed(2)}. Reason: ${adjustNote || 'Admin Adjustment'}`,
      timestamp: new Date().toISOString()
    });
    saveAuditLogs(logs);

    const txs = getTransactions();
    txs.unshift({
      id: `TX-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: selectedUser.userId,
      type: amount > 0 ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT',
      amount: Math.abs(amount),
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      note: `Admin Credit: ${adjustNote || 'Manual Balance Adjustment'}`
    });
    saveTransactions(txs);

    setSelectedUser(updatedUser);
    setAdjustAmount('');
    setAdjustNote('');
    setMsg(`Successfully adjusted balance for @${selectedUser.username} by $${amount.toFixed(2)}.`);
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold text-purple-400 flex items-center space-x-2">
            <ShieldAlert class="w-5 h-5" />
            <span>Administrator Control Center</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1">Platform management, directory search, and financial adjustments</p>
        </div>

        <div class="flex border border-[#2A3447] rounded-xl overflow-hidden bg-[#141923]">
          <button
            onClick={() => setTab('users')}
            class={`px-4 py-2 text-xs font-bold transition-all ${
              tab === 'users' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            User Directory
          </button>
          <button
            onClick={() => setTab('audit')}
            class={`px-4 py-2 text-xs font-bold transition-all ${
              tab === 'audit' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {msg && (
        <div class="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3 rounded-xl flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)}><X class="w-4 h-4" /></button>
        </div>
      )}

      {tab === 'users' ? (
        <div class="space-y-4">
          {/* Search Input */}
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by Username, Email, Account ID, User ID, or Name..."
              class="w-full bg-[#141923] border border-[#2A3447] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Directory Users Table */}
          <div class="bg-[#141923] border border-[#2A3447] rounded-2xl overflow-hidden divide-y divide-[#2A3447]">
            {filteredUsers.length === 0 ? (
              <div class="p-8 text-center text-xs text-slate-400">No matching user accounts found.</div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.userId} class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1D2432]/50 transition-colors">
                  <div>
                    <div class="flex items-center space-x-2">
                      <span class="font-bold text-white text-sm">@{u.username}</span>
                      <span class={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-300'}`}>
                        {u.role}
                      </span>
                      <span class={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.accountStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {u.accountStatus}
                      </span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">
                      {u.fullName} • {u.email} • ID: <span class="font-mono text-slate-300">{u.accountId}</span>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2 self-end sm:self-auto">
                    <div class="text-right mr-2">
                      <div class="text-xs font-bold text-[#D4AF37]">${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      <div class="text-[10px] text-slate-400">Portfolio</div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(u)}
                      class={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        u.accountStatus === 'ACTIVE'
                          ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>

                    <button
                      onClick={() => setSelectedUser(u)}
                      class="bg-purple-500 hover:bg-purple-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-md"
                    >
                      Inspect Profile
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Audit Logs Tab */
        <div class="bg-[#141923] border border-[#2A3447] rounded-2xl overflow-hidden divide-y divide-[#2A3447]">
          {auditLogs.length === 0 ? (
            <div class="p-8 text-center text-xs text-slate-400">No administrator audit actions recorded yet.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} class="p-4 space-y-1 text-xs">
                <div class="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>Action ID: {log.id} • Admin: @{log.adminUsername}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div class="font-bold text-white">Target User: @{log.targetUsername} ({log.action})</div>
                <div class="text-slate-300 text-[11px]">{log.details}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-[#141923] border border-[#2A3447] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedUser(null)}
              class="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X class="w-5 h-5" />
            </button>

            <h3 class="text-base font-bold text-white flex items-center space-x-2">
              <ShieldAlert class="w-5 h-5 text-purple-400" />
              <span>User Profile & Balance Controls</span>
            </h3>

            <div class="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 space-y-2 text-xs">
              <div class="flex justify-between"><span class="text-slate-400">Username:</span><span class="font-bold text-white">@{selectedUser.username}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Full Name:</span><span class="text-white">{selectedUser.fullName}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Email:</span><span class="text-white">{selectedUser.email}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Account ID:</span><span class="font-mono text-[#D4AF37]">{selectedUser.accountId}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Current Balance:</span><span class="font-extrabold text-emerald-400">${selectedUser.balance.toFixed(2)}</span></div>
            </div>

            {/* Adjust Balance Form */}
            <form onSubmit={handleAdjustBalance} class="space-y-3 pt-2 border-t border-[#2A3447]">
              <h4 class="text-xs font-bold text-white">Adjust User Balance ($ USD)</h4>
              <input
                type="number"
                step="any"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="Amount (e.g. 500 or -200)"
                class="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                required
              />
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Reason / Audit note"
                class="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md"
              >
                APPLY BALANCE ADJUSTMENT
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
