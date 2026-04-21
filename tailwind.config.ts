import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Primary accent — matches forkit-site orange #FF6B35
        brand: {
          50:  '#fff4f0',
          100: '#ffe4d6',
          200: '#ffbfa5',
          300: '#ff9a74',
          400: '#ff7e4a',  // hover / lighter
          500: '#FF6B35',  // PRIMARY — forkit orange
          600: '#e85520',
          700: '#bc4219',
          800: '#903312',
          900: '#64230d',
        },
        // Dark backgrounds — matches forkit-site dark #1A1A2E
        dark: {
          50:  '#f0f0f8',
          100: '#d5d5e8',
          200: '#b0b0cc',
          300: '#8888aa',  // muted text
          400: '#606080',  // more muted text
          500: '#404060',
          600: '#2e2e50',
          700: '#252540',
          800: '#1e1e38',  // borders
          900: '#13131f',  // card backgrounds
          950: '#0d0d1a',  // page background
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
