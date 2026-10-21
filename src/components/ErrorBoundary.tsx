import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, LogOut } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Vaultix ErrorBoundary caught unhandled crash:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    try {
      localStorage.setItem('vaultix_current_tab_v11', 'dashboard');
      sessionStorage.setItem('vaultix_current_tab_v11', 'dashboard');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleClearAndLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col items-center justify-center p-6 selection:bg-[#D4AF37] selection:text-black">
          <div className="w-full max-w-md bg-[#141923] border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-[#D4AF37]">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                {this.props.fallbackTitle || 'Session Interface Notice'}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                An unexpected interface issue was caught while loading your account view. Your balances, active investments, and transactions remain completely safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#10141D] border border-[#2A3447] rounded-xl text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Diagnostic Information
                </span>
                <p className="text-xs font-mono text-rose-400 break-words line-clamp-3">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Dashboard</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndLogout}
                className="w-full py-2.5 bg-[#1D2432] hover:bg-[#2A3447] text-slate-300 text-xs font-semibold rounded-xl border border-[#2A3447] transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Return to Home & Sign In Again</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
