/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        primary: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff',
          dark: '#1d4ed8',
          light: '#3b82f6',
          subtle: '#eff6ff'
        },
        secondary: {
          DEFAULT: '#059669',
          foreground: '#ffffff',
          subtle: '#ecfdf5'
        },
        background: '#f8fafc',
        foreground: '#0f172a',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a'
        },
        muted: {
          DEFAULT: '#64748b',
          foreground: '#94a3b8'
        },
        border: '#e2e8f0',
        input: '#e2e8f0',
        ring: '#2563eb',
        success: {
          DEFAULT: '#10b981',
          foreground: '#ffffff',
          subtle: '#ecfdf5'
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
          subtle: '#fffbeb'
        },
        danger: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
          subtle: '#fff1f2'
        },
        error: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
          subtle: '#fff1f2'
        },
        
        // Mapped legacy tokens for backwards compatibility
        'secondary-container': '#dcfce7',
        'on-secondary-container': '#15803d',
        'on-primary': '#ffffff',
        'surface-bright': '#f8fafc',
        'on-primary-container': '#1e40af',
        'tertiary-fixed-dim': '#cbd5e1',
        'surface-dim': '#e2e8f0',
        'inverse-on-surface': '#f8fafc',
        'on-secondary': '#ffffff',
        'primary-container': '#eff6ff',
        'surface-container-lowest': '#ffffff',
        'secondary-fixed-dim': '#86efac',
        'tertiary-container': '#f1f5f9',
        'surface-container-highest': '#e2e8f0',
        'outline-variant': '#e2e8f0',
        'on-background': '#0f172a',
        'on-primary-fixed-variant': '#1e3a8a',
        'surface-container-low': '#f8fafc',
        'tertiary': '#475569',
        'surface-tint': '#2563eb',
        'inverse-primary': '#93c5fd',
        'surface-container-high': '#f1f5f9',
        'error-container': '#fee2e2',
        'tertiary-fixed': '#e2e8f0',
        'on-error': '#ffffff',
        'primary-fixed-dim': '#93c5fd',
        'on-tertiary-fixed-variant': '#334155',
        'on-tertiary-fixed': '#0f172a',
        'surface': '#ffffff',
        'primary-fixed': '#dbeafe',
        'on-secondary-fixed': '#064e3b',
        'surface-variant': '#f1f5f9',
        'on-tertiary-container': '#1e293b',
        'secondary-fixed': '#bbf7d0',
        'on-secondary-fixed-variant': '#065f46',
        'on-surface-variant': '#64748b',
        'inverse-surface': '#1e293b',
        'surface-container': '#f8fafc',
        'on-error-container': '#991b1b',
        'on-primary-fixed': '#172554',
        'on-tertiary': '#ffffff',
        'on-surface': '#0f172a',
        'outline': '#94a3b8'
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft': '0 2px 6px -1px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px -4px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
        'elevated': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
        'dropdown': '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.06)',
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        full: '9999px'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    }
  },
  plugins: []
};
