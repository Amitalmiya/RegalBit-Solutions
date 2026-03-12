/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Clash Display', 'Syne', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0A0A0F',
          900: '#111118',
          800: '#1A1A25',
          700: '#252535',
          600: '#343448',
          500: '#4A4A6A',
        },
        volt: {
          400: '#C8FF00',
          500: '#AEDE00',
          600: '#8BB500',
        },
        azure: {
          400: '#00D4FF',
          500: '#00B8E6',
        },
        coral: {
          400: '#FF6B6B',
          500: '#FF4444',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        slideInRight: {
          from: { opacity: 0, transform: 'translateX(20px)' },
          to: { opacity: 1, transform: 'translateX(0)' }
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' }
        },
      },
    },
  },
  plugins: [],
}