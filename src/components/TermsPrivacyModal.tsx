import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';

interface TermsPrivacyModalProps {
  initialTab?: 'terms' | 'privacy';
  onClose: () => void;
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({ initialTab = 'terms', onClose }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#141923] border border-[#2A3447] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-white my-auto max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A3447] pb-4">
          <div className="flex items-center space-x-3">
            <img src="/logo.jpg" alt="Vaultix Income" className="w-9 h-9 rounded-full border border-[#D4AF37]/60 object-cover" />
            <div>
              <h3 className="font-bold text-white text-base">Vaultix Income Legal Framework</h3>
              <p className="text-[11px] text-slate-400">Terms of Service & Global Privacy Commitment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-[#1D2432] p-2 rounded-full border border-[#2A3447] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#2A3447] space-x-4">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-2 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'terms' ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms & Conditions</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'privacy' ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto pr-2 space-y-4 text-xs text-slate-300 leading-relaxed font-sans flex-1">
          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <div className="bg-[#1D2432] border border-[#2A3447] p-4 rounded-xl space-y-2">
                <span className="font-bold text-white text-sm block">1. Acceptance of Terms</span>
                <p>
                  By registering an account or subscribing to yield strategies on Vaultix Income, you agree to adhere to all platform rules, security protocols, and operational guidelines.
                </p>
              </div>

              <div className="bg-[#1D2432] border border-[#2A3447] p-4 rounded-xl space-y-2">
                <span className="font-bold text-white text-sm block">2. Account Responsibility & Security</span>
                <p>
                  Users are solely responsible for protecting their account login credentials and verifying destination cryptocurrency wallet addresses before authorizing fund transfers.
                </p>
              </div>

              <div className="bg-[#1D2432] border border-[#2A3447] p-4 rounded-xl space-y-2">
                <span className="font-bold text-white text-sm block">3. Yield Strategies & Lock Terms</span>
                <p>
                  Investment vault strategies, VVIP plans, and stock portfolios adhere to defined lock-up periods and daily yield rates. Capital is returned to user balances upon plan maturity.
                </p>
              </div>

              <div className="bg-[#1D2432] border border-[#2A3447] p-4 rounded-xl space-y-2">
                <span className="font-bold text-white text-sm block">4. Deposits & Withdrawals</span>
                <p>
                  Deposits and withdrawals are processed in USD equivalent using supported digital assets (USDT, BTC, ETH, SOL, XRP). XRP deposits require valid Destination Tags for account attribution.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#1D2432] border border-[#2A3447] p-4 rounded-xl space-y-2">
                <span className="font-bold text-white text-sm block">1. Data Encryption & Storage</span>
                <p>
                  All account records, ledger transactions, and session states on Vaultix Income are encrypted using end-to-end 256-bit TLS/SSL encryption and immutable database logging.
                </p>
              </div>

              <div className="bg-[#1D2432] border border-[#2A3447] p-4 rounded-xl space-y-2">
                <span className="font-bold text-white text-sm block">2. Information Collection</span>
                <p>
                  We collect essential registration details (Username, Email, Full Name) solely to provide platform services, balance tracking, and deposit/withdrawal processing.
                </p>
              </div>

              <div className="bg-[#1D2432] border border-[#2A3447] p-4 rounded-xl space-y-2">
                <span className="font-bold text-white text-sm block">3. Zero Third-Party Sharing</span>
                <p>
                  Vaultix Income does not sell, rent, or trade user personal information or wallet transaction histories to third parties or advertising networks.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2A3447] pt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-400 text-[11px] font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>256-Bit TLS Secured Document</span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#D4AF37] hover:bg-[#b8982e] text-black font-bold px-5 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
