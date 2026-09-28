/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Design system teal primary
        primary: {
          DEFAULT: '#0F766E',
          hover: '#0B5E57',
          subtle: '#F0FDFA',
          dark: '#2DD4BF',
          'dark-hover': '#14B8A6',
          'dark-subtle': 'rgba(45, 212, 191, 0.12)',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#FCFCFA',
          dark: '#111827',
          'dark-elevated': '#172033',
        },
        page: {
          DEFAULT: '#F7F8F6',
          dark: '#0B1220',
        },
        verified: {
          DEFAULT: '#15803D',
          dark: '#4ADE80',
          subtle: '#F0FDF4',
        },
        pending: {
          DEFAULT: '#B45309',
          dark: '#FBBF24',
          subtle: '#FFFBEB',
        },
        danger: {
          DEFAULT: '#B91C1C',
          dark: '#F87171',
          subtle: '#FEF2F2',
        },
        info: {
          DEFAULT: '#2563EB',
          dark: '#60A5FA',
          subtle: '#EFF6FF',
        },
        border: {
          DEFAULT: '#E2E8F0',
          dark: '#263244',
        }
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(17, 24, 39, 0.06), 0 1px 2px -1px rgba(17, 24, 39, 0.04)',
        'card': '0 1px 3px 0 rgba(17, 24, 39, 0.06), 0 1px 2px -1px rgba(17, 24, 39, 0.04)',
        'card-hover': '0 4px 6px -1px rgba(17, 24, 39, 0.07), 0 2px 4px -2px rgba(17, 24, 39, 0.04)',
        'elevated': '0 10px 15px -3px rgba(17, 24, 39, 0.08), 0 4px 6px -4px rgba(17, 24, 39, 0.04)',
        'dropdown': '0 10px 25px -3px rgba(17, 24, 39, 0.1), 0 4px 6px -2px rgba(17, 24, 39, 0.05)',
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '16px',
        full: '9999px'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    }
  },
  plugins: []
};
