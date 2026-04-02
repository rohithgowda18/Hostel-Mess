/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        card: 'var(--card)',
        border: 'var(--border)',
        foreground: 'var(--text-primary)',
        muted: 'var(--text-secondary)',
        primary: '#6366F1',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444'
      },
      borderRadius: {
        xl: '0.75rem'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(2, 6, 23, 0.35)',
        card: '0 8px 24px rgba(2, 6, 23, 0.25)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
