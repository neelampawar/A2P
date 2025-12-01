import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          yellow: '#F8CB46',
          green: '#0C831F',
          dark: '#1C1C1C',
          gray: '#F3F4F6',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
