import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, X } from 'lucide-react';

interface ToastData {
  id: string;
  username: string;
  amount: number;
  asset: string;
  planName: string;
}

export const InvestmentNotificationToast: React.FC = () => {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        username: string;
        amount: number;
        asset?: string;
        planName?: string;
      }>;

      if (!customEvent.detail) return;

      const data: ToastData = {
        id: `toast-${Date.now()}`,
        username: customEvent.detail.username,
        amount: customEvent.detail.amount,
        asset: customEvent.detail.asset || 'USDT',
        planName: customEvent.detail.planName || 'Crypto Vault'
      };

      setToast(data);

      clearTimeout(timer);
      // Strictly auto-dismiss after exactly 2 seconds as specified in requirement
      timer = setTimeout(() => {
        setToast(null);
      }, 2000);
    };

    window.addEventListener('vaultix_investment_toast', handleToastEvent);

    return () => {
      window.removeEventListener('vaultix_investment_toast', handleToastEvent);
      clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full pointer-events-auto transition-all duration-300 ease-out transform animate-in fade-in slide-in-from-top-4">
      <div className="bg-[#141923]/95 backdrop-blur-md border border-[#D4AF37]/60 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center justify-between space-x-3 text-white">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-amber-900/30 border border-[#D4AF37]/50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white">Investment Confirmed</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold flex items-center space-x-1">
                <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                <span>SUCCESS</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 truncate">
              User <span className="font-bold text-[#D4AF37]">@{toast.username}</span> invested{' '}
              <span className="font-extrabold text-emerald-400">${toast.amount.toFixed(2)}</span> in{' '}
              <span className="font-medium text-white">{toast.asset}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setToast(null)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
