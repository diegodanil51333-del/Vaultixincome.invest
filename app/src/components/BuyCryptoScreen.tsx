import React, { useState } from 'react';
import { CryptoProvider } from '../types';
import { Globe, Info, ExternalLink, ShieldCheck, CreditCard } from 'lucide-react';

export const BuyCryptoScreen: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState('United States');

  const countries = ['United States', 'United Kingdom', 'European Union', 'Canada', 'Australia', 'Global / Other'];

  const providers: CryptoProvider[] = [
    {
      name: 'MoonPay',
      regions: ['United States', 'United Kingdom', 'European Union', 'Canada', 'Australia', 'Global / Other'],
      paymentMethods: ['ACH / Wire Transfer', 'Credit & Debit Cards', 'Apple Pay', 'SEPA Instant'],
      supportedCryptos: ['BTC', 'ETH', 'USDT', 'SOL', 'USDC'],
      websiteUrl: 'https://www.moonpay.com/buy',
      tagLine: 'Regulated Global On-Ramp Gateway'
    },
    {
      name: 'Banxa',
      regions: ['United States', 'United Kingdom', 'European Union', 'Canada', 'Australia', 'Global / Other'],
      paymentMethods: ['Wire Transfer', 'Interac (Canada)', 'POLi (Australia)', 'Visa/Mastercard'],
      supportedCryptos: ['BTC', 'ETH', 'USDT', 'USDC'],
      websiteUrl: 'https://banxa.com',
      tagLine: 'Compliant Multi-Currency Payment Infrastructure'
    },
    {
      name: 'Ramp Network',
      regions: ['United Kingdom', 'European Union', 'United States', 'Global / Other'],
      paymentMethods: ['Instant Electronic', 'SEPA Instant', 'Credit Card', 'Pix'],
      supportedCryptos: ['BTC', 'ETH', 'USDT', 'MATIC'],
      websiteUrl: 'https://ramp.network/buy',
      tagLine: 'Non-Custodial Instant Crypto Exchange'
    },
    {
      name: 'Coinbase Pay',
      regions: ['United States', 'United Kingdom', 'European Union', 'Canada', 'Global / Other'],
      paymentMethods: ['ACH Transfer', 'Direct Wire', 'Debit Card'],
      supportedCryptos: ['BTC', 'ETH', 'USDT', 'SOL', 'ADA'],
      websiteUrl: 'https://www.coinbase.com/buy-crypto',
      tagLine: 'Licensed U.S. Regulated Brokerage On-Ramp'
    }
  ];

  const filteredProviders = providers.filter(
    (p) => p.regions.includes(selectedCountry) || p.regions.includes('Global / Other')
  );

  return (
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center space-x-2">
          <Globe class="w-5 h-5 text-[#06B6D4]" />
          <span>Buy Crypto via Regulated Providers</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">Locally compliant fiat-to-crypto gateways for your region</p>
      </div>

      {/* Country Selector */}
      <div class="bg-[#141923] border border-[#2A3447] rounded-2xl p-5 space-y-3">
        <label class="block text-xs font-bold text-white">Select Your Residence Jurisdiction:</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {countries.map((c) => {
            const isSelected = selectedCountry === c;
            return (
              <button
                key={c}
                onClick={() => setSelectedCountry(c)}
                class={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]'
                    : 'bg-[#1D2432] text-slate-300 border border-[#2A3447] hover:border-slate-500'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mandatory Third-Party Disclaimer Banner */}
      <div class="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] p-4 rounded-xl flex items-start space-x-3 text-xs">
        <Info class="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <span class="font-bold block mb-0.5">Third-Party Gateway Disclaimer</span>
          <p class="text-slate-300 leading-relaxed text-[11px]">
            Crypto purchases are completed through the selected third-party provider. Vaultix Income does not control the provider's pricing, verification, availability, fees, or transaction processing.
          </p>
        </div>
      </div>

      {/* Filtered Providers List */}
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-white">
          Verified On-Ramp Providers in {selectedCountry} ({filteredProviders.length})
        </h3>

        {filteredProviders.map((provider) => (
          <div key={provider.name} class="bg-[#141923] border border-[#2A3447] rounded-2xl p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck class="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 class="font-bold text-white text-base">{provider.name}</h4>
                  <p class="text-xs text-slate-400">{provider.tagLine}</p>
                </div>
              </div>

              <a
                href={provider.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="bg-[#10B981] hover:bg-[#0d9668] text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all self-start sm:self-auto"
              >
                <span>Buy Crypto</span>
                <ExternalLink class="w-3.5 h-3.5" />
              </a>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#2A3447] text-xs">
              <div>
                <span class="text-slate-400 block mb-1">Supported Payment Options</span>
                <span class="text-white font-medium">{provider.paymentMethods.join(', ')}</span>
              </div>

              <div>
                <span class="text-slate-400 block mb-1">Supported Cryptocurrencies</span>
                <span class="text-[#D4AF37] font-bold">{provider.supportedCryptos.join(' • ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
