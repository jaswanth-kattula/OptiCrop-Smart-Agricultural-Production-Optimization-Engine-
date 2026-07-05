/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f8f5',
          100: '#e1efe8',
          200: '#c5dfd2',
          300: '#9bc8b3',
          400: '#6ca88d',
          500: '#4b8d70',
          600: '#3a7259',
          700: '#305c49',
          800: '#284b3c',
          900: '#223f33',
          950: '#10251d',
        },
        earth: {
          50: '#fbf8f3',
          100: '#f5edd9',
          200: '#ead7b3',
          300: '#dcb985',
          400: '#ce995a',
          500: '#c17f3d',
          600: '#b26832',
          700: '#945129',
          800: '#774125',
          900: '#603620',
          950: '#341a0e',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
