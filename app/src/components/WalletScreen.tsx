import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { getUsers, saveUsers, getTransactions, saveTransactions, saveCurrentSession } from '../db';
import { Wallet, ArrowDownLeft, ArrowUpRight, Copy, Check, AlertCircle, CheckCircle } from 'lucide-react';

interface WalletScreenProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ user, onUserUpdated }) => {
  const [selectedAsset, setSelectedAsset] = useState<'BTC' | 'ETH' | 'USDT' | 'SOL'>('USDT');
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Withdrawal Form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const depositAddresses = {
    USDT: 'TY8z2K9M1VxL4P7Qn3R5s6W9X2m1A3B4C5',
    BTC: 'bc1q9v8a7x6w5e4r3t2y1u0i9o8p7l6k5j4h3g2f1',
    ETH: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(depositAddresses[selectedAsset]);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const amount = Number(withdrawAmount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }

    if (amount > user.balance) {
      setError(`Insufficient funds. Your available balance is $${user.balance.toFixed(2)}.`);
      return;
    }

    if (!withdrawAddress.trim()) {
      setError('Please enter a destination wallet address.');
      return;
    }

    // Process Withdrawal Request
    const updatedUser: User = {
      ...user,
      balance: user.balance - amount
    };

    const users = getUsers();
    const idx = users.findIndex((u) => u.userId === user.userId);
    if (idx !== -1) {
      users[idx] = updatedUser;
      saveUsers(users);
    }

    const newTx: Transaction = {
      id: `TX-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: user.userId,
      type: 'WITHDRAWAL',
      amount: amount,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      note: `Withdrawal request to ${withdrawAddress.slice(0, 6)}...${withdrawAddress.slice(-4)}`
    };

    const txs = getTransactions();
    txs.unshift(newTx);
    saveTransactions(txs);

    saveCurrentSession(updatedUser);
    onUserUpdated(updatedUser);

    setWithdrawAmount('');
    setWithdrawAddress('');
    setSuccess(`Withdrawal request of $${amount.toFixed(2)} submitted successfully! Status: PENDING validation.`);
  };

  return (
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center space-x-2">
          <Wallet class="w-5 h-5 text-[#D4AF37]" />
          <span>Crypto Wallet & Fund Operations</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">Deposit or withdraw digital assets instantly with cryptographic verification</p>
      </div>

      {/* Asset Deposit Section */}
      <div class="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 class="text-sm font-bold text-white flex items-center space-x-2">
          <ArrowDownLeft class="w-4 h-4 text-emerald-400" />
          <span>Deposit Crypto Funds</span>
        </h3>

        {/* Asset Selector */}
        <div class="flex space-x-2">
          {(['USDT', 'BTC', 'ETH', 'SOL'] as const).map((asset) => (
            <button
              key={asset}
              onClick={() => setSelectedAsset(asset)}
              class={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedAsset === asset
                  ? 'bg-[#D4AF37] text-black shadow-md'
                  : 'bg-[#1D2432] text-slate-300 border border-[#2A3447] hover:border-slate-500'
              }`}
            >
              {asset}
            </button>
          ))}
        </div>

        {/* Address & Instructions */}
        <div class="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 space-y-3">
          <div class="flex justify-between text-xs text-slate-300">
            <span>{selectedAsset} Deposit Wallet Address</span>
            <span class="text-emerald-400 font-semibold">Network: {selectedAsset === 'USDT' ? 'TRC20' : selectedAsset}</span>
          </div>

          <div class="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={depositAddresses[selectedAsset]}
              class="flex-1 bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-[#D4AF37] font-mono focus:outline-none"
            />
            <button
              onClick={handleCopy}
              class="bg-[#2A3447] hover:bg-[#3B4861] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1"
            >
              {copiedAddress ? <Check class="w-4 h-4 text-emerald-400" /> : <Copy class="w-4 h-4" />}
              <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p class="text-[11px] text-slate-400">
            Send only {selectedAsset} to this address. Funds will be automatically credited after 1 network confirmation.
          </p>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div class="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 class="text-sm font-bold text-white flex items-center space-x-2">
          <ArrowUpRight class="w-4 h-4 text-rose-400" />
          <span>Request Funds Withdrawal</span>
        </h3>

        {error && (
          <div class="bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div class="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3 rounded-xl flex items-center space-x-2">
            <CheckCircle class="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleWithdrawal} class="space-y-4">
          <div>
            <div class="flex justify-between text-xs text-slate-300 mb-1">
              <span>Withdrawal Amount ($ USD)</span>
              <span>Available: ${user.balance.toFixed(2)}</span>
            </div>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="e.g. 500.00"
              class="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Destination Crypto Address</label>
            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder="Paste destination wallet address"
              class="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              required
            />
          </div>

          <button
            type="submit"
            class="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md"
          >
            SUBMIT WITHDRAWAL REQUEST
          </button>
        </form>
      </div>
    </div>
  );
};
