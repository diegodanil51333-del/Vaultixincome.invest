import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2 } from 'lucide-react';
import { cryptoPriceService } from '../services/cryptoPriceService';

interface CryptoTicker {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  sparkline: number[];
  high24h: number;
  low24h: number;
}

const DEFAULT_TICKERS: CryptoTicker[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    priceUsd: 64280.50,
    change24h: 2.85,
    sparkline: [62100, 62400, 62800, 63100, 62900, 63700, 64280],
    high24h: 64800.00,
    low24h: 62050.00
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    priceUsd: 3490.20,
    change24h: 1.92,
    sparkline: [3380, 3410, 3400, 3440, 3420, 3470, 3490],
    high24h: 3520.00,
    low24h: 3370.00
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    priceUsd: 148.75,
    change24h: -0.84,
    sparkline: [152, 151, 149, 150, 148, 149, 148.75],
    high24h: 153.20,
    low24h: 146.50
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    priceUsd: 0.5840,
    change24h: 4.12,
    sparkline: [0.552, 0.561, 0.558, 0.570, 0.575, 0.581, 0.584],
    high24h: 0.5920,
    low24h: 0.5480
  }
];

export const MarketTracker: React.FC = () => {
  const [tickers, setTickers] = useState<CryptoTicker[]>(DEFAULT_TICKERS);
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D'>('24H');
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');

  const fetchLivePrices = async () => {
    setLoading(true);
    try {
      const priceMap = await cryptoPriceService.fetchAllPrices();
      setTickers((prev) =>
        prev.map((t) => {
          const live = priceMap[t.symbol];
          if (live && live.priceUsd > 0) {
            const newPrice = live.priceUsd;
            const newChange = live.change24h;
            const updatedSparkline = [...t.sparkline.slice(1), newPrice];
            return {
              ...t,
              priceUsd: newPrice,
              change24h: newChange,
              sparkline: updatedSparkline
            };
          }
          return t;
        })
      );
    } catch {
      // Fallback gracefully to current prices
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeTicker = tickers.find((t) => t.symbol === selectedSymbol) || tickers[0];
  const isPositive = activeTicker.change24h >= 0;

  // Mini Sparkline SVG Generator
  const renderSparkline = (data: number[], positive: boolean) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 200;
    const height = 45;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 10) - 5;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = positive ? '#10B981' : '#F43F5E';
    const fillColor = positive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

    return (
      <div className="w-full h-12 overflow-hidden relative">
        <svg className="w-full h-12 overflow-hidden block" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${activeTicker.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${height} ${points} ${width},${height}`}
            fill={fillColor}
          />
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    );

  };

  return (
    <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="font-bold text-white text-sm">Live Crypto Market Intelligence</h3>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
            Realtime Feed
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-[#0B0E14] border border-[#2A3447] p-1 rounded-xl text-xs">
            {(['1H', '24H', '7D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  timeframe === tf ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={fetchLivePrices}
            disabled={loading}
            className="p-1.5 bg-[#1D2432] hover:bg-[#2A3447] text-slate-300 rounded-xl transition-all"
            title="Refresh prices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#D4AF37]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Asset Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tickers.map((t) => {
          const isSelected = selectedSymbol === t.symbol;
          const pos = t.change24h >= 0;
          return (
            <button
              key={t.symbol}
              onClick={() => setSelectedSymbol(t.symbol)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-[#1D2432] border-[#D4AF37] shadow-md shadow-[#D4AF37]/5'
                  : 'bg-[#0B0E14] border-[#2A3447] hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{t.symbol}/USDT</span>
                <span className={`text-[10px] font-extrabold flex items-center ${pos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pos ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {pos ? '+' : ''}{t.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="text-sm font-extrabold text-white mt-1">
                ${t.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Ticker Detailed Sparkline Chart */}
      <div className="bg-[#1D2432] border border-[#2A3447] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-white text-base mr-2">{activeTicker.name} ({activeTicker.symbol}/USDT)</span>
            <span className={`font-extrabold text-xs px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isPositive ? '+' : ''}{activeTicker.change24h.toFixed(2)}% ({timeframe})
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">24h High / Low</span>
            <span className="font-mono font-bold text-white text-xs">
              ${activeTicker.high24h.toFixed(2)} / ${activeTicker.low24h.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Sparkline Graphic */}
        <div className="pt-2">
          {renderSparkline(activeTicker.sparkline, isPositive)}
        </div>
      </div>
    </div>
  );
};
