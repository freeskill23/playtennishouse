/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        volt: {
          50: '#f3fee7',
          100: '#e3fbbf',
          200: '#cef888',
          300: '#b4f04a',
          400: '#9ee021',
          500: '#7fc70a',
          600: '#5fa003',
          700: '#487a08',
          800: '#3a600c',
          900: '#314d0d',
        },
        navy: {
          50: '#eef3ff',
          100: '#d9e2ff',
          200: '#b8c8ff',
          300: '#8aa3ff',
          400: '#5a78fc',
          500: '#3a57f0',
          600: '#2740d6',
          700: '#1f33ac',
          800: '#1d2d87',
          900: '#1b2969',
          950: '#0f1640',
        },
        clay: {
          50: '#fbf6ee',
          100: '#f5e6d0',
          200: '#ecca9d',
          300: '#e0a85f',
          400: '#d8893a',
          500: '#c56f25',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Pretendard', 'sans-serif'],
      },
      boxShadow: {
        volt: '0 8px 30px -8px rgba(126, 199, 10, 0.45)',
        navy: '0 8px 30px -8px rgba(27, 41, 105, 0.35)',
        card: '0 2px 12px -2px rgba(15, 22, 64, 0.08), 0 1px 3px -1px rgba(15, 22, 64, 0.06)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.96)' },
          '60%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        'bounce-ball': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'pop': 'pop 0.25s ease-out',
        'bounce-ball': 'bounce-ball 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
