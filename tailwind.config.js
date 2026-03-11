/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        exo: ['"Exo 2"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        neon: {
          cyan: '#00FFC2',
          pink: '#FF2D78',
          purple: '#7B2FFF',
        },
        dark: {
          900: '#050A0E',
          800: '#0D1B26',
          700: '#122233',
        },
      },
      boxShadow: {
        neon: '0 0 20px rgba(0,255,194,0.4)',
        'neon-pink': '0 0 20px rgba(255,45,120,0.4)',
        'neon-purple': '0 0 20px rgba(123,47,255,0.4)',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        scanline: 'scanline 8s linear infinite',
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,255,194,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0,255,194,0.8)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
