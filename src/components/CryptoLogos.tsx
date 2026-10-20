import React from 'react';

interface CryptoLogoProps {
  className?: string;
  size?: number;
}

export const BitcoinLogo: React.FC<CryptoLogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <path
      d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.922-.221-1.387-.325l.695-2.787-1.728-.431-.708 2.839c-.376-.086-.745-.17-1.104-.258l.002-.007-2.384-.596-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.058l-.183-.046-1.13 4.532c-.086.212-.303.531-.793.409.017.025-1.256-.314-1.256-.314l-.858 1.978 2.25.561c.418.105.828.214 1.231.319l-.715 2.872 1.727.431.708-2.84c.472.128.93.245 1.378.357l-.705 2.828 1.728.432.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.193 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.535 2.146-4.148.986-5.319.695l.949-3.805c1.171.292 4.929.872 4.37 3.11zm.536-5.561c-.488 1.954-3.495.962-4.471.719l.86-3.45c.976.244 4.118.699 3.611 2.731z"
      fill="#FFFFFF"
    />
  </svg>
);

export const EthereumLogo: React.FC<CryptoLogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#627EEA" />
    <g fill="#FFFFFF">
      <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity="0.6" />
      <path d="M16.498 4L9 16.22l7.498-3.35z" />
      <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity="0.6" />
      <path d="M16.498 27.995v-6.028L9 17.616z" />
      <path d="M16.498 20.573l7.497-4.353-7.497-3.349z" fillOpacity="0.2" />
      <path d="M9 16.22l7.498 4.353v-7.702z" fillOpacity="0.6" />
    </g>
  </svg>
);

export const TetherLogo: React.FC<CryptoLogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path
      d="M17.922 17.383c-.11.008-.68.04-1.8.04-1.043 0-1.637-.032-1.768-.04-4.32-.19-7.55-1.02-7.55-2.028 0-1.01 3.23-1.84 7.55-2.03v3.238c.135.01.737.042 1.776.042 1.11 0 1.682-.033 1.792-.042v-3.238c4.32.19 7.55 1.02 7.55 2.03 0 1.008-3.23 1.838-7.55 2.028zm0-4.316v-2.31h5.81V7.27H8.268v3.487h5.81v2.31c-4.856.22-8.487 1.25-8.487 2.493 0 1.242 3.63 2.272 8.487 2.492v7.71h3.844V18.06c4.853-.22 8.48-1.25 8.48-2.492 0-1.243-3.627-2.273-8.48-2.493z"
      fill="#FFFFFF"
    />
  </svg>
);

export const BnbLogo: React.FC<CryptoLogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
    <path
      d="M16 6.5l3.8 3.8-3.8 3.8-3.8-3.8zm5.3 5.3l3.8 3.8-3.8 3.8-3.8-3.8zm0 7.6l3.8 3.8-3.8 3.8-3.8-3.8zm-5.3-2.3l2.3 2.3-2.3 2.3-2.3-2.3zm-5.3-5.3l3.8 3.8-3.8 3.8-3.8-3.8zm0 7.6l3.8 3.8-3.8 3.8-3.8-3.8zm5.3 2.3l3.8 3.8-3.8 3.8-3.8-3.8z"
      fill="#FFFFFF"
    />
  </svg>
);

export const XrpLogo: React.FC<CryptoLogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#23292F" />
    <path
      d="M24.8 8h2.4l-6.8 6.7c-2.4 2.4-6.4 2.4-8.8 0L4.8 8h2.4l5.6 5.5c1.5 1.5 4.1 1.5 5.6 0zm-17.6 16h-2.4l6.8-6.7c2.4-2.4 6.4-2.4 8.8 0l6.8 6.7h-2.4l-5.6-5.5c-1.5-1.5-4.1-1.5-5.6 0z"
      fill="#00AAE4"
    />
  </svg>
);

export const TronLogo: React.FC<CryptoLogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#EB0029" />
    <path
      d="M7 8.5l17.5 4.8-12 12.2zm18 5.7l-4.5 10.3 3.5-3.8zM20 7.5L8.5 7l15.5 3.8z"
      fill="#FFFFFF"
    />
  </svg>
);

export const SolanaLogo: React.FC<CryptoLogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#141923" />
    <path
      d="M8.5 20.8h11.2l3.8-3.6H12.3l-3.8 3.6zm0-9.6h11.2l3.8-3.6H12.3l-3.8 3.6zm3.8 4.8h11.2l-3.8 3.6H8.5l3.8-3.6z"
      fill="#9945FF"
    />
  </svg>
);
