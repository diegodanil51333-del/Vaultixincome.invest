import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, FileText, HelpCircle, ArrowUpRight } from 'lucide-react';
import { TermsPrivacyModal } from './TermsPrivacyModal';

interface FooterProps {
  onOpenSupport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSupport }) => {
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | null>(null);

  return (
    <footer className="bg-[#0B0E14]/90 backdrop-blur-xl border-t border-[#2A3447] text-slate-400 text-xs py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <img src="/logo.jpg" alt="Vaultix Income" className="w-9 h-9 rounded-full border border-[#D4AF37]/60 object-cover" />
              <div>
                <span className="font-extrabold text-sm text-[#D4AF37] tracking-wider block">VAULTIX INCOME</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Digital Wealth Platform</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Algorithmic yield vaults, VVIP executive strategies, and global equity market investments powered by transparent multi-asset liquidity routing.
            </p>
          </div>

          {/* Column 2: Supported Assets */}
          <div className="space-y-2">
            <span className="font-bold text-white text-xs block uppercase tracking-wider">Supported Networks</span>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>• USDT (TRC20 / ERC20)</li>
              <li>• Bitcoin Native (SegWit)</li>
              <li>• Ethereum Mainnet</li>
              <li>• Solana Native</li>
              <li>• XRP Ledger (XRPL Tag)</li>
            </ul>
          </div>

          {/* Column 3: Legal & Security */}
          <div className="space-y-2">
            <span className="font-bold text-white text-xs block uppercase tracking-wider">Legal & Transparency</span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button
                  onClick={() => setLegalTab('terms')}
                  className="hover:text-[#D4AF37] transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Terms & Conditions</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLegalTab('privacy')}
                  className="hover:text-[#D4AF37] transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <div className="flex items-center space-x-1 text-emerald-400 font-semibold pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>256-Bit TLS Encrypted</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Help & Support */}
          <div className="space-y-2">
            <span className="font-bold text-white text-xs block uppercase tracking-wider">Support Center</span>
            <p className="text-[11px] text-slate-400">
              Have questions regarding deposits, withdrawals, or vault subscriptions?
            </p>
            <button
              onClick={() => {
                if (onOpenSupport) onOpenSupport();
                else window.location.href = 'mailto:vaultixincometeam@outlook.com';
              }}
              className="bg-[#1D2432] hover:bg-[#2A3447] text-[#D4AF37] font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all border border-[#2A3447] cursor-pointer mt-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#2A3447]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>© 2020 Vaultix Income. All rights reserved.</div>
          <div className="flex items-center space-x-4">
            <span>Global USD Platform</span>
            <span>•</span>
            <span>Immutable Ledger System</span>
          </div>
        </div>

      </div>

      {legalTab && (
        <TermsPrivacyModal initialTab={legalTab} onClose={() => setLegalTab(null)} />
      )}
    </footer>
  );
};
