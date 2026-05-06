import type { AppMeta, YearlyWorkspaceData } from '../types';

export type DesktopDataMigrationCandidate = {
  label: string;
  path: string;
  hasMeta: boolean;
  years: number[];
};

export type YearlyStorageDriver = {
  name: string;
  kind?: 'browser' | 'desktop';
  loadMeta: () => Promise<AppMeta | null>;
  saveMeta: (meta: AppMeta) => Promise<void>;
  listYears: () => Promise<number[]>;
  loadYearData: (year: number) => Promise<YearlyWorkspaceData | null>;
  saveYearData: (year: number, data: YearlyWorkspaceData) => Promise<void>;
  deleteYear: (year: number) => Promise<void>;
  getDataDirPath?: () => Promise<string>;
  openDataDir?: () => Promise<void>;
  backupYear?: (year: number) => Promise<string>;
  listDataMigrationCandidates?: () => Promise<DesktopDataMigrationCandidate[]>;
  migrateDataFromPath?: (sourcePath: string) => Promise<string>;
};
