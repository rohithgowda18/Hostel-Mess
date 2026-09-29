const withOpacity = (varName) => `rgb(var(${varName}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Academic Hearth Design System Tokens connected to dynamic CSS variables
        primary: {
          DEFAULT: withOpacity('--color-primary'),
          container: withOpacity('--color-primary-container'),
          'on-container': withOpacity('--color-on-primary-container'),
          fixed: withOpacity('--color-primary-fixed'),
          'fixed-dim': withOpacity('--color-primary-fixed-dim'),
          hover: withOpacity('--color-primary-container'),
          subtle: withOpacity('--color-primary-fixed'),
          dark: withOpacity('--color-primary'),
        },
        'on-primary': {
          DEFAULT: withOpacity('--color-on-primary'),
          container: withOpacity('--color-on-primary-container'),
          fixed: withOpacity('--color-on-primary-fixed'),
          'fixed-variant': withOpacity('--color-on-primary-fixed-variant'),
        },
        'inverse-primary': withOpacity('--color-primary-fixed-dim'),
        secondary: {
          DEFAULT: withOpacity('--color-secondary'),
          container: withOpacity('--color-secondary-container'),
          'on-container': withOpacity('--color-on-secondary-container'),
          fixed: withOpacity('--color-secondary-fixed'),
          'fixed-dim': withOpacity('--color-secondary-fixed-dim'),
          subtle: withOpacity('--color-secondary-container'),
          dark: withOpacity('--color-secondary'),
        },
        'on-secondary': {
          DEFAULT: withOpacity('--color-on-secondary'),
          fixed: withOpacity('--color-on-secondary-fixed'),
          'fixed-variant': withOpacity('--color-on-secondary-fixed-variant'),
        },
        tertiary: {
          DEFAULT: withOpacity('--color-tertiary'),
          container: withOpacity('--color-tertiary-container'),
          'on-container': withOpacity('--color-on-tertiary-container'),
          fixed: withOpacity('--color-tertiary-fixed'),
          'fixed-dim': withOpacity('--color-tertiary-fixed-dim'),
        },
        'on-tertiary': {
          DEFAULT: withOpacity('--color-on-tertiary'),
          fixed: withOpacity('--color-on-tertiary-fixed'),
          'fixed-variant': withOpacity('--color-on-tertiary-fixed-variant'),
        },
        error: {
          DEFAULT: withOpacity('--color-error'),
          container: withOpacity('--color-error-container'),
          'on-container': withOpacity('--color-on-error-container'),
        },
        'on-error': {
          DEFAULT: withOpacity('--color-on-error'),
        },
        'on-error-container': withOpacity('--color-on-error-container'),
        surface: {
          DEFAULT: withOpacity('--color-surface'),
          dim: withOpacity('--color-surface-dim'),
          bright: withOpacity('--color-surface-bright'),
          container: {
            lowest: withOpacity('--color-surface-container-lowest'),
            low: withOpacity('--color-surface-container-low'),
            DEFAULT: withOpacity('--color-surface-container'),
            high: withOpacity('--color-surface-container-high'),
            highest: withOpacity('--color-surface-container-highest'),
          },
          variant: withOpacity('--color-surface-container-high'),
          elevated: withOpacity('--color-surface-container-lowest'),
          dark: withOpacity('--color-surface'),
          'dark-elevated': withOpacity('--color-surface-container-low'),
        },
        'on-surface': {
          DEFAULT: withOpacity('--color-on-surface'),
          variant: withOpacity('--color-on-surface-variant'),
        },
        'inverse-surface': withOpacity('--color-on-surface'),
        'inverse-on-surface': withOpacity('--color-surface'),
        outline: {
          DEFAULT: withOpacity('--color-outline'),
          variant: withOpacity('--color-outline-variant'),
        },
        'surface-tint': withOpacity('--color-primary'),
        page: {
          DEFAULT: withOpacity('--color-bg'),
          dark: withOpacity('--color-bg'),
        },
        verified: {
          DEFAULT: withOpacity('--color-secondary'),
          dark: withOpacity('--color-secondary'),
          subtle: withOpacity('--color-secondary-container'),
        },
        pending: {
          DEFAULT: '#b45309',
          dark: '#fbbf24',
          subtle: '#fffbeb',
        },
        danger: {
          DEFAULT: withOpacity('--color-error'),
          dark: withOpacity('--color-error'),
          subtle: withOpacity('--color-error-container'),
        },
        info: {
          DEFAULT: withOpacity('--color-primary'),
          dark: withOpacity('--color-primary'),
          subtle: withOpacity('--color-primary-fixed'),
        },
        border: {
          DEFAULT: withOpacity('--color-outline-variant'),
          subtle: withOpacity('--color-surface-container-high'),
          dark: withOpacity('--color-outline-variant'),
        }
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
        'elevated': '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    }
  },
  plugins: []
};
