import type { AppMeta, YearlyWorkspaceData } from '../types';
import type { YearlyStorageDriver } from './types';

const DB_NAME = 'toodo-db-v2';
const DB_VERSION = 1;
const META_STORE = 'meta';
const YEAR_STORE = 'yearlyWorkspaces';

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE);
      }
      if (!database.objectStoreNames.contains(YEAR_STORE)) {
        database.createObjectStore(YEAR_STORE, { keyPath: 'year' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB upgrade was blocked'));
  });

const withStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) => {
  const database = await openDatabase();

  try {
    const transaction = database.transaction(storeName, mode);
    const transactionComplete = new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    const result = await requestToPromise(action(transaction.objectStore(storeName)));
    await transactionComplete;
    return result;
  } finally {
    database.close();
  }
};

export const indexedDbStorage: YearlyStorageDriver = {
  name: 'indexedDB',
  kind: 'browser',

  async loadMeta() {
    return withStore<AppMeta | undefined>(META_STORE, 'readonly', (store) => store.get('meta')).then(
      (meta) => meta ?? null,
    );
  },

  async saveMeta(meta: AppMeta) {
    await withStore<IDBValidKey>(META_STORE, 'readwrite', (store) => store.put(meta, 'meta'));
  },

  async listYears() {
    return withStore<YearlyWorkspaceData[]>(YEAR_STORE, 'readonly', (store) => store.getAll()).then((records) =>
      records.map((record) => record.year).sort((a, b) => a - b),
    );
  },

  async loadYearData(year: number) {
    return withStore<YearlyWorkspaceData | undefined>(YEAR_STORE, 'readonly', (store) => store.get(year)).then(
      (data) => data ?? null,
    );
  },

  async saveYearData(_year: number, data: YearlyWorkspaceData) {
    await withStore<IDBValidKey>(YEAR_STORE, 'readwrite', (store) => store.put(data));
  },

  async deleteYear(year: number) {
    await withStore<undefined>(YEAR_STORE, 'readwrite', (store) => store.delete(year));
  },
};
