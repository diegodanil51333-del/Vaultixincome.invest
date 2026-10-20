/**
 * Vaultix Income — Live Cryptocurrency Market Price & Valuation Service
 * Fetches real-time market data from CoinGecko with Binance API fallback
 * Caches prices with TTL to prevent rate limits and handle network failures
 */

export interface CryptoPriceData {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  lastUpdated: string;
}

// Baseline institutional prices used as resilient fallbacks if all external APIs are unreachable
const FALLBACK_PRICES: Record<string, { priceUsd: number; change24h: number; name: string }> = {
  BTC: { priceUsd: 64280.50, change24h: 2.85, name: 'Bitcoin' },
  ETH: { priceUsd: 3490.20, change24h: 1.92, name: 'Ethereum' },
  BNB: { priceUsd: 586.40, change24h: 3.15, name: 'BNB Chain' },
  XRP: { priceUsd: 0.5840, change24h: 4.12, name: 'Ripple' },
  SOL: { priceUsd: 148.75, change24h: 2.10, name: 'Solana' },
  USDT: { priceUsd: 1.00, change24h: 0.01, name: 'Tether TRC20' },
  TRX: { priceUsd: 0.1585, change24h: 1.45, name: 'TRON' },
  USD: { priceUsd: 1.00, change24h: 0.00, name: 'US Dollar' }
};

const CACHE_KEY = 'vaultix_cached_crypto_prices_v1';
const CACHE_TTL_MS = 30000; // 30 seconds cache TTL

interface CachePayload {
  timestamp: number;
  prices: Record<string, CryptoPriceData>;
}

class CryptoPriceService {
  private memoryCache: CachePayload | null = null;
  private isFetching = false;

  private getCachedPrices(): Record<string, CryptoPriceData> | null {
    if (this.memoryCache && Date.now() - this.memoryCache.timestamp < CACHE_TTL_MS) {
      return this.memoryCache.prices;
    }

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CachePayload;
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            this.memoryCache = parsed;
            return parsed.prices;
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    return null;
  }

