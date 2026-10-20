import React, { useState, useEffect } from 'react';
import { BitcoinLogo, EthereumLogo, TetherLogo, BnbLogo, XrpLogo, TronLogo, SolanaLogo } from './CryptoLogos';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cryptoPriceService } from '../services/cryptoPriceService';

interface TickerItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  logo: React.ReactNode;
}

const LOGO_MAP: Record<string, React.ReactNode> = {
  BTC: <BitcoinLogo className="w-5 h-5 flex-shrink-0" />,
  ETH: <EthereumLogo className="w-5 h-5 flex-shrink-0" />,
  USDT: <TetherLogo className="w-5 h-5 flex-shrink-0" />,
  BNB: <BnbLogo className="w-5 h-5 flex-shrink-0" />,
  XRP: <XrpLogo className="w-5 h-5 flex-shrink-0" />,
  SOL: <SolanaLogo className="w-5 h-5 flex-shrink-0" />,
  TRX: <TronLogo className="w-5 h-5 flex-shrink-0" />
};

export const CryptoMarquee: React.FC = () => {
  const [items, setItems] = useState<TickerItem[]>([
    { symbol: 'BTC', name: 'Bitcoin', price: '$64,280.50', change: '+2.85%', isPositive: true, logo: LOGO_MAP.BTC },
    { symbol: 'ETH', name: 'Ethereum', price: '$3,490.20', change: '+1.92%', isPositive: true, logo: LOGO_MAP.ETH },
    { symbol: 'USDT', name: 'Tether TRC20', price: '$1.0000', change: '+0.01%', isPositive: true, logo: LOGO_MAP.USDT },
    { symbol: 'BNB', name: 'BNB Chain', price: '$586.40', change: '+3.15%', isPositive: true, logo: LOGO_MAP.BNB },
    { symbol: 'SOL', name: 'Solana', price: '$148.75', change: '+2.10%', isPositive: true, logo: LOGO_MAP.SOL },
    { symbol: 'XRP', name: 'Ripple', price: '$0.5840', change: '+4.12%', isPositive: true, logo: LOGO_MAP.XRP },
    { symbol: 'TRX', name: 'Tron', price: '$0.1585', change: '+1.45%', isPositive: true, logo: LOGO_MAP.TRX }
  ]);

  useEffect(() => {
    let isMounted = true;
    const updatePrices = async () => {
      try {
        const prices = await cryptoPriceService.fetchAllPrices();
        if (!isMounted) return;
        const symbols = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'TRX'];
        const updated: TickerItem[] = symbols.map((sym) => {
          const p = prices[sym];
          const priceStr = p ? (p.priceUsd >= 1 ? `$${p.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${p.priceUsd.toFixed(4)}`) : '$0.00';
          const changeVal = p ? p.change24h : 0;
          const changeStr = `${changeVal >= 0 ? '+' : ''}${changeVal.toFixed(2)}%`;
          return {
            symbol: sym,
            name: p?.name || sym,
            price: priceStr,
            change: changeStr,
            isPositive: changeVal >= 0,
            logo: LOGO_MAP[sym] || null
          };
        });
        setItems(updated);
      } catch {
        // Keep fallback
      }
    };

    updatePrices();
    const interval = setInterval(updatePrices, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const displayItems = [...items, ...items, ...items];

  return (
    <div 
      className="w-full max-w-full overflow-hidden bg-[#10141D] border-y border-[#2A3447]/80 py-3 relative select-none"
      style={{ contain: 'layout paint' }}
    >

      {/* Gradient edge masks for smooth fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0B0E14] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0B0E14] to-transparent z-10 pointer-events-none" />

      <div className="flex animate-marquee items-center gap-6">
        {displayItems.map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="flex items-center space-x-2.5 bg-[#141923]/90 hover:bg-[#1D2432] border border-[#2A3447] px-3.5 py-1.5 rounded-xl transition-all flex-shrink-0 shadow-sm"
          >
            {item.logo}
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xs text-white tracking-wide">{item.symbol}</span>
              <span className="text-[11px] font-mono text-slate-300 font-medium">{item.price}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center ${item.isPositive ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`}>
                {item.isPositive ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
