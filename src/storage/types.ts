import type { AppMeta, YearlyWorkspaceData } from '../types';

export type YearlyStorageDriver = {
  name: string;
  loadMeta: () => Promise<AppMeta | null>;
  saveMeta: (meta: AppMeta) => Promise<void>;
  listYears: () => Promise<number[]>;
  loadYearData: (year: number) => Promise<YearlyWorkspaceData | null>;
  saveYearData: (year: number, data: YearlyWorkspaceData) => Promise<void>;
  deleteYear: (year: number) => Promise<void>;
};
