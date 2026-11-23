import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage } from '../lib/utils';

const KEY = 'collabdocs.theme';
const ThemeContext = createContext(null);

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => readStorage(KEY, 'system'));
  const [systemDark, setSystemDark] = useState(() => media().matches);

  useEffect(() => {
    const mq = media();
    const onChange = (event) => setSystemDark(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0c0b14' : '#f5f4fa');
  }, [theme]);

  useEffect(() => writeStorage(KEY, preference), [preference]);

  const toggle = useCallback(() => setPreference(theme === 'dark' ? 'light' : 'dark'), [theme]);

  const value = useMemo(() => ({ theme, preference, setPreference, toggle }), [theme, preference, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
