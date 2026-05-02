import { useTheme } from '../../hooks/useTheme';
import type { ThemeId } from '../../utils/theme';

export default function ThemeSwitcher() {
  const { theme, setTheme, themeOptions } = useTheme();
  const activeTheme = themeOptions.find((themeOption) => themeOption.id === theme);

  return (
    <label className="theme-switcher" title={activeTheme?.description}>
      <span>Theme</span>
      <select
        value={theme}
        aria-label="Theme"
        onChange={(event) => setTheme(event.target.value as ThemeId)}
      >
        {themeOptions.map((themeOption) => (
          <option key={themeOption.id} value={themeOption.id}>
            {themeOption.label}
          </option>
        ))}
      </select>
    </label>
  );
}