  private setCachedPrices(prices: Record<string, CryptoPriceData>) {
    const payload: CachePayload = {
      timestamp: Date.now(),
      prices
    };
    this.memoryCache = payload;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Get currently cached prices or fallback prices synchronously
   */
  public getAllCachedPrices(): Record<string, CryptoPriceData> {
    const cached = this.getCachedPrices();
    if (cached) return cached;
    const nowIso = new Date().toISOString();
    const result: Record<string, CryptoPriceData> = {};
    for (const [sym, meta] of Object.entries(FALLBACK_PRICES)) {
      result[sym] = {
        symbol: sym,
        name: meta.name,
        priceUsd: meta.priceUsd,
        change24h: meta.change24h,
        lastUpdated: nowIso
      };
    }
    return result;
  }

  /**
   * Alias for fetchAllPrices to fetch live prices
   */
  public async fetchAllLivePrices(): Promise<Record<string, CryptoPriceData>> {
    return this.fetchAllPrices();
  }

  /**
   * Fetch all live prices from CoinGecko or fallback to Binance
   */
  public async fetchAllPrices(): Promise<Record<string, CryptoPriceData>> {
    const cached = this.getCachedPrices();
    if (cached) return cached;

    if (this.isFetching && this.memoryCache) {
      return this.memoryCache.prices;
    }

    this.isFetching = true;
    const nowIso = new Date().toISOString();
    const result: Record<string, CryptoPriceData> = {};

    // Populate default fallbacks first
    for (const [sym, meta] of Object.entries(FALLBACK_PRICES)) {
      result[sym] = {
        symbol: sym,
        name: meta.name,
        priceUsd: meta.priceUsd,
        change24h: meta.change24h,
        lastUpdated: nowIso
      };
    }

    try {
      // 1. Primary Provider: CoinGecko Simple Price API
      const cgUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,ripple,solana,tether,tron&vs_currencies=usd&include_24hr_change=true';
      const response = await fetch(cgUrl, { cache: 'no-store' });

      if (response.ok) {
        const data = await response.json();
        const mapping: Record<string, string> = {
          BTC: 'bitcoin',
          ETH: 'ethereum',
          BNB: 'binancecoin',
          XRP: 'ripple',
          SOL: 'solana',
          USDT: 'tether',
          TRX: 'tron'
        };

        for (const [sym, cgId] of Object.entries(mapping)) {
          if (data[cgId]) {
            const price = Number(data[cgId].usd);
            const change = Number(data[cgId].usd_24h_change || 0);
            if (!isNaN(price) && price > 0) {
              result[sym] = {
                symbol: sym,
                name: FALLBACK_PRICES[sym]?.name || sym,
                priceUsd: price,
                change24h: change,
                lastUpdated: nowIso
              };
            }
          }
        }

        this.setCachedPrices(result);
        return result;
      }
    } catch (err) {
      console.warn('CoinGecko price fetch failed, trying secondary price provider:', err);
    }

    // 2. Secondary Provider: Binance Public Price Ticker
    try {
      const bnUrl = 'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","BNBUSDT","XRPUSDT","SOLUSDT","TRXUSDT"]';
      const bnRes = await fetch(bnUrl, { cache: 'no-store' });
      if (bnRes.ok) {
        const bnData = await bnRes.json();
        const symbolMap: Record<string, string> = {
          BTCUSDT: 'BTC',
          ETHUSDT: 'ETH',
          BNBUSDT: 'BNB',
          XRPUSDT: 'XRP',
          SOLUSDT: 'SOL',
          TRXUSDT: 'TRX'
        };

        if (Array.isArray(bnData)) {
          for (const item of bnData) {
            const targetSym = symbolMap[item.symbol];
            if (targetSym) {
              const p = parseFloat(item.lastPrice);
              const c = parseFloat(item.priceChangePercent);
              if (!isNaN(p) && p > 0) {
                result[targetSym] = {
                  symbol: targetSym,
                  name: FALLBACK_PRICES[targetSym]?.name || targetSym,
                  priceUsd: p,
                  change24h: isNaN(c) ? 0 : c,
                  lastUpdated: nowIso
                };
              }
            }
          }
          this.setCachedPrices(result);
          return result;
        }
      }
    } catch (bnErr) {
      console.warn('Binance price fetch fallback failed, using preserved fallback cache:', bnErr);
    } finally {
      this.isFetching = false;
    }

    this.setCachedPrices(result);
    return result;
  }

  /**
   * Get single cryptocurrency current USD spot price
   */
  public async getPrice(symbol: string): Promise<number> {
    const cleanSym = symbol.toUpperCase().trim();
    if (cleanSym === 'USD' || cleanSym === 'USDT') return 1.0;

    const allPrices = await this.fetchAllPrices();
    if (allPrices[cleanSym]) {
      return allPrices[cleanSym].priceUsd;
    }

    return FALLBACK_PRICES[cleanSym]?.priceUsd || 1.0;
  }

  /**
   * Calculate live USD valuation for a crypto amount
   */
  public async calculateValuation(
    cryptoAmount: number,
    symbol: string
  ): Promise<{
    usdValuation: number;
    priceUsed: number;
    priceTimestamp: string;
    cryptoAmount: number;
    cryptoAsset: string;
  }> {
    const cleanSym = symbol.toUpperCase().trim();
    const priceUsed = await this.getPrice(cleanSym);
    const usdValuation = cryptoAmount * priceUsed;
    const priceTimestamp = new Date().toISOString();

    return {
      usdValuation,
      priceUsed,
      priceTimestamp,
      cryptoAmount,
      cryptoAsset: cleanSym
    };
  }
}

export const cryptoPriceService = new CryptoPriceService();
