import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, THEME_STORAGE_KEY, type ThemeId, themeOptions } from '../utils/theme';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    setTheme,
    themeOptions,
  };
};
