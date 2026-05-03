import type { AppMeta, YearlyWorkspaceData } from '../types';
import type { YearlyStorageDriver } from './types';

type TauriCore = {
  invoke: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
};

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export const isDesktopRuntime = () => typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);

const getTauriCore = async (): Promise<TauriCore> => import('@tauri-apps/api/core');

export const desktopFileStorage: YearlyStorageDriver = {
  name: 'desktop-file',
  kind: 'desktop',

  async loadMeta() {
    const { invoke } = await getTauriCore();
    return invoke<AppMeta | null>('load_meta');
  },

  async saveMeta(meta: AppMeta) {
    const { invoke } = await getTauriCore();
    await invoke('save_meta', { meta });
  },

  async listYears() {
    const { invoke } = await getTauriCore();
    return invoke<number[]>('list_years');
  },

  async loadYearData(year: number) {
    const { invoke } = await getTauriCore();
    return invoke<YearlyWorkspaceData | null>('load_year_data', { year });
  },

  async saveYearData(year: number, data: YearlyWorkspaceData) {
    const { invoke } = await getTauriCore();
    await invoke('save_year_data', { year, data });
  },

  async deleteYear(year: number) {
    const { invoke } = await getTauriCore();
    await invoke('delete_year_data', { year });
  },

  async getDataDirPath() {
    const { invoke } = await getTauriCore();
    return invoke<string>('get_data_dir_path');
  },

  async openDataDir() {
    const { invoke } = await getTauriCore();
    await invoke('open_data_dir');
  },

  async backupYear(year: number) {
    const { invoke } = await getTauriCore();
    return invoke<string>('backup_year_data', { year });
  },
};
