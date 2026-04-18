/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#07070d',
        bg: '#0d0e1a',
        surface: '#13142a',
        'surface-light': '#1c1d38',
        gold: { 400: '#d4ac54', dim: 'rgba(212,172,84,0.4)', ghost: 'rgba(212,172,84,0.08)' },
        indigo: { 500: '#3a2d7e', glow: 'rgba(94,62,192,0.15)' },
        cream: { DEFAULT: '#ede8da', soft: '#c9c2ae', dim: '#8a8474', ghost: 'rgba(138,132,116,0.15)' },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
