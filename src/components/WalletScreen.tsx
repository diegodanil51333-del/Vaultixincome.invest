import React, { useState, useEffect, useRef } from 'react';
import { User, Transaction, CryptoWalletConfig } from '../types';
import { getWallets, submitDeposit, submitWithdrawalRequest, submitBonusWithdrawalRequest, calculateWithdrawalFee, getUsers, saveUsers, getTransactions, saveTransactions, saveCurrentSession, cancelOwnPendingDeposit } from '../db';
import { cryptoPriceService } from '../services/cryptoPriceService';
import { Wallet, ArrowDownLeft, ArrowUpRight, Copy, Check, AlertCircle, CheckCircle, Mail, QrCode, Gift, ShieldCheck, RefreshCw } from 'lucide-react';
import { OFFICIAL_SUPPORT_EMAIL } from './SupportScreen';
import { TransactionReceiptModal } from './TransactionReceiptModal';

interface WalletScreenProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ user, onUserUpdated }) => {
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [wallets, setWallets] = useState<CryptoWalletConfig[]>(() => getWallets().filter((w) => w.isActive));
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => getWallets().filter((w) => w.isActive)[0]?.symbol || 'USDT');
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Deposit Submit Form
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTxHash, setDepositTxHash] = useState('');
  const [depError, setDepError] = useState<string | null>(null);
  const [depSuccess, setDepSuccess] = useState<string | null>(null);
  const [isSubmittingDep, setIsSubmittingDep] = useState(false);
  const isSubmittingDepRef = useRef(false);

  // Live Crypto Valuation State
  const [liveCryptoRate, setLiveCryptoRate] = useState<number>(1.0);
  const [estimatedUsdValuation, setEstimatedUsdValuation] = useState<number>(0);

  // Withdrawal Form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('TRC20 (Tron)');
  const [wError, setWError] = useState<string | null>(null);
  const [wSuccess, setWSuccess] = useState<string | null>(null);
  const [isSubmittingWith, setIsSubmittingWith] = useState(false);
  const isSubmittingWithRef = useRef(false);

  // Fetch live market rate when symbol or deposit amount changes
  useEffect(() => {
    let isCancelled = false;
    const updateRate = async () => {
      try {
        const rate = await cryptoPriceService.getPrice(selectedSymbol);
        if (!isCancelled) {
          setLiveCryptoRate(rate);
          const amt = parseFloat(depositAmount) || 0;
          setEstimatedUsdValuation(amt * rate);
        }
      } catch {
        // Fallback
      }
    };
    updateRate();
    return () => { isCancelled = true; };
  }, [selectedSymbol, depositAmount]);

  const [userTransactions, setUserTransactions] = useState<Transaction[]>(() => getTransactions().filter((tx) => tx.userId === user.userId));

  // Real-time synchronization interval for instant status/balance updates
  useEffect(() => {
    const handleUpdate = () => {
      const freshUser = getUsers().find((u) => u.userId === user.userId);
      if (freshUser) {
        onUserUpdated(freshUser);
      }
      setUserTransactions(getTransactions().filter((tx) => tx.userId === user.userId));
      setWallets(getWallets().filter((w) => w.isActive));
    };

    const interval = setInterval(handleUpdate, 1000);
    window.addEventListener('vaultix_users_updated', handleUpdate);
    window.addEventListener('vaultix_txs_updated', handleUpdate);
    window.addEventListener('vaultix_wallets_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('vaultix_users_updated', handleUpdate);
      window.removeEventListener('vaultix_txs_updated', handleUpdate);
      window.removeEventListener('vaultix_wallets_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user.userId]);

  const selectedWallet = wallets.find((w) => w.symbol === selectedSymbol) || wallets[0];

  const handleCopy = () => {
    if (selectedWallet) {
      navigator.clipboard.writeText(selectedWallet.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleSubmitDepositRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingDepRef.current) return; // Synchronous zero-latency double-click guard
    isSubmittingDepRef.current = true;
    setIsSubmittingDep(true);

    setDepError(null);
    setDepSuccess(null);

    const amt = Number(depositAmount);
    if (!amt || amt <= 0) {
      setDepError('Please enter a valid deposit amount greater than zero.');
      isSubmittingDepRef.current = false;
      setIsSubmittingDep(false);
      return;
    }

    const idempotencyKey = `DEP-${user.userId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    try {
      const tx = await submitDeposit(
        user,
        amt,
        selectedWallet.symbol,
        selectedWallet.symbol !== 'USDT' ? amt : undefined,
        depositTxHash.trim() || undefined,
        idempotencyKey
      );
      setDepositAmount('');
      setDepositTxHash('');
      const usdDisplay = tx.usdValuation ? ` (≈ $${tx.usdValuation.toFixed(2)} USD)` : '';
      setDepSuccess(`Deposit request #${tx.id} for ${amt} ${selectedWallet.symbol}${usdDisplay} submitted successfully! Status: PENDING.`);
      onUserUpdated({ ...user });
    } catch (err: any) {
      setDepError(err.message || 'Failed to submit deposit. Please try again.');
    } finally {
      isSubmittingDepRef.current = false;
      setIsSubmittingDep(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingWithRef.current) return; // Synchronous zero-latency double-click guard
    isSubmittingWithRef.current = true;
    setIsSubmittingWith(true);

    setWError(null);
    setWSuccess(null);

    const amount = Number(withdrawAmount);

    if (!amount || isNaN(amount) || amount <= 0.50) {
      setWError('Please enter a valid withdrawal amount greater than the fixed fee of $0.50 USD.');
      isSubmittingWithRef.current = false;
      setIsSubmittingWith(false);
      return;
    }

    if (amount > user.balance) {
      setWError(`Insufficient funds. Your available balance is $${user.balance.toFixed(2)}.`);
      isSubmittingWithRef.current = false;
      setIsSubmittingWith(false);
      return;
    }

    if (!withdrawAddress.trim()) {
      setWError('Please enter a destination crypto wallet address.');
      isSubmittingWithRef.current = false;
      setIsSubmittingWith(false);
      return;
    }

    const idempotencyKey = `WTH-${user.userId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    try {
      const tx = await submitWithdrawalRequest(
        user,
        amount,
        selectedSymbol,
        withdrawAddress.trim(),
        withdrawNetwork,
        undefined,
        idempotencyKey
      );
      
      const freshUser = getUsers().find((u) => u.userId === user.userId) || user;
      onUserUpdated(freshUser);

      setWithdrawAmount('');
      setWithdrawAddress('');
      setWSuccess(`Withdrawal request #${tx.id} of $${amount.toFixed(2)} submitted! Status: PENDING`);
    } catch (err: any) {
      setWError(err.message || 'Withdrawal request failed.');
    } finally {
      isSubmittingWithRef.current = false;
      setIsSubmittingWith(false);
    }
  };

  const handleCancelUserDeposit = (txId: string) => {
    try {
      cancelOwnPendingDeposit(user, txId);
      const freshUser = getUsers().find((u) => u.userId === user.userId) || user;
      onUserUpdated(freshUser);
    } catch (err: any) {
      setDepError(err.message || 'Unable to cancel deposit request.');
    }
  };

  const handleContactSupport = () => {
    window.location.href = `mailto:${OFFICIAL_SUPPORT_EMAIL}?subject=${encodeURIComponent('Deposit/Withdrawal Support Request')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-[#D4AF37]" />
          <span>Crypto Wallet & Fund Operations</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Deposit or withdraw digital assets including XRP, BTC, ETH, USDT, and SOL
        </p>
      </div>

      {/* Asset Deposit Section */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          <span>Select Cryptocurrency for Deposit</span>
        </h3>

        {/* Currency Selector */}
        <div className="flex flex-wrap gap-2">
          {wallets.map((w) => (
            <button
              key={w.symbol}
              onClick={() => {
                setSelectedSymbol(w.symbol);
                setWithdrawNetwork(w.network);
                setDepError(null);
                setDepSuccess(null);
              }}
              className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                selectedSymbol === w.symbol
                  ? 'bg-[#D4AF37] text-black shadow-md'
                  : 'bg-[#1D2432] text-slate-300 border border-[#2A3447] hover:border-slate-500'
              }`}
            >
              {w.symbol}
            </button>
          ))}
        </div>

        {/* Selected Wallet Details & Instructions */}
        {selectedWallet && (
          <div className="bg-[#1D2432] border border-[#2A3447] rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-sm font-bold text-white">{selectedWallet.name} ({selectedWallet.symbol})</span>
                <span className="text-xs text-emerald-400 font-semibold block mt-0.5">Network: {selectedWallet.network}</span>
              </div>

              {/* QR Code Placeholder */}
              <div className="flex items-center space-x-2 bg-[#0B0E14] border border-[#2A3447] p-2.5 rounded-xl self-start sm:self-auto">
                <QrCode className="w-8 h-8 text-[#D4AF37]" />
                <div className="text-[10px] text-slate-400">
                  <span className="font-bold text-white block">QR Code Active</span>
                  <span>Scan to deposit</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Official Wallet Deposit Address</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={selectedWallet.address}
                  className="flex-1 bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-[#D4AF37] font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="bg-[#2A3447] hover:bg-[#3B4861] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1 shrink-0"
                >
                  {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* XRP Destination Tag Warning */}
            {selectedWallet.symbol === 'XRP' && selectedWallet.destinationTag && (
              <div className="bg-amber-500/15 border border-amber-500/40 text-amber-300 p-3 rounded-xl text-xs space-y-1">
                <span className="font-bold block">⚠️ Destination Tag Required for XRP</span>
                <p className="text-[11px] leading-relaxed">
                  Include Destination Tag <span className="font-mono font-bold text-white">{selectedWallet.destinationTag}</span> when sending XRP. Deposits missing the destination tag cannot be automatically credited.
                </p>
              </div>
            )}

            <p className="text-[11px] text-slate-300 leading-relaxed bg-[#0B0E14] p-3 rounded-lg border border-[#2A3447]/60">
              {selectedWallet.instructions}
            </p>

            {/* Deposit Notification Submission */}
            <form onSubmit={handleSubmitDepositRequest} className="space-y-4 pt-3 border-t border-[#2A3447]">
              <div>
                <h4 className="text-xs font-bold text-white">Record & Verify Deposit Transfer:</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Enter transferred crypto amount and optional blockchain TxHash to enable automated verification.
                </p>
              </div>

              {depError && (
                <div className="bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{depError}</span>
                </div>
              )}

              {depSuccess && (
                <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3 rounded-xl flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{depSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Transfer Amount ({selectedWallet.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder={`e.g. 0.5 ${selectedWallet.symbol}`}
                    disabled={isSubmittingDep}
                    className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                  {parseFloat(depositAmount) > 0 && (
                    <div className="mt-1.5 text-[11px] font-mono text-[#D4AF37] flex items-center justify-between bg-[#0B0E14]/80 px-2 py-1 rounded-lg border border-[#2A3447]/60">
                      <span>Est. USD Value:</span>
                      <span className="font-bold">≈ ${estimatedUsdValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Blockchain TxHash / Ref (Optional)
                  </label>
                  <input
                    type="text"
                    value={depositTxHash}
                    onChange={(e) => setDepositTxHash(e.target.value)}
                    placeholder="e.g. 0x4f8a... or 6b3c..."
                    disabled={isSubmittingDep}
                    className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Protects against duplicate transaction processing</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingDep}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 shadow-lg ${
                  isSubmittingDep
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-[#D4AF37] hover:bg-[#b8982e] text-black shadow-[#D4AF37]/10 cursor-pointer'
                }`}
              >
                {isSubmittingDep ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>RECORDING DEPOSIT TO SECURE LEDGER...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>SUBMIT DEPOSIT NOTIFICATION</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* REQUIREMENT 8: WITHDRAWAL FORM */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
          <span>Request Funds Withdrawal</span>
        </h3>

        {wError && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{wError}</span>
          </div>
        )}

        {wSuccess && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3 rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{wSuccess}</span>
          </div>
        )}

        <form onSubmit={handleWithdrawal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Asset Asset/Currency</label>
              <select
                value={selectedSymbol}
                onChange={(e) => {
                  setSelectedSymbol(e.target.value);
                  const w = wallets.find((x) => x.symbol === e.target.value);
                  if (w) setWithdrawNetwork(w.network);
                }}
                className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
              >
                {wallets.map((w) => (
                  <option key={w.symbol} value={w.symbol}>
                    {w.name} ({w.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Blockchain Network</label>
              <input
                type="text"
                value={withdrawNetwork}
                onChange={(e) => setWithdrawNetwork(e.target.value)}
                className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Withdrawal Amount ($ USD)</span>
              <span>Available Active Balance: ${user.balance.toFixed(2)}</span>
            </div>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="e.g. 250.00"
              className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              required
            />
          </div>

          {/* Fee Calculation Breakdown ($0.50 Fixed Fee) */}
          {Number(withdrawAmount) > 0 && (
            <div className="bg-[#1D2432] border border-[#2A3447] p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Requested Amount:</span>
                <span className="font-bold text-white">${Number(withdrawAmount).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Fixed Withdrawal Fee:</span>
                <span className="font-bold">-${calculateWithdrawalFee(Number(withdrawAmount)).fee.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-emerald-400 pt-1 border-t border-[#2A3447] font-bold">
                <span>Net Amount to be Received:</span>
                <span className="text-sm">${calculateWithdrawalFee(Number(withdrawAmount)).netAmount.toFixed(2)} USD</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Personal Destination Crypto Wallet Address</label>
            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder="Paste destination wallet address"
              className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingWith}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center space-x-2 ${
              isSubmittingWith
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer'
            }`}
          >
            {isSubmittingWith ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>PROCESSING WITHDRAWAL REQUEST...</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>SUBMIT WITHDRAWAL REQUEST</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* REQUIREMENT 4: BONUS WALLET & BONUS WITHDRAWAL SECTION */}
      <div className="bg-[#141923] border border-[#D4AF37]/40 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Gift className="w-5 h-5 text-[#D4AF37]" />
            <span>Bonus Wallet Balance & Referral Rewards</span>
          </h3>
          <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full">
            Locked from Investments
          </span>
        </div>

        <div className="bg-[#1D2432] border border-[#2A3447] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 block">Bonus Wallet Balance</span>
            <span className="text-xl font-black text-[#D4AF37]">
              ${(user.bonusBalance || user.referralEarnings || 0).toFixed(2)} USD
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Referral rewards ($2 welcome bonus, $5 referrer) are stored here. Minimum $50 required to withdraw.
            </p>
          </div>

          <div className="shrink-0 text-right">
            {(user.bonusBalance || user.referralEarnings || 0) >= 50.0 ? (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl block">
                Eligible for Withdrawal ($50 Threshold Reached)
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl block">
                Requires ${(50.0 - (user.bonusBalance || user.referralEarnings || 0)).toFixed(2)} More
              </span>
            )}
          </div>
        </div>
      </div>

      {/* User Transaction History */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Your Transaction History</h3>
          <button
            onClick={handleContactSupport}
            className="text-xs text-[#D4AF37] hover:underline flex items-center space-x-1"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </button>
        </div>

        {userTransactions.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-6">No transaction records found.</div>
        ) : (
          <div className="divide-y divide-[#2A3447] overflow-hidden rounded-xl border border-[#2A3447]">
            {userTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTxForReceipt(tx)}
                className="p-3.5 flex items-center justify-between text-xs hover:bg-[#1D2432] transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[#D4AF37] font-bold">{tx.id}</span>
                    <span className="font-bold text-white">{tx.note || tx.type}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 space-x-2 font-mono">
                    <span>{new Date(tx.timestamp).toLocaleString()}</span>
                    {tx.txHash && <span>• Hash: {tx.txHash.slice(0, 10)}...</span>}
                    {tx.priceUsed && tx.cryptoAsset && tx.cryptoAsset !== 'USD' && tx.cryptoAsset !== 'USDT' && (
                      <span className="text-[#D4AF37]">
                        • Price Used: ${tx.priceUsed.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex items-center space-x-3 shrink-0">
                  <div>
                    <div className={`font-bold ${tx.type === 'WITHDRAWAL' || tx.type === 'BONUS_WITHDRAWAL' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {tx.type === 'WITHDRAWAL' || tx.type === 'BONUS_WITHDRAWAL' ? '-' : '+'}${tx.amount.toFixed(2)} {tx.currency || 'USD'}
                      {tx.cryptoAmount && tx.cryptoAsset && tx.cryptoAsset !== 'USD' && tx.cryptoAsset !== 'USDT' && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ({tx.cryptoAmount} {tx.cryptoAsset})
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tx.status === 'APPROVED' || tx.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : tx.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {tx.status === 'PENDING' ? 'Processing' : tx.status === 'APPROVED' || tx.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                    </span>
                  </div>

                  {tx.type === 'DEPOSIT' && tx.status === 'PENDING' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelUserDeposit(tx.id);
                      }}
                      className="text-[10px] text-rose-400 hover:underline border border-rose-500/30 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Receipt Slip Modal */}
      <TransactionReceiptModal
        transaction={selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
      />
    </div>
  );
};
