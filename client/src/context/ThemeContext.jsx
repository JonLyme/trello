import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'trello-w-theme-mode';

const timeBasedTheme = () => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
};

const resolveTheme = (mode) => (mode === 'auto' ? timeBasedTheme() : mode);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
    const legacy = localStorage.getItem('flowboard-theme');
    if (legacy === 'light' || legacy === 'dark') return legacy;
    return 'auto';
  });
  const [theme, setThemeState] = useState(() => resolveTheme(mode));

  useEffect(() => {
    const apply = () => setThemeState(resolveTheme(mode));
    apply();
    if (mode !== 'auto') return undefined;
    const timer = window.setInterval(apply, 60_000);
    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(STORAGE_KEY, mode);
    localStorage.setItem('flowboard-theme', theme);
  }, [mode, theme]);

  const setMode = useCallback((nextMode) => {
    if (nextMode === 'light' || nextMode === 'dark' || nextMode === 'auto') setModeState(nextMode);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    if (nextTheme === 'light' || nextTheme === 'dark') setModeState(nextTheme);
  }, []);

  const setTimeBasedTheme = useCallback(() => setModeState('auto'), []);
  const toggleTheme = useCallback(() => {
    setModeState((currentMode) => {
      const currentTheme = resolveTheme(currentMode);
      return currentTheme === 'dark' ? 'light' : 'dark';
    });
  }, []);

  const value = useMemo(() => ({
    theme,
    mode,
    setMode,
    setTheme,
    setTimeBasedTheme,
    toggleTheme,
  }), [mode, setMode, setTheme, setTimeBasedTheme, theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
