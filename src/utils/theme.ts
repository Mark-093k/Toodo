export type ThemeId =
  | 'dark-professional'
  | 'light-professional'
  | 'midnight-blue'
  | 'coffeehouse-green'
  | 'coffeehouse-night';

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
  {
    id: 'coffeehouse-green',
    label: 'Coffeehouse Green',
    description: '따뜻한 크림 캔버스와 깊은 그린 포인트의 리테일 플래그십 테마',
  },
  {
    id: 'coffeehouse-night',
    label: 'Coffeehouse Night',
    description: '딥 그린 표면과 크림 텍스트, 골드 포인트를 쓰는 커피하우스 다크 테마',
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
