/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'secondary-container': '#80f98b',
        'on-primary': '#ffffff',
        'surface-bright': '#f8f9fa',
        'on-primary-container': '#bbd0ff',
        'tertiary-fixed-dim': '#bfc8d0',
        'surface-dim': '#d9dadb',
        'inverse-on-surface': '#f0f1f2',
        'on-secondary': '#ffffff',
        'error': '#ba1a1a',
        'primary-container': '#0056b3',
        'surface-container-lowest': '#ffffff',
        'secondary-fixed-dim': '#66df75',
        'tertiary-container': '#515a62',
        'surface-container-highest': '#e1e3e4',
        'outline-variant': '#c2c6d4',
        'on-background': '#191c1d',
        'on-primary-fixed-variant': '#004491',
        'surface-container-low': '#f3f4f5',
        'tertiary': '#3a434a',
        'surface-tint': '#115cb9',
        'inverse-primary': '#acc7ff',
        'background': '#f8f9fa',
        'surface-container-high': '#e7e8e9',
        'error-container': '#ffdad6',
        'tertiary-fixed': '#dbe4ed',
        'on-error': '#ffffff',
        'primary-fixed-dim': '#acc7ff',
        'on-tertiary-fixed-variant': '#3f484f',
        'on-tertiary-fixed': '#141d23',
        'primary': '#003f87',
        'surface': '#f8f9fa',
        'primary-fixed': '#d7e2ff',
        'on-secondary-fixed': '#002106',
        'surface-variant': '#e1e3e4',
        'secondary': '#006e25',
        'on-tertiary-container': '#c8d1da',
        'secondary-fixed': '#83fc8e',
        'on-secondary-fixed-variant': '#00531a',
        'on-surface-variant': '#424752',
        'inverse-surface': '#2e3132',
        'on-secondary-container': '#007327',
        'surface-container': '#edeeef',
        'on-error-container': '#93000a',
        'on-primary-fixed': '#001a40',
        'on-tertiary': '#ffffff',
        'on-surface': '#191c1d',
        'outline': '#727784',
        
        // Legacy fallback mappings
        card: '#ffffff',
        border: '#c2c6d4',
        foreground: '#191c1d',
        muted: '#424752',
        success: '#006e25',
        warning: '#f59e0b',
        danger: '#ba1a1a'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      spacing: {
        'container-padding-mobile': '16px',
        base: '8px',
        'margin-lg': '24px',
        gutter: '16px',
        'margin-sm': '8px',
        'container-padding-desktop': '24px',
        'margin-md': '16px',
        'max-width': '1440px'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'headline-lg-mobile': ['Inter'],
        'body-md': ['Inter'],
        'headline-lg': ['Inter'],
        'label-sm': ['Inter'],
        'label-lg': ['Inter'],
        'body-lg': ['Inter'],
        'display-lg': ['Inter'],
        'title-lg': ['Inter']
      }
    }
  },
  plugins: []
};

