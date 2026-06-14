/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {
      colors: {
        primary: {
          50: '#F0F7F9',
          100: '#D9EBF0',
          200: '#B3D6E1',
          300: '#7FB1C5',
          400: '#4A859F',
          500: '#2C6783',
          600: '#1F5470',
          700: '#0F4C5C',
          800: '#0C3E4D',
          900: '#082E3B',
          950: '#051E28',
        },
        accent: {
          50: '#FFF4EC',
          100: '#FFE4D0',
          200: '#FFC49A',
          300: '#FF9C5C',
          400: '#F57524',
          500: '#E36414',
          600: '#C64E0A',
          700: '#A43C09',
          800: '#85320F',
          900: '#6D2C11',
          950: '#3A1407',
        },
        success: {
          50: '#EFFBF2',
          100: '#D9F5E1',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15, 76, 92, 0.08), 0 4px 16px rgba(15, 76, 92, 0.06)',
        'card-hover': '0 4px 12px rgba(15, 76, 92, 0.12), 0 8px 32px rgba(15, 76, 92, 0.10)',
        'inner-subtle': 'inset 0 1px 2px rgba(15, 76, 92, 0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
};
