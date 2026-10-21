import React from 'react';
import { UserPlus, Compass, Wallet, DollarSign, CheckCircle2, Activity, ArrowUpRight, HelpCircle } from 'lucide-react';

interface HowItWorksProps {
  onLearnMore?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onLearnMore }) => {
  const steps = [
    {
      num: '1',
      title: 'Create an Account',
      desc: 'Register with a valid email and password to receive your unique Account ID (VX-XXXXXX) and private credentials.',
      icon: UserPlus
    },
    {
      num: '2',
      title: 'Explore Investment Plans',
      desc: 'Review available vaults, supported crypto assets, zero management fees, lockup durations, and calculated returns.',
      icon: Compass
    },
    {
      num: '3',
      title: 'Fund Your Account',
      desc: 'Deposit via supported cryptocurrency networks (BTC, ETH, USDT TRC20/ERC20, SOL). Deposits are verified on-chain.',
      icon: Wallet
    },
    {
      num: '4',
      title: 'Select an Investment',
      desc: 'Choose a plan matching your risk tolerance and specify your allocation within the plan minimums and maximums.',
      icon: DollarSign
    },
    {
      num: '5',
      title: 'Review and Confirm',
      desc: 'Inspect duration, expected daily returns, and terms before confirming your strategy subscription.',
      icon: CheckCircle2
    },
    {
      num: '6',
      title: 'Track Your Investment',
      desc: 'Monitor active vaults, daily accrued yields, transparent transaction logs, and portfolio performance in real time.',
      icon: Activity
    },
    {
      num: '7',
      title: 'Understand Withdrawals',
      desc: 'Upon maturity, principal and yields unlock for withdrawal to your external wallet with standard network gas fees.',
      icon: ArrowUpRight
    }
  ];

  return (
    <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">Simplified 7-Step Process</span>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-1">How Vaultix Income Works</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            A transparent, institutional roadmap from initial registration to automated daily yields and wallet withdrawals.
          </p>
        </div>

        {onLearnMore && (
          <button
            onClick={onLearnMore}
            className="self-start sm:self-auto px-4 py-2 bg-[#1D2432] hover:bg-[#2A3447] text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Learn How It Works
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isLast = idx === steps.length - 1;

          return (
            <div 
              key={s.num} 
              className={`bg-[#1D2432]/70 border border-[#2A3447] hover:border-[#D4AF37]/40 rounded-xl p-4 space-y-2.5 transition-all relative ${
                isLast ? 'sm:col-span-2 lg:col-span-2 bg-gradient-to-r from-[#1D2432] to-[#141923] border-[#D4AF37]/30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono font-extrabold text-[#D4AF37]">STEP 0{s.num}</span>
              </div>
              <h4 className="font-bold text-white text-sm">{s.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
