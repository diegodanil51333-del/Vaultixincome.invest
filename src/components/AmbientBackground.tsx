import React from 'react';
import { 
  BitcoinLogo, 
  EthereumLogo, 
  TetherLogo, 
  BnbLogo, 
  XrpLogo, 
  TronLogo, 
  SolanaLogo 
} from './CryptoLogos';

export const AmbientBackground: React.FC = () => {
  return (
    <div 
      id="vaultix-ambient-bg"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#0B0E14]"
      aria-hidden="true"
    >
      {/* 1. Refined Institutional Mesh Gradients & Atmospheric Aura */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full bg-gradient-to-b from-[#D4AF37]/12 via-[#1E293B]/20 to-transparent blur-3xl pointer-events-none animate-ambient-glow" />
      <div className="absolute top-1/4 -left-36 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-indigo-900/15 via-[#1E293B]/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-36 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-[#D4AF37]/10 via-amber-950/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-950/20 via-[#0B0E14]/60 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[750px] h-[750px] rounded-full bg-gradient-to-t from-[#0F172A]/70 via-[#141923]/30 to-transparent blur-3xl pointer-events-none" />

      {/* 2. Institutional Financial Grid & Algorithmic Curve Matrix */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00AAE4" stopOpacity="0.6" />
          </linearGradient>
          <pattern id="tradingGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2A3447" strokeWidth="0.8" />
            <circle cx="60" cy="0" r="1.2" fill="#D4AF37" fillOpacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tradingGrid)" />
        <path
          d="M 0 650 Q 350 520 700 580 T 1400 460 T 2100 340 T 2800 280"
          fill="none"
          stroke="url(#chartGrad)"
          strokeWidth="1.8"
        />
        <path
          d="M 0 740 Q 400 630 800 680 T 1600 560 T 2400 440 T 3200 380"
          fill="none"
          stroke="#2A3447"
          strokeWidth="1.2"
          strokeDasharray="4,4"
        />
      </svg>

      {/* 3. Elegantly Animated Floating Cryptocurrency Badges (Desktop, Tablet & Mobile) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bitcoin (BTC) - Upper Left */}
        <div className="absolute top-[8%] left-[2%] sm:left-[4%] lg:left-[5%] flex items-center space-x-2 py-1.5 px-2.5 sm:px-3 rounded-2xl bg-[#141923]/75 border border-[#2A3447]/60 shadow-lg shadow-black/40 backdrop-blur-sm animate-float-1">
          <BitcoinLogo className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-amber-300/90 tracking-wider">BTC</span>
        </div>

        {/* Ethereum (ETH) - Upper Right */}
        <div className="absolute top-[14%] right-[2%] sm:right-[4%] lg:right-[6%] flex items-center space-x-2 py-1.5 px-2.5 sm:px-3 rounded-2xl bg-[#141923]/75 border border-[#2A3447]/60 shadow-lg shadow-black/40 backdrop-blur-sm animate-float-2">
          <EthereumLogo className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-indigo-300/90 tracking-wider">ETH</span>
        </div>

        {/* Tether (USDT) - Mid Left */}
        <div className="absolute top-[36%] left-[1.5%] sm:left-[3%] lg:left-[4%] flex items-center space-x-2 py-1.5 px-2.5 sm:px-3 rounded-2xl bg-[#141923]/75 border border-[#2A3447]/60 shadow-lg shadow-black/40 backdrop-blur-sm animate-float-3">
          <TetherLogo className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-emerald-300/90 tracking-wider">USDT</span>
        </div>

        {/* Solana (SOL) - Mid Right */}
        <div className="absolute top-[48%] right-[2%] sm:right-[3.5%] lg:right-[5%] flex items-center space-x-2 py-1.5 px-2.5 sm:px-3 rounded-2xl bg-[#141923]/75 border border-[#2A3447]/60 shadow-lg shadow-black/40 backdrop-blur-sm animate-float-1">
          <SolanaLogo className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-purple-300/90 tracking-wider">SOL</span>
        </div>

        {/* BNB Chain (BNB) - Lower Mid Left */}
        <div className="absolute top-[64%] left-[2%] sm:left-[4%] lg:left-[5%] flex items-center space-x-2 py-1.5 px-2.5 sm:px-3 rounded-2xl bg-[#141923]/75 border border-[#2A3447]/60 shadow-lg shadow-black/40 backdrop-blur-sm animate-float-2">
          <BnbLogo className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-yellow-300/90 tracking-wider">BNB</span>
        </div>

        {/* TRON (TRX) - Lower Right */}
        <div className="absolute top-[75%] right-[2%] sm:right-[4%] lg:right-[6%] flex items-center space-x-2 py-1.5 px-2.5 sm:px-3 rounded-2xl bg-[#141923]/75 border border-[#2A3447]/60 shadow-lg shadow-black/40 backdrop-blur-sm animate-float-3">
          <TronLogo className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-red-400/90 tracking-wider">TRX</span>
        </div>

        {/* Ripple (XRP) - Bottom Left */}
        <div className="absolute top-[88%] left-[2.5%] sm:left-[5%] lg:left-[6%] flex items-center space-x-2 py-1.5 px-2.5 sm:px-3 rounded-2xl bg-[#141923]/75 border border-[#2A3447]/60 shadow-lg shadow-black/40 backdrop-blur-sm animate-float-1">
          <XrpLogo className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-cyan-300/90 tracking-wider">XRP</span>
        </div>
      </div>
    </div>
  );
};
