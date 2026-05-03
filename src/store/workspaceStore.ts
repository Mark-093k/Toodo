import { useSyncExternalStore } from 'react';
import type { AppMeta, ProjectExclusionPeriod, Task, TaskDailyMemo, YearlyWorkspaceData } from '../types';
import { getChildTaskIds } from '../utils/taskTree';
import {
  APP_SCHEMA_VERSION,
  createEmptyYearData,
  createYear,
  exportAllYears,
  exportYear,
  backupYearData,
  getStorageInfo,
  importAllYears,
  importYear,
  LEFT_PANEL_WIDTH_STORAGE_KEY,
  listYears,
  loadMeta,
  loadYearData,
  migrateLegacyDataIfNeeded,
  openDataDir,
  saveMeta,
  saveYearData,
} from '../storage/appStorage';
import { THEME_STORAGE_KEY } from '../utils/theme';

const AUTO_SAVE_DELAY = 450;

type WorkspaceSnapshot = {
  isReady: boolean;
  isYearLoading: boolean;
  isSaving: boolean;
  error: string | null;
  meta: AppMeta;
  data: YearlyWorkspaceData;
};

const createId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getCurrentYear = () => new Date().getFullYear();

const createInitialMeta = (): AppMeta => {
  const year = getCurrentYear();
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    activeYear: year,
    years: [year],
    updatedAt: new Date().toISOString(),
  };
};

const sortYears = (years: Iterable<number>) => [...new Set(years)].sort((a, b) => a - b);

const cloneYearData = (data: YearlyWorkspaceData): YearlyWorkspaceData => ({
  ...data,
  tasks: data.tasks.map((task) => ({ ...task })),
  taskDailyMemos: data.taskDailyMemos.map((memo) => ({ ...memo })),
  projectExclusions: (data.projectExclusions ?? []).map((exclusion) => ({ ...exclusion })),
});

let snapshot: WorkspaceSnapshot = {
  isReady: false,
  isYearLoading: false,
  isSaving: false,
  error: null,
  meta: createInitialMeta(),
  data: createEmptyYearData(getCurrentYear()),
};

const listeners = new Set<() => void>();
let initializePromise: Promise<void> | null = null;
let saveTimer: ReturnType<typeof window.setTimeout> | null = null;
let savePromise: Promise<void> | null = null;

const emit = () => {
  for (const listener of listeners) {
    listener();
  }
};

const setSnapshot = (nextSnapshot: WorkspaceSnapshot) => {
  snapshot = nextSnapshot;
  emit();
};

const getMetaWithUiPrefs = (meta: AppMeta): AppMeta => {
  const theme = window.localStorage.getItem(THEME_STORAGE_KEY) ?? meta.theme;
  const leftPanelWidth = Number(window.localStorage.getItem(LEFT_PANEL_WIDTH_STORAGE_KEY));

  return {
    ...meta,
    theme,
    leftPanelWidth: Number.isFinite(leftPanelWidth) ? leftPanelWidth : meta.leftPanelWidth,
    years: sortYears(meta.years),
    updatedAt: new Date().toISOString(),
  };
};

const persistSnapshot = async () => {
  if (!snapshot.isReady) {
    return;
  }

  const data = cloneYearData(snapshot.data);
  const meta = getMetaWithUiPrefs(snapshot.meta);
  setSnapshot({ ...snapshot, isSaving: true });

  try {
    await saveYearData(data.year, data);
    await saveMeta(meta);
    setSnapshot({ ...snapshot, isSaving: false, meta, error: null });
  } catch (error) {
    setSnapshot({
      ...snapshot,
      isSaving: false,
      error: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.',
    });
  }
};

const scheduleSave = () => {
  if (saveTimer) {
    window.clearTimeout(saveTimer);
  }

  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    savePromise = persistSnapshot();
  }, AUTO_SAVE_DELAY);
};

const flushPendingSave = async () => {
  if (saveTimer) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
    await persistSnapshot();
    return;
  }

  if (savePromise) {
    await savePromise;
  }
};

const setYearData = (updater: (data: YearlyWorkspaceData) => YearlyWorkspaceData) => {
  const nextData = {
    ...updater(cloneYearData(snapshot.data)),
    updatedAt: new Date().toISOString(),
  };
  setSnapshot({ ...snapshot, data: nextData, error: null });
  scheduleSave();
};

