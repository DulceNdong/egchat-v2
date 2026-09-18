/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bange: {
          900: '#1e3a5f',
          800: '#2d5086',
          700: '#3b67ad',
        },
      },
    },
  },
  plugins: [],
};
