import React, { useState, useEffect, useRef } from 'react';
import { User, InvestmentPlan, UserInvestment } from '../types';
import { getPlans, subscribeInvestmentPlan, getInvestments, submitWithdrawalRequest, getUsers, getAccruedProfitForInvestment, getEffectiveDailyReturn, validateWithdrawal } from '../db';
import { TrendingUp, CheckCircle, AlertCircle, DollarSign, ArrowUpRight, ShieldCheck, X, Crown, Building2, Layers } from 'lucide-react';

interface VaultsScreenProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export const VaultsScreen: React.FC<VaultsScreenProps> = ({ user, onUserUpdated }) => {
  const [activeTab, setActiveTab] = useState<'CRYPTO_VAULT' | 'VVIP_PLAN' | 'STOCK_PLAN'>('CRYPTO_VAULT');
  const [allPlans, setAllPlans] = useState<InvestmentPlan[]>(() => getPlans().filter((p) => p.isActive));
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>(() => getInvestments().filter((inv) => inv.userId === user.userId));

  useEffect(() => {
    const handleUpdate = () => {
      setAllPlans(getPlans().filter((p) => p.isActive));
      setUserInvestments(getInvestments().filter((inv) => inv.userId === user.userId));
      const freshUser = getUsers().find((u) => u.userId === user.userId);
      if (freshUser) {
        onUserUpdated(freshUser);
      }
    };

    window.addEventListener('vaultix_plans_updated', handleUpdate);
    window.addEventListener('vaultix_investments_updated', handleUpdate);
    window.addEventListener('vaultix_users_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('vaultix_plans_updated', handleUpdate);
      window.removeEventListener('vaultix_investments_updated', handleUpdate);
      window.removeEventListener('vaultix_users_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user.userId, onUserUpdated]);

  // Group plans by category
  const cryptoVaultPlans = allPlans.filter((p) => !p.category || p.category === 'CRYPTO_VAULT');
  const vvipPlans = allPlans.filter((p) => p.category === 'VVIP_PLAN');
  const stockPlans = allPlans.filter((p) => p.category === 'STOCK_PLAN');

  const currentCategoryPlans =
    activeTab === 'VVIP_PLAN' ? vvipPlans : activeTab === 'STOCK_PLAN' ? stockPlans : cryptoVaultPlans;

  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan>(() => currentCategoryPlans[0] || allPlans[0]);
  const [depositAmount, setDepositAmount] = useState<number>(() => (currentCategoryPlans[0] || allPlans[0])?.minDeposit || 100);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Investment Withdrawal Modal State
  const [selectedInvForWithdraw, setSelectedInvForWithdraw] = useState<UserInvestment | null>(null);
  const [invWithdrawAddress, setInvWithdrawAddress] = useState('');
  const [invWithdrawNetwork, setInvWithdrawNetwork] = useState('TRC20 (Tron)');
  const [invWError, setInvWError] = useState<string | null>(null);
  const [invWSuccess, setInvWSuccess] = useState<string | null>(null);

  // Dynamic live rate calculation (reflects instant admin percentage updates)
  const liveSelectedPlan = allPlans.find((p) => p.id === selectedPlan?.id) || selectedPlan;
  const effectiveDailyRate = liveSelectedPlan?.dailyRate !== undefined ? liveSelectedPlan.dailyRate : (liveSelectedPlan?.dailyYield || 0);
  const dailyReturn = (depositAmount * effectiveDailyRate) / 100;

  const handleTabChange = (tab: 'CRYPTO_VAULT' | 'VVIP_PLAN' | 'STOCK_PLAN') => {
    setActiveTab(tab);
    setError(null);
    setSuccess(null);
    const plansForTab =
      tab === 'VVIP_PLAN' ? vvipPlans : tab === 'STOCK_PLAN' ? stockPlans : cryptoVaultPlans;
    if (plansForTab.length > 0) {
      setSelectedPlan(plansForTab[0]);
      setDepositAmount(plansForTab[0].minDeposit);
    }
  };

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const isSubscribingRef = useRef(false);
  const isInvWithdrawingRef = useRef(false);

  const handleOpenConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (depositAmount <= 0) {
      setError('Please enter a valid deposit amount greater than zero.');
      return;
    }

    if (depositAmount < selectedPlan.minDeposit || depositAmount > selectedPlan.maxDeposit) {
      setError(`Deposit amount must be between $${selectedPlan.minDeposit.toLocaleString()} and $${selectedPlan.maxDeposit.toLocaleString()} for ${selectedPlan.name}.`);
      return;
    }

    if (user.balance < depositAmount) {
      setError(
        `Insufficient balance. Your available balance is $${user.balance.toFixed(2)}, but this investment requires $${depositAmount.toFixed(2)}. Please deposit funds or choose a plan within your available balance.`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubscribe = async () => {
    if (isSubscribingRef.current) return; // Synchronous zero-latency double-click guard
    isSubscribingRef.current = true;
    setIsSubscribing(true);
    setError(null);
    setSuccess(null);

    const idempotencyKey = `IDEMP-INV-${user.userId}-${selectedPlan.id}-${Math.floor(Date.now() / 15000)}`;

    try {
      const res = await subscribeInvestmentPlan(user, selectedPlan.id, depositAmount, idempotencyKey);
      onUserUpdated(res.user);
      setSuccess(`Successfully subscribed $${depositAmount.toLocaleString()} to ${selectedPlan.name}! Estimated yield: +$${res.investment.dailyReturn.toFixed(2)}/day.`);
      setShowConfirmModal(false);
    } catch (err: any) {
      setError(err.message || 'Subscription failed.');
      setShowConfirmModal(false);
    } finally {
      isSubscribingRef.current = false;
      setIsSubscribing(false);
    }
  };

  const handleExecuteInvestmentWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvWithdrawingRef.current) return;
    isInvWithdrawingRef.current = true;
    setInvWError(null);
    setInvWSuccess(null);

    if (!selectedInvForWithdraw) {
      isInvWithdrawingRef.current = false;
      return;
    }

    if (!invWithdrawAddress.trim()) {
      setInvWError('Please enter a destination crypto wallet address.');
      isInvWithdrawingRef.current = false;
      return;
    }

    try {
      // Validate account status and strict maturity lock
      validateWithdrawal(user, selectedInvForWithdraw);

      const accruedProfit = getAccruedProfitForInvestment(selectedInvForWithdraw);
      const totalAmount = selectedInvForWithdraw.amount + accruedProfit;

      const tx = await submitWithdrawalRequest(
        user,
        totalAmount,
        selectedInvForWithdraw.asset,
        invWithdrawAddress.trim(),
        invWithdrawNetwork,
        selectedInvForWithdraw.id
      );

      const freshUser = getUsers().find((u) => u.userId === user.userId) || user;
      onUserUpdated(freshUser);

      setInvWSuccess(`Withdrawal request #${tx.id} of $${totalAmount.toFixed(2)} submitted! Status: PENDING`);
      setSelectedInvForWithdraw(null);
      setInvWithdrawAddress('');
    } catch (err: any) {
      setInvWError(err.message || 'Investment withdrawal failed.');
    } finally {
      isInvWithdrawingRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          <span>Yield Vaults, VVIP Plans & Global Stocks</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Algorithmic crypto yield vaults, VVIP high-capital plans, and major equity market stock options
        </p>
      </div>

      {/* Category Navigation Tabs */}
      <div className="flex border-b border-[#2A3447] space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange('CRYPTO_VAULT')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'CRYPTO_VAULT'
              ? 'bg-[#1D2432] text-[#D4AF37] border border-[#D4AF37]/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#141923]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Crypto Yield Vaults ({cryptoVaultPlans.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('VVIP_PLAN')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'VVIP_PLAN'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#141923]'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span>VVIP Executive Plans ({vvipPlans.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('STOCK_PLAN')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'STOCK_PLAN'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-[#141923]'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>Stock Investments ({stockPlans.length})</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3.5 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {invWSuccess && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3.5 rounded-xl flex items-center space-x-2 font-mono">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{invWSuccess}</span>
        </div>
      )}

      {/* Investment Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentCategoryPlans.map((plan) => {
          const isSelected = selectedPlan.id === plan.id;
          const isVVIP = plan.category === 'VVIP_PLAN';
          const isStock = plan.category === 'STOCK_PLAN';

          return (
            <div
              key={plan.id}
              onClick={() => {
                setSelectedPlan(plan);
                setDepositAmount(plan.minDeposit);
                setError(null);
                setSuccess(null);
              }}
              className={`cursor-pointer bg-[#141923] border rounded-2xl p-5 space-y-3 transition-all relative ${
                isSelected
                  ? isVVIP
                    ? 'border-amber-400 shadow-xl shadow-amber-500/10 bg-[#1D2432]'
                    : isStock
                    ? 'border-indigo-400 shadow-xl shadow-indigo-500/10 bg-[#1D2432]'
                    : 'border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5 bg-[#1D2432]'
                  : 'border-[#2A3447] hover:border-slate-500'
              }`}
            >
              {isVVIP && (
                <span className="absolute top-3 right-3 text-[10px] font-black text-black bg-amber-400 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Crown className="w-3 h-3" />
                  <span>VVIP EXECUTIVE</span>
                </span>
              )}

              {isStock && plan.ticker && (
                <span className="absolute top-3 right-3 text-[10px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  {plan.ticker}
                </span>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm pr-16">{plan.name}</h3>
                  <span className="text-xs text-[#D4AF37] font-semibold block mt-0.5">
                    {isStock ? `${plan.ticker} • ${plan.sector}` : `${plan.asset} Base Asset`}
                  </span>
                </div>
                {!isVVIP && (
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-[#10B981]">+{plan.dailyYield}%</span>
                    <span className="block text-[10px] text-slate-400">Daily Yield</span>
                  </div>
                )}
              </div>

              {isVVIP && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-center">
                  <span className="text-xs text-slate-300 block">Target Fixed Return (1 Month)</span>
                  <span className="text-2xl font-black text-amber-400">
                    {plan.id === 'plan_vvip_1' ? '+20% RETURN' : '+40% RETURN'}
                  </span>
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed">{plan.description}</p>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2A3447] text-[11px]">
                <div>
                  <span className="text-slate-400 block">Min Deposit</span>
                  <span className="font-bold text-white">${plan.minDeposit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Max Limit</span>
                  <span className="font-bold text-white">${plan.maxDeposit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Lock Term</span>
                  <span className="font-bold text-[#06B6D4]">{plan.lockDays} Days</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscribe Form */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-[#D4AF37]" />
          <span>Subscribe to {selectedPlan.name}</span>
        </h3>

        <form onSubmit={handleOpenConfirmation} className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Deposit Amount ($)</span>
              <span>Available Balance: ${user.balance.toFixed(2)}</span>
            </div>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              min={selectedPlan.minDeposit}
              max={selectedPlan.maxDeposit}
              className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Estimated Daily Return</span>
              <span className="text-base font-extrabold text-[#10B981]">+${dailyReturn.toFixed(2)} / day</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block">{selectedPlan.lockDays}-Day Total Projected Return</span>
              <span className="text-base font-extrabold text-[#D4AF37]">+${(dailyReturn * selectedPlan.lockDays).toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#D4AF37] hover:bg-[#b8982e] text-black font-bold py-3 rounded-xl text-sm transition-all shadow-md cursor-pointer"
          >
            CONFIRM PLAN SUBSCRIPTION (${depositAmount.toLocaleString()})
          </button>
        </form>
      </div>

      {/* User Investments Table */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>Your Active & Matured Investments ({userInvestments.length})</span>
        </h3>

        {userInvestments.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-6">No active or completed investment subscriptions recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {userInvestments.map((inv) => {
              const accruedProfit = getAccruedProfitForInvestment(inv);
              const maxProfit = inv.dailyReturn * inv.durationDays;
              const totalPayout = inv.amount + accruedProfit;
              const isEligibleForWithdrawal = inv.status === 'COMPLETED' || inv.status === 'ACTIVE';

              return (
                <div key={inv.id} className="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{inv.planName}</span>
                        <span className="text-xs text-[#D4AF37] font-mono">({inv.id})</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : inv.status === 'ACTIVE'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Asset: {inv.asset} • Start Date: {new Date(inv.startDate).toLocaleDateString()} • Lock Period: {inv.durationDays} Days
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-white">${inv.amount.toFixed(2)} Principal</div>
                      <div className="text-xs font-extrabold text-[#10B981]">
                        +${accruedProfit.toFixed(2)} Accrued Profit ({((accruedProfit / inv.amount) * 100).toFixed(2)}%)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#2A3447]">
                    <div className="text-xs">
                      <span className="text-slate-400">Total Withdrawal Value: </span>
                      <span className="font-bold text-[#D4AF37]">${totalPayout.toFixed(2)} USD</span>
                    </div>

                    {isEligibleForWithdrawal && inv.status !== 'WITHDRAWAL_PENDING' && inv.status !== 'WITHDRAWN' && (
                      <button
                        onClick={() => setSelectedInvForWithdraw(inv)}
                        className="bg-[#10B981] hover:bg-[#0d9668] text-black font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-md cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Withdraw Investment</span>
                      </button>
                    )}

                    {inv.status === 'WITHDRAWAL_PENDING' && (
                      <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
                        Withdrawal Request Pending
                      </span>
                    )}

                    {inv.status === 'WITHDRAWN' && (
                      <span className="text-xs text-slate-400 font-bold bg-slate-700/30 px-3 py-1 rounded-xl">
                        Fully Withdrawn
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WITHDRAW INVESTMENT MODAL */}
      {selectedInvForWithdraw && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141923] border border-[#2A3447] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedInvForWithdraw(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ArrowUpRight className="w-5 h-5 text-[#10B981]" />
              <span>Withdraw Investment ({selectedInvForWithdraw.planName})</span>
            </h3>

            <div className="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Principal Amount:</span><span className="font-bold text-white">${selectedInvForWithdraw.amount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Accrued Profit:</span><span className="font-bold text-[#10B981]">+${getAccruedProfitForInvestment(selectedInvForWithdraw).toFixed(2)}</span></div>
              <div className="flex justify-between pt-1 border-t border-[#2A3447]"><span className="text-slate-300 font-bold">Total Payout Value:</span><span className="font-extrabold text-[#D4AF37]">${(selectedInvForWithdraw.amount + getAccruedProfitForInvestment(selectedInvForWithdraw)).toFixed(2)} USD</span></div>
            </div>

            {invWError && (
              <div className="bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{invWError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteInvestmentWithdrawal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Blockchain Network</label>
                <input
                  type="text"
                  value={invWithdrawNetwork}
                  onChange={(e) => setInvWithdrawNetwork(e.target.value)}
                  className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Crypto Wallet Address</label>
                <input
                  type="text"
                  value={invWithdrawAddress}
                  onChange={(e) => setInvWithdrawAddress(e.target.value)}
                  placeholder="Paste destination wallet address"
                  className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#10B981]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#10B981] hover:bg-[#0d9668] text-black font-bold py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer mt-2"
              >
                SUBMIT INVESTMENT WITHDRAWAL
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Investment Subscription Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#141923] border border-[#2A3447] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => !isSubscribing && setShowConfirmModal(false)}
              disabled={isSubscribing}
              className="absolute top-4 right-4 text-slate-400 hover:text-white disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              <span>Confirm Investment Subscription</span>
            </h3>

            <p className="text-xs text-slate-400">
              Please review the investment details and locking terms carefully before proceeding.
            </p>

            <div className="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Selected Plan:</span>
                <span className="font-bold text-white text-sm">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Base Asset:</span>
                <span className="font-mono text-[#D4AF37] font-bold">{selectedPlan.asset}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Investment Amount:</span>
                <span className="font-extrabold text-white text-base font-mono">${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Daily Return:</span>
                <span className="font-bold text-emerald-400">+{selectedPlan.dailyYield}% (+${dailyReturn.toFixed(2)}/day)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Lock Duration:</span>
                <span className="font-bold text-cyan-400">{selectedPlan.lockDays} Days</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#2A3447]">
                <span className="text-slate-300 font-semibold">Total Projected Return:</span>
                <span className="font-extrabold text-[#D4AF37]">
                  +${(dailyReturn * selectedPlan.lockDays).toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#2A3447]">
                <span className="text-slate-400">Your Available Balance:</span>
                <span className="font-mono text-slate-300">${user.balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Balance After Investment:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${Math.max(0, user.balance - depositAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-300 leading-relaxed">
              <strong>Notice:</strong> Your capital is secured by algorithmic yield strategies. Upon completion of the {selectedPlan.lockDays}-day maturity period, your principal and all accrued yield become eligible for withdrawal.
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubscribing}
                className="w-1/3 bg-[#1D2432] hover:bg-[#2A3447] text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscribe}
                disabled={isSubscribing}
                className="w-2/3 bg-[#D4AF37] hover:bg-[#b8982e] text-black font-bold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubscribing ? (
                  <span>Processing Investment...</span>
                ) : (
                  <span>Confirm & Lock (${depositAmount.toLocaleString()})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
