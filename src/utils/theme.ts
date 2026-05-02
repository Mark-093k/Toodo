export type ThemeId = 'dark-professional' | 'light-professional' | 'midnight-blue';

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
};

export const THEME_STORAGE_KEY = 'toodo:theme';

export const themeOptions: ThemeOption[] = [
  {
    id: 'dark-professional',
    label: 'Dark Professional',
    description: '차분한 슬레이트 기반의 기본 업무용 다크 테마',
  },
  {
    id: 'light-professional',
    label: 'Light Professional',
    description: '밝은 B2B SaaS 스타일의 라이트 테마',
  },
  {
    id: 'midnight-blue',
    label: 'Midnight Blue',
    description: '깊은 네이비 표면과 시안 포인트의 프리미엄 테마',
  },
];

const themeIds = new Set<ThemeId>(themeOptions.map((theme) => theme.id));

export const DEFAULT_THEME: ThemeId = 'dark-professional';

export const isThemeId = (value: string | null): value is ThemeId => {
  return !!value && themeIds.has(value as ThemeId);
};

export const getStoredTheme = (): ThemeId => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeId(storedTheme) ? storedTheme : DEFAULT_THEME;
};

export const applyTheme = (theme: ThemeId) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = theme;
};
