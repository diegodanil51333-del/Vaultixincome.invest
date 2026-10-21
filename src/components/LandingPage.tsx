import React, { useState } from 'react';
import { MarketTracker } from './MarketTracker';
import { CryptoMarquee } from './CryptoMarquee';
import { 
  BitcoinLogo, 
  EthereumLogo, 
  TetherLogo, 
  BnbLogo, 
  XrpLogo, 
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
  Building2,
  DollarSign,
  Activity,
  BarChart3,
  BookOpen,
  Users,
  Compass,
  ArrowUpRight,
  Menu,
  X
} from 'lucide-react';
import { AmbientBackground } from './AmbientBackground';
import { Footer } from './Footer';
import { HowItWorks } from './HowItWorks';
import { InvestmentGuideModal } from './InvestmentGuideModal';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans flex flex-col selection:bg-[#D4AF37] selection:text-black relative">
      <AmbientBackground />

      {/* 1. PROFESSIONAL NAVIGATION BAR (Requirement 2) */}
      <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-md border-b border-[#2A3447]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => scrollToSection('home')}
          >
            <img 
              src="/logo.jpg" 
              alt="Vaultix Income" 
              className="w-10 h-10 rounded-full border border-[#D4AF37]/60 object-cover shadow-md" 
            />
            <div>
              <span className="font-black text-lg text-[#D4AF37] tracking-wider block">VAULTIX INCOME</span>
              <span className="text-[10px] text-slate-400 font-bold block -mt-1 uppercase">Wealth & Yield Platform</span>
            </div>
          </div>

          {/* Desktop Nav Links (Required: Home, Investment Plans, How It Works, About Us) */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <button 
              onClick={() => scrollToSection('home')}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('plans')}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Investment Plans
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('about-us')}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              About Us
            </button>
          </nav>

          {/* Desktop Action Buttons (Required: Login, Create Account) */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2.5 rounded-xl border border-[#2A3447] hover:border-[#D4AF37]/40 transition-all cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#D4AF37]/20 cursor-pointer"
            >
              Create Account
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-bold text-slate-300 px-3 py-1.5 rounded-lg border border-[#2A3447]"
            >
              Login
            </button>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg bg-[#1D2432]"
              aria-label="Toggle Mobile Menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-[#D4AF37]" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileNavOpen && (
          <div className="sm:hidden bg-[#141923] border-b border-[#2A3447] px-4 py-4 space-y-3">
            <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-200">
              <button 
                onClick={() => scrollToSection('home')} 
                className="text-left py-2 px-3 rounded-lg hover:bg-[#1D2432]"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('plans')} 
                className="text-left py-2 px-3 rounded-lg hover:bg-[#1D2432]"
              >
                Investment Plans
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')} 
                className="text-left py-2 px-3 rounded-lg hover:bg-[#1D2432]"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('about-us')} 
                className="text-left py-2 px-3 rounded-lg hover:bg-[#1D2432]"
              >
                About Us
              </button>
            </div>
            <div className="pt-2 border-t border-[#2A3447] flex gap-2">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  onOpenAuth('login');
                }}
                className="flex-1 py-2 text-xs font-bold text-center text-slate-300 border border-[#2A3447] rounded-xl"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  onOpenAuth('register');
                }}
                className="flex-1 py-2 text-xs font-bold text-center text-black bg-[#D4AF37] rounded-xl"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. LIVE-MOVING CRYPTOCURRENCY DISPLAY (Requirement 3: BTC, ETH, USDT, BNB, SOL, XRP) */}
      <CryptoMarquee />

      {/* 3. HERO SECTION (Requirement 2 exact text & buttons) */}
      <section id="home" className="relative pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-[#2A3447]">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Trust Pill */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-[#141923]/95 border border-[#D4AF37]/50 px-4 py-1.5 rounded-full shadow-xl">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-black text-[#D4AF37] tracking-wider uppercase">
                VAULTIX PRIVATE WEALTH & DIGITAL ASSET PLATFORM
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                ● Multi-Sig Cold Custody
              </span>
            </div>

            {/* Exact Required Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
              Explore Digital Assets and <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-200 to-[#D4AF37]">Investment Opportunities</span>
            </h1>

            {/* Exact Required Supporting Text */}
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              Manage your account, explore available investment plans, monitor your portfolio, and track transactions through one convenient dashboard.
            </p>

            {/* Exact Required Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => scrollToSection('plans')}
                className="px-6 py-3.5 bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center space-x-2 cursor-pointer"
              >
                <span>Explore Investment Plans</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3.5 bg-[#141923] hover:bg-[#1D2432] text-white font-extrabold text-sm rounded-xl border border-[#2A3447] hover:border-[#D4AF37]/50 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Create Your Account</span>
                <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>
          </div>

          {/* Institutional Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6">
            <div className="bg-[#141923]/80 border border-[#2A3447] p-4 rounded-xl text-center space-y-1">
              <div className="text-xl sm:text-2xl font-mono font-black text-[#D4AF37]">$120M+</div>
              <div className="text-xs text-slate-400 font-semibold">Digital Assets Secured</div>
            </div>
            <div className="bg-[#141923]/80 border border-[#2A3447] p-4 rounded-xl text-center space-y-1">
              <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">0.00%</div>
              <div className="text-xs text-slate-400 font-semibold">Management & Vault Fees</div>
            </div>
            <div className="bg-[#141923]/80 border border-[#2A3447] p-4 rounded-xl text-center space-y-1">
              <div className="text-xl sm:text-2xl font-mono font-black text-white">100%</div>
              <div className="text-xs text-slate-400 font-semibold">Cold Storage Custody</div>
            </div>
            <div className="bg-[#141923]/80 border border-[#2A3447] p-4 rounded-xl text-center space-y-1">
              <div className="text-xl sm:text-2xl font-mono font-black text-indigo-400">24/7</div>
              <div className="text-xs text-slate-400 font-semibold">Continuous Compounding</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION (Requirement 6: 7 Simple Steps + "Learn How It Works" button) */}
      <section id="how-it-works" className="py-20 border-b border-[#2A3447] bg-[#0E121B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <HowItWorks onLearnMore={() => setIsGuideOpen(true)} />
        </div>
      </section>

      {/* 5. INVESTMENT PLANS SECTION (Requirement 2 & 4) */}
      <section id="plans" className="py-20 border-b border-[#2A3447]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
              Curated Yield Vaults
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Institutional Investment Strategies
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Explore algorithmically rebalanced crypto vaults and dividend-yielding equities designed for steady compounding with transparent lockup terms.
            </p>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan 1 */}
            <div className="bg-[#141923] border border-[#2A3447] hover:border-[#D4AF37]/50 rounded-2xl p-6 space-y-6 flex flex-col justify-between transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-[#10141D] text-[#D4AF37] border border-[#D4AF37]/30">
                    USDT Yield Vault
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    Conservative
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white">Genesis Stable Yield</h3>
                  <p className="text-xs text-slate-400 mt-1">Multi-exchange market neutral arbitrage and liquidity provisioning.</p>
                </div>

                <div className="p-4 bg-[#10141D] rounded-xl border border-[#2A3447] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Return:</span>
                    <span className="font-mono font-bold text-emerald-400">1.20% / day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lockup Term:</span>
                    <span className="font-mono font-bold text-white">14 Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min - Max:</span>
                    <span className="font-mono font-bold text-white">$100 - $5,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Management Fee:</span>
                    <span className="font-mono font-bold text-emerald-400">0.00%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#b8982e] text-black font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Invest in Genesis Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Plan 2 */}
            <div className="bg-[#141923] border border-[#D4AF37]/60 rounded-2xl p-6 space-y-6 flex flex-col justify-between transition-all relative shadow-xl shadow-[#D4AF37]/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black font-black text-[10px] tracking-wider uppercase px-3 py-0.5 rounded-full shadow">
                MOST POPULAR
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-[#10141D] text-[#D4AF37] border border-[#D4AF37]/30">
                    BTC & ETH Vault
                  </span>
                  <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full">
                    High Yield
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white">Apex Growth Strategy</h3>
                  <p className="text-xs text-slate-400 mt-1">Algorithmic options vault and institutional staking compounding.</p>
                </div>

                <div className="p-4 bg-[#10141D] rounded-xl border border-[#2A3447] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Return:</span>
                    <span className="font-mono font-bold text-emerald-400">2.10% / day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lockup Term:</span>
                    <span className="font-mono font-bold text-white">30 Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min - Max:</span>
                    <span className="font-mono font-bold text-white">$1,000 - $25,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Management Fee:</span>
                    <span className="font-mono font-bold text-emerald-400">0.00%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#b8982e] text-black font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Invest in Apex Growth</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Plan 3 */}
            <div className="bg-[#141923] border border-[#2A3447] hover:border-[#D4AF37]/50 rounded-2xl p-6 space-y-6 flex flex-col justify-between transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-[#10141D] text-purple-400 border border-purple-500/30">
                    VVIP Executive
                  </span>
                  <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
                    Executive Tier
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white">Black Diamond Sovereign</h3>
                  <p className="text-xs text-slate-400 mt-1">Dedicated quant execution, OTC block trading, and priority redemption.</p>
                </div>

                <div className="p-4 bg-[#10141D] rounded-xl border border-[#2A3447] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Return:</span>
                    <span className="font-mono font-bold text-emerald-400">3.50% / day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lockup Term:</span>
                    <span className="font-mono font-bold text-white">60 Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min - Max:</span>
                    <span className="font-mono font-bold text-white">$10,000 - $100,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dedicated Custody:</span>
                    <span className="font-mono font-bold text-emerald-400">Included</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-3 bg-[#1D2432] hover:bg-[#2A3447] text-white font-bold text-xs rounded-xl border border-[#2A3447] hover:border-[#D4AF37]/50 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Invest in Sovereign Plan</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MARKET INTELLIGENCE & TRACKER */}
      <section className="py-20 border-b border-[#2A3447] bg-[#0E121B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">Live Analytics</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Global Digital Asset Market Intelligence</h2>
            <p className="text-xs text-slate-400">Real-time spot exchange feeds across major liquidity pools.</p>
          </div>
          <MarketTracker />
        </div>
      </section>

      {/* 7. ABOUT US / SECURITY & COMPLIANCE SECTION (Requirement 2) */}
      <section id="about-us" className="py-20 border-b border-[#2A3447]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span>About Vaultix Income</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Institutional Digital Asset Custody Built for Private Investors
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Founded with a mission to bridge institutional-grade decentralized finance with seamless private wealth management, Vaultix Income provides secure multi-signature treasury services, full proof of reserves, and transparent automated yield vaults.
              </p>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>100% full-reserve digital asset backing with verifiable on-chain audits.</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Hardware-isolated multi-signature cold storage vaults for maximum security.</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Direct customer operations support via vaultixincometeam@outlook.com.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#141923] hover:bg-[#1D2432] text-[#D4AF37] border border-[#D4AF37]/50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>View Complete Investment Guide</span>
                </button>
              </div>
            </div>

            <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 sm:p-8 space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <span>Our Core Commitments</span>
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-[#10141D] rounded-xl border border-[#2A3447] space-y-1">
                  <div className="text-sm font-bold text-white">Zero Hidden Charges</div>
                  <div className="text-xs text-slate-400">
                    Vaultix Income operates on pure performance-driven allocation. No recurring subscription or custodial account fees.
                  </div>
                </div>

                <div className="p-4 bg-[#10141D] rounded-xl border border-[#2A3447] space-y-1">
                  <div className="text-sm font-bold text-white">Automated Compounding</div>
                  <div className="text-xs text-slate-400">
                    Daily calculated yields are recorded directly to your account ledger and compound during the active strategy duration.
                  </div>
                </div>

                <div className="p-4 bg-[#10141D] rounded-xl border border-[#2A3447] space-y-1">
                  <div className="text-sm font-bold text-white">Guaranteed Principle Return Upon Maturity</div>
                  <div className="text-xs text-slate-400">
                    Full principal allocation is released back into your available balance automatically upon completion of the lockup term.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION SECTION */}
      <section className="py-16 bg-gradient-to-b from-[#0E121B] to-[#0B0E14] border-b border-[#2A3447]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Ready to Start Growing Your Digital Asset Portfolio?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Create your account in under two minutes, explore our verified cryptocurrency vaults, and monitor all transactions from one convenient dashboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onOpenAuth('register')}
              className="px-8 py-3.5 bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold text-sm rounded-xl shadow-xl shadow-[#D4AF37]/20 transition-all cursor-pointer"
            >
              Create Your Account Now
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="px-6 py-3.5 bg-[#141923] hover:bg-[#1D2432] text-slate-200 font-bold text-sm rounded-xl border border-[#2A3447] transition-all cursor-pointer"
            >
              Access Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

      {/* 7-Step Investment Guide Modal */}
      <InvestmentGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onNavigateToPlans={() => scrollToSection('plans')}
      />
    </div>
  );
};
