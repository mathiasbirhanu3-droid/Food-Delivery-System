import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class', // feature 22 — the theme toggle flips this class on <html>
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF7F0',
        ink: '#171512',
        gold: '#E9B44C',
        primary: {
          DEFAULT: '#0C7A4D',
          50: '#EFF8F3', 100: '#D7EFE2', 200: '#AFDFC6', 300: '#7CC8A5',
          400: '#43AC82', 500: '#0C7A4D', 600: '#0A6641', 700: '#085335',
          800: '#074029', 900: '#052E1E',
        },
        accent: {
          DEFAULT: '#E4572E',
          50: '#FDF0EB', 100: '#FADDD1', 500: '#E4572E', 600: '#C94521', 700: '#A73518',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(23 21 18 / 0.06), 0 8px 24px -12px rgb(23 21 18 / 0.18)',
      },
    },
  },
  plugins: [],
} satisfies Config;