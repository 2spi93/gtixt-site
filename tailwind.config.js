/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // GTIXT Turquoise Signature
        primary: {
          DEFAULT: '#00D4C6', // Turquoise principal
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22E6DA', // Cyan glow
          500: '#00D4C6', // Main turquoise
          600: '#00BDB1',
          700: '#0E7490',
          800: '#0EA5E9',
          900: '#164E63',
          950: '#083344',
        },
        // Dark fintech palette
        dark: {
          DEFAULT: '#020617',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#0B1C2B',
          900: '#0B1C2B',
          950: '#020617',
        },
        // Status colors
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      backgroundImage: {
        'gradient-turquoise': 'linear-gradient(135deg, #00D4C6 0%, #22E6DA 50%, #0EA5E9 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)',
        'gradient-glow': 'radial-gradient(circle at top, #22E6DA20 0%, transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #06B6D4, 0 0 10px #06B6D4' },
          '100%': { boxShadow: '0 0 10px #22D3EE, 0 0 20px #22D3EE, 0 0 30px #22D3EE' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' },
          '50%': { opacity: '0.5', boxShadow: '0 0 40px rgba(34, 211, 238, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
