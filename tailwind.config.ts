import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef3e2', 100: '#fde5b9', 200: '#fcd58c', 300: '#fbc55f',
          400: '#fab93d', 500: '#f9a825', 600: '#f57f17', 700: '#ef6c00',
          800: '#e65100', 900: '#bf360c',
        },
        dark: {
          50: '#e8eaf6', 100: '#c5cae9', 200: '#9fa8da', 300: '#7986cb',
          400: '#5c6bc0', 500: '#3f51b5', 600: '#303f9f', 700: '#283593',
          800: '#1a237e', 900: '#0d1421', 950: '#0a0e1a',
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