const getNextOrder = (tasks: Task[], parentId: string | null) => {
  const siblings = tasks.filter((task) => (task.parentId ?? null) === parentId);
  return siblings.reduce((maxOrder, task) => Math.max(maxOrder, task.order), 0) + 1;
};

const sortMemos = (memos: TaskDailyMemo[]) =>
  [...memos].sort(
    (a, b) =>
      a.taskId.localeCompare(b.taskId) || a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  );

const sortProjectExclusions = (exclusions: ProjectExclusionPeriod[]) =>
  [...exclusions].sort(
    (a, b) =>
      a.projectId.localeCompare(b.projectId) ||
      a.startDate.localeCompare(b.startDate) ||
      a.endDate.localeCompare(b.endDate) ||
      a.title.localeCompare(b.title),
  );

const loadYearIntoSnapshot = async (meta: AppMeta, year: number) => {
  const data = (await loadYearData(year)) ?? createEmptyYearData(year);
  const years = sortYears([...meta.years, year]);
  const nextMeta = { ...meta, activeYear: year, years, updatedAt: new Date().toISOString() };

  if (!meta.years.includes(year)) {
    await saveYearData(year, data);
  }

  await saveMeta(nextMeta);
  setSnapshot({
    isReady: true,
    isYearLoading: false,
    isSaving: false,
    error: null,
    meta: nextMeta,
    data,
  });
};

