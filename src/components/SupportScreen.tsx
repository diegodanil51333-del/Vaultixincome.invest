import React, { useState } from 'react';
import { User } from '../types';
import { Mail, Copy, Check, HelpCircle, Send, MessageSquare } from 'lucide-react';

interface SupportScreenProps {
  user: User;
}

export const OFFICIAL_SUPPORT_EMAIL = 'Vaultixincometeam@outlook.com';

export const SupportScreen: React.FC<SupportScreenProps> = ({ user }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('General Support Inquiry');
  const [issueDetails, setIssueDetails] = useState('');

  const categories = [
    'Wallet & Deposits',
    'Withdrawal Request',
    'Investment Vaults',
    'Referral & Rewards',
    'General Support Inquiry'
  ];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(OFFICIAL_SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleOpenEmailClient = () => {
    const subject = encodeURIComponent(`Vaultix Income Support Request - ${selectedCategory}`);
    const body = encodeURIComponent(
      `Support Category: ${selectedCategory}\nUsername: @${user.username}\nAccount ID: ${user.accountId}\n\nIssue Details:\n${issueDetails || '[Describe your issue here]'}\n\n-------------------------------------\nSent from Vaultix Income Web Client`
    );
    window.location.href = `mailto:${OFFICIAL_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
          <span>Official Customer Operations & Support</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Direct inquiries to Vaultix Income Customer Operations</p>
      </div>

      <div className="bg-[#141923] border border-[#D4AF37]/50 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">24/7 Support Channel</span>
            <span className="text-base font-extrabold text-[#D4AF37] font-mono">{OFFICIAL_SUPPORT_EMAIL}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleOpenEmailClient}
            className="flex-1 bg-[#D4AF37] hover:bg-[#b8982e] text-black font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>OPEN EMAIL CLIENT</span>
          </button>

          <button
            onClick={handleCopyEmail}
            className="flex-1 bg-[#1D2432] hover:bg-[#2A3447] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 border border-[#2A3447] transition-all"
          >
            {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedEmail ? 'EMAIL COPIED' : 'COPY EMAIL ADDRESS'}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Select Support Category:</h3>

        <div className="space-y-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]'
                    : 'bg-[#1D2432] text-slate-300 border border-[#2A3447] hover:border-slate-500'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Issue Details (Optional)</label>
          <textarea
            value={issueDetails}
            onChange={(e) => setIssueDetails(e.target.value)}
            rows={3}
            placeholder="Type extra details or context..."
            className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <button
          onClick={handleOpenEmailClient}
          className="w-full bg-[#10B981] hover:bg-[#0d9668] text-black font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>SEND EMAIL TO SUPPORT TEAM</span>
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white">Knowledge Base & FAQs</h3>

        <div className="bg-[#141923] border border-[#2A3447] rounded-xl p-4 space-y-1.5">
          <h4 className="text-xs font-bold text-[#06B6D4] flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>How are referral bonus rewards credited?</span>
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            When a friend registers using your unique referral code or username, a $25 USD bonus is automatically deposited into your portfolio balance.
          </p>
        </div>

        <div className="bg-[#141923] border border-[#2A3447] rounded-xl p-4 space-y-1.5">
          <h4 className="text-xs font-bold text-[#06B6D4] flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>How do investment vaults earn daily yield?</span>
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Vaultix automated trading strategies run on 24-hour compounding cycles. Returns are credited directly to your account balance daily.
          </p>
        </div>
      </div>
    </div>
  );
};
