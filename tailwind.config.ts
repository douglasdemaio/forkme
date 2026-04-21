import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Primary accent — forkit orange
        brand: {
          50:  '#fff4f0',
          100: '#ffe4d6',
          200: '#ffbfa5',
          300: '#ff9a74',
          400: '#ff7e4a',  // hover
          500: '#FF6B35',  // PRIMARY
          600: '#e85520',
          700: '#bc4219',
          800: '#903312',
          900: '#64230d',
        },
        // Dark backgrounds — forkit navy, with enough contrast between layers
        dark: {
          50:  '#f0f0fa',
          100: '#d8d8f0',
          200: '#b0b0d8',
          300: '#9090c0',  // subtitle / muted text — readable purple-gray
          400: '#686898',  // more muted text
          500: '#44446e',
          600: '#303058',
          700: '#222244',  // used for secondary surfaces
          800: '#1a1a38',  // borders — visible but subtle
          900: '#111128',  // card backgrounds — clearly distinct from 950
          950: '#09090f',  // page background — near black
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