export const workspaceStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot() {
    return snapshot;
  },

  async initialize() {
    if (initializePromise) {
      return initializePromise;
    }

    initializePromise = (async () => {
      try {
        const meta = await migrateLegacyDataIfNeeded();
        const years = await listYears();
        const activeYear = years.includes(meta.activeYear) ? meta.activeYear : (years[years.length - 1] ?? meta.activeYear);
        await loadYearIntoSnapshot({ ...meta, activeYear, years }, activeYear);
      } catch (error) {
        setSnapshot({
          ...snapshot,
          isReady: true,
          isYearLoading: false,
          error: error instanceof Error ? error.message : '워크스페이스를 불러오지 못했습니다.',
        });
      }
    })();

    return initializePromise;
  },

  async switchYear(year: number) {
    if (!Number.isInteger(year)) {
      return;
    }

    await flushPendingSave();
    setSnapshot({ ...snapshot, isYearLoading: true });
    const meta = await loadMeta();
    await loadYearIntoSnapshot(meta, year);
  },

  async createYear(year: number) {
    if (!Number.isInteger(year)) {
      throw new Error('연도는 숫자로 입력해야 합니다.');
    }

    await flushPendingSave();
    const meta = await createYear(year);
    await loadYearIntoSnapshot(meta, year);
  },

  async exportCurrentYear() {
    await flushPendingSave();
    return exportYear(snapshot.meta.activeYear);
  },

  async exportAllYears() {
    await flushPendingSave();
    return exportAllYears();
  },

  async saveNow() {
    await flushPendingSave();
  },

  async getStorageInfo() {
    return getStorageInfo();
  },

  async openDataDir() {
    return openDataDir();
  },

  async backupCurrentYear() {
    await flushPendingSave();
    return backupYearData(snapshot.meta.activeYear);
  },

  async importYear(json: string) {
    await flushPendingSave();
    const meta = await importYear(json);
    await loadYearIntoSnapshot(meta, meta.activeYear);
  },

  async importAllYears(json: string) {
    await flushPendingSave();
    const meta = await importAllYears(json);
    await loadYearIntoSnapshot(meta, meta.activeYear);
  },

  addTask(parentId: string | null = null) {
    const id = createId('task');

    setYearData((data) => {
      const nextTask: Task = {
        id,
        parentId,
        title: '새 Task',
        owner: '',
        status: '예정',
        priority: '보통',
        startDate: '',
        dueDate: '',
        note: '',
        checked: false,
        collapsed: false,
        order: getNextOrder(data.tasks, parentId),
        scheduleCertainty: 'fixed',
      };

      return {
        ...data,
        tasks: data.tasks.map((task) => (task.id === parentId ? { ...task, collapsed: false } : task)).concat(nextTask),
      };
    });

    return id;
  },

  updateTask(id: string, patch: Partial<Omit<Task, 'id'>>) {
    setYearData((data) => ({
      ...data,
      tasks: data.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    }));
  },

  deleteTask(id: string) {
    setYearData((data) => {
      const childIds = getChildTaskIds(data.tasks, id);
      const deletedTaskIds = new Set([id, ...childIds]);
      return {
        ...data,
        tasks: data.tasks.filter((task) => !deletedTaskIds.has(task.id)),
        taskDailyMemos: data.taskDailyMemos.filter((memo) => !deletedTaskIds.has(memo.taskId)),
        projectExclusions: data.projectExclusions.filter((exclusion) => !deletedTaskIds.has(exclusion.projectId)),
      };
    });
  },

  toggleChecked(id: string) {
    setYearData((data) => ({
      ...data,
      tasks: data.tasks.map((task) => (task.id === id ? { ...task, checked: !task.checked } : task)),
    }));
  },

  toggleCollapsed(id: string) {
    setYearData((data) => ({
      ...data,
      tasks: data.tasks.map((task) => (task.id === id ? { ...task, collapsed: !task.collapsed } : task)),
    }));
  },

  upsertMemo(taskId: string, date: string, content: string) {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return null;
    }

    const now = new Date().toISOString();
    const existingMemo = snapshot.data.taskDailyMemos.find((memo) => memo.taskId === taskId && memo.date === date);
    const memoId = existingMemo?.id ?? createId('memo');

    setYearData((data) => ({
      ...data,
      taskDailyMemos: sortMemos(
        existingMemo
          ? data.taskDailyMemos.map((memo) =>
              memo.id === existingMemo.id ? { ...memo, content: trimmedContent, updatedAt: now } : memo,
            )
          : data.taskDailyMemos.concat({
              id: memoId,
              taskId,
              date,
              content: trimmedContent,
              createdAt: now,
              updatedAt: now,
            }),
      ),
    }));

    return memoId;
  },

  deleteMemo(id: string) {
    setYearData((data) => ({
      ...data,
      taskDailyMemos: data.taskDailyMemos.filter((memo) => memo.id !== id),
    }));
  },

  deleteMemoForTaskDate(taskId: string, date: string) {
    setYearData((data) => ({
      ...data,
      taskDailyMemos: data.taskDailyMemos.filter((memo) => !(memo.taskId === taskId && memo.date === date)),
    }));
  },

  deleteMemosForTaskIds(taskIds: Iterable<string>) {
    const taskIdSet = new Set(taskIds);
    if (taskIdSet.size === 0) {
      return;
    }

    setYearData((data) => ({
      ...data,
      taskDailyMemos: data.taskDailyMemos.filter((memo) => !taskIdSet.has(memo.taskId)),
    }));
  },

  replaceProjectExclusions(projectId: string, exclusions: ProjectExclusionPeriod[]) {
    const now = new Date().toISOString();
    const normalizedExclusions = exclusions
      .filter((exclusion) => exclusion.projectId === projectId && exclusion.startDate && exclusion.endDate)
      .map((exclusion) => ({
        ...exclusion,
        title: exclusion.title.trim(),
        note: exclusion.note ?? '',
        color: exclusion.color ?? 'yellow',
        createdAt: exclusion.createdAt || now,
        updatedAt: now,
      }));

    setYearData((data) => ({
      ...data,
      projectExclusions: sortProjectExclusions(
        data.projectExclusions
          .filter((exclusion) => exclusion.projectId !== projectId)
          .concat(normalizedExclusions),
      ),
    }));
  },

  deleteProjectExclusionsForProject(projectId: string) {
    setYearData((data) => ({
      ...data,
      projectExclusions: data.projectExclusions.filter((exclusion) => exclusion.projectId !== projectId),
    }));
  },
};

export const useWorkspaceSnapshot = () =>
  useSyncExternalStore(workspaceStore.subscribe, workspaceStore.getSnapshot, workspaceStore.getSnapshot);

export const useWorkspaceMeta = () => useWorkspaceSnapshot().meta;

export const useWorkspaceStatus = () => {
  const currentSnapshot = useWorkspaceSnapshot();
  return {
    isReady: currentSnapshot.isReady,
    isYearLoading: currentSnapshot.isYearLoading,
    isSaving: currentSnapshot.isSaving,
    error: currentSnapshot.error,
  };
};

export const useCurrentYear = () => useWorkspaceSnapshot().meta.activeYear;

export const useCurrentYearData = () => useWorkspaceSnapshot().data;

export const useProjectExclusions = () => useWorkspaceSnapshot().data.projectExclusions;
