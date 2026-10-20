import React from 'react';
import { MarketTracker } from './MarketTracker';
import { CryptoMarquee } from './CryptoMarquee';
import { 
  BitcoinLogo, 
  EthereumLogo, 
  TetherLogo, 
  BnbLogo, 
  XrpLogo, 
  TronLogo, 
  SolanaLogo 
} from './CryptoLogos';
import { 
  ShieldCheck, 
  TrendingUp, 
  Lock, 
  ArrowRight, 
  Layers, 
  Zap, 
  Award, 
  CheckCircle2, 
  Crown, 
  Building2,
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react';
import { AmbientBackground } from './AmbientBackground';
import { Footer } from './Footer';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans flex flex-col selection:bg-[#D4AF37] selection:text-black relative">
      <AmbientBackground />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-md border-b border-[#2A3447]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.jpg" alt="Vaultix Income" className="w-10 h-10 rounded-full border border-[#D4AF37]/60 object-cover shadow-md" />
            <div>
              <span className="font-black text-lg text-[#D4AF37] tracking-wider block">VAULTIX INCOME</span>
              <span className="text-[10px] text-slate-400 font-bold block -mt-1 uppercase">Wealth & Yield Platform</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#assets" className="hover:text-[#D4AF37] transition-colors">Supported Assets</a>
            <a href="#features" className="hover:text-[#D4AF37] transition-colors">Platform Features</a>
            <a href="#market" className="hover:text-[#D4AF37] transition-colors">Market Intelligence</a>
            <a href="#vvip" className="hover:text-[#D4AF37] transition-colors">VVIP Strategies</a>
            <a href="#stocks" className="hover:text-[#D4AF37] transition-colors">Equities</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-[#2A3447] hover:border-slate-500 transition-all cursor-pointer"
            >
              LOG IN
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-[#D4AF37]/10 cursor-pointer"
            >
              GET STARTED
            </button>
          </div>
        </div>
      </header>

      {/* Moving Cryptocurrency Ticker Marquee with real SVG logos */}
      <CryptoMarquee />

      {/* Hero Banner Section with Investment Background Imagery */}
      <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden border-b border-[#2A3447]">
        {/* Dark Premium Financial Radial Lighting Overlay */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-[#141923]/95 border border-[#D4AF37]/50 px-4 py-1.5 rounded-full shadow-xl">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-black text-[#D4AF37] tracking-wider uppercase">VAULTIX PRIVATE WEALTH & DIGITAL ASSET PLATFORM</span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ● 100% Full Reserve
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
              Institutional Digital Asset Treasury & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-200 to-[#D4AF37]">Algorithmic Yield Vaults</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Regulated-grade digital asset custody, multi-signature cold storage, and automated yield compounding across USDT, Bitcoin, Ethereum, Solana, and premier global equities.
            </p>

            {/* Institutional Security Highlights Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-300 font-semibold pt-1">
              <span className="flex items-center space-x-1.5 bg-[#141923]/80 border border-[#2A3447] px-3 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-Sig Cold Custody</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-[#141923]/80 border border-[#2A3447] px-3 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Automated Daily Settlement</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-[#141923]/80 border border-[#2A3447] px-3 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Knowledge Security</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold px-8 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-[#D4AF37]/15 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>CREATE FREE ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenAuth('login')}
                className="w-full sm:w-auto bg-[#141923] hover:bg-[#1D2432] text-white font-bold px-8 py-3.5 rounded-xl text-sm border border-[#2A3447] transition-all cursor-pointer"
              >
                SECURE CLIENT LOGIN
              </button>
            </div>
          </div>

          {/* Investment Platform Visual Showcase Banner (bg_profit.jpg) */}
          <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-[#2A3447] shadow-2xl shadow-black/80 bg-[#141923] mt-8 group">
            <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
              <img
                src="/bg_profit.jpg"
                alt="Vaultix Institutional Yield Dashboard"
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-transparent to-[#0B0E14]/40" />

              {/* Glassmorphism Floating Metric Badges */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 z-10">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold text-[#D4AF37] uppercase tracking-wider block">
                    Institutional Vault Automation
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Multi-Strategy Yield Generation & Custody
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md hidden sm:block">
                    Real-time liquidity deployment across arbitrage pools and decentralized lending markets.
                  </p>
                </div>

                <div className="flex items-center space-x-3 bg-[#10141D]/90 backdrop-blur-md border border-[#2A3447] p-3 rounded-2xl shadow-xl">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Cumulative Yield Paid</span>
                    <span className="text-base sm:text-lg font-black text-[#D4AF37] font-mono">$12,480,950+</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Authentic Vector Cryptocurrency Asset Grid */}
          <div id="assets" className="pt-8">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block text-center mb-6">
              SUPPORTED BENCHMARK ASSETS & VAULTS
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 max-w-5xl mx-auto">
              {/* Bitcoin (BTC) */}
              <div className="bg-[#141923] border border-[#2A3447] p-3.5 rounded-2xl flex items-center space-x-3 hover:border-[#F7931A]/60 transition-all shadow-sm">
                <BitcoinLogo className="w-8 h-8 flex-shrink-0" />
                <div className="text-left overflow-hidden">
                  <span className="font-extrabold text-white text-xs block truncate">Bitcoin</span>
                  <span className="text-[10px] text-slate-400 font-mono">BTC</span>
                </div>
              </div>

              {/* Ethereum (ETH) */}
              <div className="bg-[#141923] border border-[#2A3447] p-3.5 rounded-2xl flex items-center space-x-3 hover:border-[#627EEA]/60 transition-all shadow-sm">
                <EthereumLogo className="w-8 h-8 flex-shrink-0" />
                <div className="text-left overflow-hidden">
                  <span className="font-extrabold text-white text-xs block truncate">Ethereum</span>
                  <span className="text-[10px] text-slate-400 font-mono">ETH</span>
                </div>
              </div>

              {/* Tether (USDT) */}
              <div className="bg-[#141923] border border-[#2A3447] p-3.5 rounded-2xl flex items-center space-x-3 hover:border-[#26A17B]/60 transition-all shadow-sm">
                <TetherLogo className="w-8 h-8 flex-shrink-0" />
                <div className="text-left overflow-hidden">
                  <span className="font-extrabold text-white text-xs block truncate">Tether</span>
                  <span className="text-[10px] text-slate-400 font-mono">USDT TRC20</span>
                </div>
              </div>

              {/* BNB */}
              <div className="bg-[#141923] border border-[#2A3447] p-3.5 rounded-2xl flex items-center space-x-3 hover:border-[#F3BA2F]/60 transition-all shadow-sm">
                <BnbLogo className="w-8 h-8 flex-shrink-0" />
                <div className="text-left overflow-hidden">
                  <span className="font-extrabold text-white text-xs block truncate">BNB Chain</span>
                  <span className="text-[10px] text-slate-400 font-mono">BNB</span>
                </div>
              </div>

              {/* Solana (SOL) */}
              <div className="bg-[#141923] border border-[#2A3447] p-3.5 rounded-2xl flex items-center space-x-3 hover:border-[#9945FF]/60 transition-all shadow-sm">
                <SolanaLogo className="w-8 h-8 flex-shrink-0" />
                <div className="text-left overflow-hidden">
                  <span className="font-extrabold text-white text-xs block truncate">Solana</span>
                  <span className="text-[10px] text-slate-400 font-mono">SOL</span>
                </div>
              </div>

              {/* Ripple (XRP) */}
              <div className="bg-[#141923] border border-[#2A3447] p-3.5 rounded-2xl flex items-center space-x-3 hover:border-[#00AAE4]/60 transition-all shadow-sm">
                <XrpLogo className="w-8 h-8 flex-shrink-0" />
                <div className="text-left overflow-hidden">
                  <span className="font-extrabold text-white text-xs block truncate">Ripple</span>
                  <span className="text-[10px] text-slate-400 font-mono">XRP</span>
                </div>
              </div>

              {/* TRON (TRX) */}
              <div className="bg-[#141923] border border-[#2A3447] p-3.5 rounded-2xl flex items-center space-x-3 hover:border-[#EB0029]/60 transition-all shadow-sm col-span-2 sm:col-span-1">
                <TronLogo className="w-8 h-8 flex-shrink-0" />
                <div className="text-left overflow-hidden">
                  <span className="font-extrabold text-white text-xs block truncate">TRON</span>
                  <span className="text-[10px] text-slate-400 font-mono">TRX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Market Section */}
      <section id="market" className="py-16 md:py-24 bg-[#0E131C]/60 backdrop-blur-sm border-b border-[#2A3447]/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-[#D4AF37] uppercase tracking-widest">Market Intelligence</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Realtime Cryptocurrency Market Tracker</h2>
            <p className="text-xs md:text-sm text-slate-400">
              Track live spot prices, percentage movements, and 24-hour liquidity data across key benchmark assets.
            </p>
          </div>

          <MarketTracker />
        </div>
      </section>

      {/* VVIP Executive Plans Preview Section with bg_growth.jpg */}
      <section id="vvip" className="relative py-16 md:py-24 bg-gradient-to-b from-[#0E131C]/80 via-[#141923]/90 to-[#0E131C]/80 backdrop-blur-sm border-b border-[#2A3447]/80 overflow-hidden">
        {/* Subtle Background Image Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <img src="/bg_growth.jpg" alt="" className="w-full h-full object-cover object-center" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center justify-center space-x-1">
              <Crown className="w-4 h-4" />
              <span>VVIP Executive Tier</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Exclusive High-Capital VVIP Strategies</h2>
            <p className="text-xs md:text-sm text-slate-400">
              Institutional yield options with fixed 1-month returns for private wealth clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* VVIP Plan 1 */}
            <div className="bg-[#141923]/95 backdrop-blur-md border border-amber-500/40 p-6 rounded-2xl space-y-4 hover:border-amber-400 transition-all shadow-xl shadow-amber-500/5 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-lg">VVIP Executive Tier 1 Plan</h3>
                  <span className="text-xs text-amber-400 font-semibold">1-Month Fixed Lock Term</span>
                </div>
                <span className="bg-amber-400 text-black font-black text-xs px-2.5 py-1 rounded-full">20% RETURN</span>
              </div>
              <p className="text-xs text-slate-300">
                Designed for high-net-worth portfolio allocations with a capital range of $10,000 to $50,000.
              </p>
              <div className="flex justify-between items-center pt-3 border-t border-[#2A3447] text-xs">
                <div><span className="text-slate-400 block">Capital Range</span><span className="font-bold text-white">$10,000 – $50,000</span></div>
                <div><span className="text-slate-400 block">Term Duration</span><span className="font-bold text-amber-400">1 Month (30 Days)</span></div>
              </div>
              <button onClick={() => onOpenAuth('register')} className="w-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md">
                INVEST IN VVIP TIER 1
              </button>
            </div>

            {/* VVIP Plan 2 */}
            <div className="bg-[#141923]/95 backdrop-blur-md border border-amber-500/40 p-6 rounded-2xl space-y-4 hover:border-amber-400 transition-all shadow-xl shadow-amber-500/5 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-lg">VVIP Institutional Tier 2 Plan</h3>
                  <span className="text-xs text-amber-400 font-semibold">1-Month Fixed Lock Term</span>
                </div>
                <span className="bg-amber-400 text-black font-black text-xs px-2.5 py-1 rounded-full">40% RETURN</span>
              </div>
              <p className="text-xs text-slate-300">
                Institutional-grade treasury vault with 40% target yield for allocations from $50,000 up to $1,000,000.
              </p>
              <div className="flex justify-between items-center pt-3 border-t border-[#2A3447] text-xs">
                <div><span className="text-slate-400 block">Capital Range</span><span className="font-bold text-white">$50,000 – $1,000,000</span></div>
                <div><span className="text-slate-400 block">Term Duration</span><span className="font-bold text-amber-400">1 Month (30 Days)</span></div>
              </div>
              <button onClick={() => onOpenAuth('register')} className="w-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md">
                INVEST IN VVIP TIER 2
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stock Investment Section */}
      <section id="stocks" className="py-16 md:py-24 bg-[#0E131C]/60 backdrop-blur-sm border-b border-[#2A3447]/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-center space-x-1">
              <Building2 className="w-4 h-4" />
              <span>Equity Market Portfolio</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Major Global Stock Investment Options</h2>
            <p className="text-xs md:text-sm text-slate-400">
              Access individual stock investment plans linked to top tech giants, semiconductors, financial institutions, retail, and energy leaders.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[
              { ticker: 'NVDA', name: 'NVIDIA', sector: 'AI Chips' },
              { ticker: 'AAPL', name: 'Apple', sector: 'Consumer Electronics' },
              { ticker: 'MSFT', name: 'Microsoft', sector: 'Cloud & Software' },
              { ticker: 'AMZN', name: 'Amazon', sector: 'E-Commerce & AWS' },
              { ticker: 'GOOGL', name: 'Alphabet', sector: 'Search & AI' },
              { ticker: 'META', name: 'Meta', sector: 'Social Networks' },
              { ticker: 'TSLA', name: 'Tesla', sector: 'EV & Clean Energy' },
              { ticker: 'AVGO', name: 'Broadcom', sector: 'Semiconductors' },
              { ticker: 'TSM', name: 'TSMC', sector: 'Foundry Manufacturing' },
              { ticker: 'AMD', name: 'AMD', sector: 'CPUs & GPUs' },
              { ticker: 'BRK.B', name: 'Berkshire', sector: 'Diversified Assets' },
              { ticker: 'JPM', name: 'JPMorgan', sector: 'Global Financial Services' },
              { ticker: 'V', name: 'Visa', sector: 'Payment Networks' },
              { ticker: 'WMT', name: 'Walmart', sector: 'Global Retail' },
              { ticker: 'NFLX', name: 'Netflix', sector: 'Streaming Media' },
              { ticker: 'KO', name: 'Coca-Cola', sector: 'Beverages' },
              { ticker: 'MCD', name: "McDonald's", sector: 'Restaurants' },
              { ticker: 'NKE', name: 'NIKE', sector: 'Sportswear' },
              { ticker: 'ORCL', name: 'Oracle', sector: 'Database & Cloud' },
              { ticker: 'XOM', name: 'Exxon Mobil', sector: 'Energy & Oil' }
            ].map((st) => (
              <div key={st.ticker} className="bg-[#141923] border border-[#2A3447] p-3.5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-indigo-400 text-xs bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-md">{st.ticker}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Stock Plan</span>
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">{st.name}</span>
                  <span className="text-[10px] text-slate-400 block">{st.sector}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid Section with bg_savings.jpg */}
      <section id="features" className="relative py-16 md:py-24 bg-[#141923]/50 border-b border-[#2A3447] overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 pointer-events-none">
          <img src="/bg_savings.jpg" alt="" className="w-full h-full object-cover object-center" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-[#D4AF37] uppercase tracking-widest">Core Capabilities</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">Engineered for Transparency & Performance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#141923] border border-[#2A3447] p-6 rounded-2xl space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Automated Vault Compound Yield</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Algorithmic arbitrage and liquid staking strategies engineered to generate daily yield liquidity starting at $10.
              </p>
            </div>

            <div className="bg-[#141923] border border-[#2A3447] p-6 rounded-2xl space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Institutional Cloud Ledger</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Encrypted multi-signature custody checkpoints and transparent immutable transaction recording.
              </p>
            </div>

            <div className="bg-[#141923] border border-[#2A3447] p-6 rounded-2xl space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Diversified Portfolio Allocations</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Simultaneous exposure to crypto liquidity pools, treasury bills, and premier global equities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

