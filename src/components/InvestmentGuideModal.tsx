import React from 'react';
import { X, CheckCircle2, ShieldAlert, ArrowRight, HelpCircle, BookOpen, Clock, Lock, Wallet, TrendingUp, DollarSign } from 'lucide-react';

interface InvestmentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPlans?: () => void;
  onNavigateToWallet?: () => void;
}

export const InvestmentGuideModal: React.FC<InvestmentGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPlans,
  onNavigateToWallet
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '1',
      title: 'Create an Account',
      subtitle: 'Registration & Identity Verification',
      desc: 'Sign up with your email and password to receive an institutional-grade Account ID (VX-XXXXXX). Ensure your contact details are accurate for account security and recovery.',
      icon: CheckCircle2,
      badge: 'Step 01'
    },
    {
      step: '2',
      title: 'Explore Investment Plans',
      subtitle: 'Review Strategy Terms & Risks',
      desc: 'Browse our curated cryptocurrency vaults and equity portfolios. Review the minimum and maximum deposit amounts, lockup durations (14 to 90 days), daily return rates, and risk levels.',
      icon: TrendingUp,
      badge: 'Step 02'
    },
    {
      step: '3',
      title: 'Fund Your Account',
      subtitle: 'Secure Multi-Chain Crypto Deposits',
      desc: 'Navigate to your Wallet and deposit using supported networks (Bitcoin, Ethereum ERC-20, Tether TRC-20, BNB Chain, or Solana). Deposits are verified on-chain and credited to your available balance upon confirmation.',
      icon: Wallet,
      badge: 'Step 03'
    },
    {
      step: '4',
      title: 'Select an Investment',
      subtitle: 'Choose Your Allocation',
      desc: 'Select a plan that matches your financial goals and risk tolerance. Enter your desired deposit amount within the plan limits (from $100 up to $100,000 for VIP plans).',
      icon: DollarSign,
      badge: 'Step 04'
    },
    {
      step: '5',
      title: 'Review and Confirm',
      subtitle: 'Lockup & Expected Returns',
      desc: 'Before confirming, carefully review the investment duration, applicable zero management fee terms, and projected daily yields. Confirming locks the allocation for the strategy term.',
      icon: Lock,
      badge: 'Step 05'
    },
    {
      step: '6',
      title: 'Track Your Investment',
      subtitle: 'Daily Automated Performance',
      desc: 'Monitor your active vaults under "My Investments". Watch daily returns compound, view transparent transaction logs, and see your countdown to maturity.',
      icon: Clock,
      badge: 'Step 06'
    },
    {
      step: '7',
      title: 'Understand Withdrawals',
      subtitle: 'Principal Maturity & Payouts',
      desc: 'Upon plan completion, your principal and accrued yields unlock back into your available balance. You can withdraw directly to your private external wallet address with standard blockchain network fees.',
      icon: ArrowRight,
      badge: 'Step 07'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-[#141923] border border-[#D4AF37]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#10141D] border-b border-[#2A3447]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Vaultix Investment Guide</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  7 Simple Steps
                </span>
              </h2>
              <p className="text-xs text-slate-400">Everything you need to know about funding, yields, and withdrawals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1D2432] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Important Notice Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-[#D4AF37] block font-semibold mb-0.5">Risk Disclosure & Transparency</strong>
              Digital asset investments carry market risks. Returns are generated through algorithmic multi-signature custody, staking yields, and institutional liquidity provision. Never invest funds you cannot afford to lock up for the strategy term.
            </div>
          </div>

          {/* 7 Steps Timeline */}
          <div className="space-y-3">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-4 rounded-xl bg-[#1D2432]/70 border border-[#2A3447] hover:border-[#D4AF37]/30 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-xs">
                        {item.step}
                      </div>
                      <h3 className="font-bold text-sm text-white">{item.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-[#141923] px-2 py-0.5 rounded border border-[#2A3447]">
                      {item.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pl-9 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Withdrawal & Fee Policy Box */}
          <div className="p-4 rounded-xl bg-[#10141D] border border-[#2A3447] space-y-2 text-xs">
            <h4 className="font-bold text-[#D4AF37] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Withdrawal Terms & Processing</span>
            </h4>
            <ul className="text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Available balance withdrawals are processed within 1 to 24 hours to ensure cold-storage security.</li>
              <li>Minimum withdrawal threshold is $50.00 equivalent in crypto.</li>
              <li>Only standard blockchain network miner fees apply; Vaultix Income charges 0% management fees.</li>
              <li>For any account inquiries or urgent verification, contact <strong className="text-white">vaultixincometeam@outlook.com</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[#10141D] border-t border-[#2A3447]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#1D2432] rounded-xl border border-[#2A3447] transition-colors cursor-pointer"
          >
            Close Guide
          </button>
          <div className="flex items-center space-x-2">
            {onNavigateToWallet && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToWallet();
                }}
                className="px-4 py-2 text-xs font-bold text-slate-200 hover:text-white bg-[#1D2432] hover:bg-[#2A3447] rounded-xl border border-[#2A3447] transition-all cursor-pointer"
              >
                Fund Wallet
              </button>
            )}
            {onNavigateToPlans && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToPlans();
                }}
                className="px-4 py-2 text-xs font-bold text-black bg-[#D4AF37] hover:bg-[#b8982e] rounded-xl shadow-md transition-all cursor-pointer"
              >
                Explore Plans
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
