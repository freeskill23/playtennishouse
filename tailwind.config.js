/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        birch: {
          50: '#FBF8F3',
          100: '#F5EFE6',
          200: '#EDE3D3',
          300: '#E0D0BA',
          400: '#CDB99E',
          500: '#B8A07E',
          600: '#9C8463',
          700: '#7A674E',
          800: '#5C4D3A',
          900: '#3D3326',
        },
        ivory: '#F8F5EF',
        charcoal: {
          DEFAULT: '#2B2926',
          light: '#4A453E',
          muted: '#857F75',
        },
      },
      fontFamily: {
        sans: ['"Pretendard"', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif KR"', 'Georgia', 'serif'],
      },
      maxWidth: {
        '8xl': '88rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
