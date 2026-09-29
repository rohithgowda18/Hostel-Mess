import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'hostel-mess-theme-preference';

export function ThemeProvider({ children }) {
  // themeMode can be 'light', 'dark', or 'system'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  });

  const [effectiveTheme, setEffectiveTheme] = useState('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const computeTheme = (mode) => {
      if (mode === 'system') {
        return mediaQuery.matches ? 'dark' : 'light';
      }
      return mode;
    };

    const applyTheme = (currentMode) => {
      const active = computeTheme(currentMode);
      setEffectiveTheme(active);
      const root = document.documentElement;
      const isDark = active === 'dark';
      if (isDark) {
        root.classList.add('dark');
        document.body.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    };

    applyTheme(themeMode);
    localStorage.setItem(STORAGE_KEY, themeMode);

    const handleSystemChange = () => {
      if (themeMode === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      effectiveTheme,
      setThemeMode,
      setTheme: (newMode) => setThemeMode(newMode),
      toggleTheme: () => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }),
    [themeMode, effectiveTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
