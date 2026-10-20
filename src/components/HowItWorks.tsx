import React from 'react';
import { UserPlus, Settings, TrendingUp, Activity, PieChart, Users, HelpCircle } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'Create an Account',
      desc: 'Register with a valid email and password to receive your unique Account ID.',
      icon: UserPlus
    },
    {
      num: '2',
      title: 'Complete Account Setup',
      desc: 'Verify your wallet details and secure your access credentials.',
      icon: Settings
    },
    {
      num: '3',
      title: 'Choose an Investment Plan',
      desc: 'Explore crypto yield vaults ranging from $10 to $100,000 with daily compounding.',
      icon: TrendingUp
    },
    {
      num: '4',
      title: 'View Investment Activity',
      desc: 'Monitor active strategy lockup periods, daily returns, and projected earnings.',
      icon: Activity
    },
    {
      num: '5',
      title: 'Track Balance & Transactions',
      desc: 'Review verified deposit history, approved yields, and transparent audit logs.',
      icon: PieChart
    },
    {
      num: '6',
      title: 'View Referral Activity',
      desc: 'Share your referral link or code to earn $25 bonus credit ($50 payout threshold).',
      icon: Users
    },
    {
      num: '7',
      title: 'Contact Support',
      desc: 'Connect with customer operations 24/7 at Vaultixincometeam@outlook.com.',
      icon: HelpCircle
    }
  ];

  return (
    <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-base font-bold text-[#D4AF37] flex items-center space-x-2">
          <span>How Vaultix Income Works</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">Simple 7-step guide to digital asset yield and portfolio growth</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.num} className="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 space-y-2 relative">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-extrabold text-slate-500">STEP 0{s.num}</span>
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
