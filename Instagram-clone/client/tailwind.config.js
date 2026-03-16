/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        instagram: {
          blue:   '#405DE6',
          purple: '#833AB4',
          pink:   '#E1306C',
          orange: '#F56040',
          yellow: '#FFDC80',
        },
      },
    },
  },
  plugins: [],
};