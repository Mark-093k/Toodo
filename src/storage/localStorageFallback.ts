import type { AppMeta, YearlyWorkspaceData } from '../types';
import type { YearlyStorageDriver } from './types';

export const META_STORAGE_KEY = 'toodo:v2:meta';
export const getYearStorageKey = (year: number) => `toodo:v2:year:${year}`;

const parseJson = <T>(raw: string | null): T | null => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const localStorageFallback: YearlyStorageDriver = {
  name: 'localStorage',
  kind: 'browser',

  async loadMeta() {
    return parseJson<AppMeta>(window.localStorage.getItem(META_STORAGE_KEY));
  },

  async saveMeta(meta: AppMeta) {
    window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  },

  async listYears() {
    const years = new Set<number>();
    const meta = parseJson<AppMeta>(window.localStorage.getItem(META_STORAGE_KEY));
    for (const year of meta?.years ?? []) {
      years.add(year);
    }

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      const match = key?.match(/^toodo:v2:year:(\d{4})$/);
      if (match) {
        years.add(Number(match[1]));
      }
    }

    return [...years].sort((a, b) => a - b);
  },

  async loadYearData(year: number) {
    return parseJson<YearlyWorkspaceData>(window.localStorage.getItem(getYearStorageKey(year)));
  },

  async saveYearData(year: number, data: YearlyWorkspaceData) {
    window.localStorage.setItem(getYearStorageKey(year), JSON.stringify(data));
  },

  async deleteYear(year: number) {
    window.localStorage.removeItem(getYearStorageKey(year));
  },
};
