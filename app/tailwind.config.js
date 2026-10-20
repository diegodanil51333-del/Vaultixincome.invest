/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vaultBg: '#0B0E14',
        vaultSurface: '#141923',
        vaultSurfaceVariant: '#1D2432',
        vaultGold: '#D4AF37',
        vaultEmerald: '#10B981',
        vaultCyan: '#06B6D4',
        vaultRose: '#F43F5E',
        vaultBorder: '#2A3447',
        vaultTextMuted: '#64748B',
        vaultTextSecondary: '#94A3B8',
        vaultAdmin: '#A855F7'
      }
    },
  },
  plugins: [],
}
