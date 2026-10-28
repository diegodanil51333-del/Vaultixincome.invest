import React, { useState, useEffect } from 'react';
import { AppToast } from '../services/toastService';
import { CheckCircle2, AlertCircle, Copy, Info, X } from 'lucide-react';

export const GlobalToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  useEffect(() => {
    const handleNewToast = (e: Event) => {
      const customEvent = e as CustomEvent<AppToast>;
      if (customEvent.detail) {
        setToasts((prev) => [...prev.slice(-3), customEvent.detail]); // keep max 4 toasts
      }
    };

    window.addEventListener('vaultix_global_toast', handleNewToast);
    return () => window.removeEventListener('vaultix_global_toast', handleNewToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-[calc(100vw-32px)] sm:w-80 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: AppToast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const config = {
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-[#141923]/95',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
      titleColor: 'text-emerald-400',
      barColor: 'bg-emerald-500'
    },
    error: {
      border: 'border-rose-500/40',
      bg: 'bg-[#141923]/95',
      iconBg: 'bg-rose-500/20 text-rose-400',
      icon: <AlertCircle className="w-4 h-4 shrink-0" />,
      titleColor: 'text-rose-400',
      barColor: 'bg-rose-500'
    },
    copy: {
      border: 'border-[#D4AF37]/50',
      bg: 'bg-[#141923]/95',
      iconBg: 'bg-[#D4AF37]/20 text-[#D4AF37]',
      icon: <Copy className="w-4 h-4 shrink-0" />,
      titleColor: 'text-[#D4AF37]',
      barColor: 'bg-[#D4AF37]'
    },
    info: {
      border: 'border-blue-500/40',
      bg: 'bg-[#141923]/95',
      iconBg: 'bg-blue-500/20 text-blue-400',
      icon: <Info className="w-4 h-4 shrink-0" />,
      titleColor: 'text-blue-400',
      barColor: 'bg-blue-500'
    }
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between p-3.5 rounded-xl border ${config.border} ${config.bg} backdrop-blur-md shadow-2xl transition-all transform duration-200 animate-in fade-in slide-in-from-top-3`}
      role="alert"
    >
      <div className="flex items-start space-x-3 min-w-0">
        <div className={`p-1.5 rounded-lg ${config.iconBg} mt-0.5`}>
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className={`text-xs font-bold ${config.titleColor} tracking-wide`}>
            {toast.title}
          </h4>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug break-words">
            {toast.message}
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="ml-2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
        title="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
