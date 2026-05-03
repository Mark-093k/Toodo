import type {
  AllYearsBackup,
  AppMeta,
  ProjectExclusionPeriod,
  ProjectExclusionReasonType,
  Task,
  TaskDailyMemo,
  YearlyWorkspaceData,
} from '../types';
import { THEME_STORAGE_KEY } from '../utils/theme';
import { desktopFileStorage, isDesktopRuntime } from './desktopFileStorage';
import { indexedDbStorage } from './indexedDbStorage';
import { getYearStorageKey, localStorageFallback, META_STORAGE_KEY } from './localStorageFallback';
import type { YearlyStorageDriver } from './types';

export const APP_VERSION = '0.2.4';
export const APP_SCHEMA_VERSION = 4;
export const YEARLY_SCHEMA_VERSION = 4;
export const LEGACY_TASK_STORAGE_KEY = 'toodo.tasks.v1';
export const LEGACY_TASK_DAILY_MEMO_STORAGE_KEY = 'gantt:taskDailyMemos';
export const LEFT_PANEL_WIDTH_STORAGE_KEY = 'gantt:leftPanelWidth';

let driverPromise: Promise<YearlyStorageDriver> | null = null;

const getCurrentYear = () => new Date().getFullYear();

const cloneTasks = (tasks: Task[]) => tasks.map((task) => normalizeTask(task)).filter((task): task is Task => task !== null);

const sortYears = (years: Iterable<number>) =>
  [...new Set([...years].filter((year) => Number.isInteger(year)))].sort((a, b) => a - b);

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

const getYearFromIsoDate = (value?: string) => {
  if (!value) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  return Number.isInteger(year) && year >= 1900 && year <= 2999 ? year : null;
};

const getTaskWorkspaceYear = (task: Task) => getYearFromIsoDate(task.startDate) ?? getYearFromIsoDate(task.dueDate) ?? getCurrentYear();

const statusValues: Task['status'][] = ['예정', '진행중', '완료'];
const priorityValues: Task['priority'][] = ['낮음', '보통', '높음'];
const scheduleCertaintyValues: NonNullable<Task['scheduleCertainty']>[] = ['fixed', 'tentative'];
const exclusionReasonValues: ProjectExclusionReasonType[] = ['holiday', 'client', 'internal', 'waiting', 'etc'];
const exclusionColorValues: NonNullable<ProjectExclusionPeriod['color']>[] = ['yellow', 'blue', 'gray', 'red'];

const normalizeTask = (value: unknown): Task | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const task = value as Partial<Task>;
  const hasRequiredShape =
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.checked === 'boolean' &&
    typeof task.order === 'number';

  if (!hasRequiredShape) {
    return null;
  }

  const id = task.id as string;
  const title = task.title as string;
  const checked = task.checked as boolean;
  const order = task.order as number;

  return {
    ...task,
    id,
    parentId: task.parentId ?? null,
    title,
    owner: task.owner ?? '',
    status: statusValues.includes(task.status as Task['status']) ? (task.status as Task['status']) : '예정',
    priority: priorityValues.includes(task.priority as Task['priority']) ? (task.priority as Task['priority']) : '보통',
    startDate: task.startDate ?? '',
    dueDate: task.dueDate ?? '',
    note: task.note ?? '',
    checked,
    collapsed: task.collapsed ?? false,
    order,
    scheduleCertainty: scheduleCertaintyValues.includes(task.scheduleCertainty as NonNullable<Task['scheduleCertainty']>)
      ? (task.scheduleCertainty as NonNullable<Task['scheduleCertainty']>)
      : 'fixed',
  };
};

const isTask = (value: unknown): value is Task => normalizeTask(value) !== null;

const isTaskDailyMemo = (value: unknown): value is TaskDailyMemo => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const memo = value as Partial<TaskDailyMemo>;
  return (
    typeof memo.id === 'string' &&
    typeof memo.taskId === 'string' &&
    typeof memo.date === 'string' &&
    typeof memo.content === 'string' &&
    typeof memo.createdAt === 'string' &&
    typeof memo.updatedAt === 'string'
  );
};

const normalizeProjectExclusion = (value: unknown): ProjectExclusionPeriod | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const exclusion = value as Partial<ProjectExclusionPeriod>;
  if (
    typeof exclusion.id !== 'string' ||
    typeof exclusion.projectId !== 'string' ||
    typeof exclusion.startDate !== 'string' ||
    typeof exclusion.endDate !== 'string'
  ) {
    return null;
  }

  const now = new Date().toISOString();
  const reasonType = exclusionReasonValues.includes(exclusion.reasonType as ProjectExclusionReasonType)
    ? (exclusion.reasonType as ProjectExclusionReasonType)
    : 'etc';

  return {
    id: exclusion.id,
    projectId: exclusion.projectId,
    startDate: exclusion.startDate,
    endDate: exclusion.endDate,
    reasonType,
    title: exclusion.title?.trim() || reasonType,
    note: exclusion.note ?? '',
    color: exclusionColorValues.includes(exclusion.color as NonNullable<ProjectExclusionPeriod['color']>)
      ? (exclusion.color as NonNullable<ProjectExclusionPeriod['color']>)
      : 'yellow',
    createdAt: exclusion.createdAt ?? now,
    updatedAt: exclusion.updatedAt ?? now,
  };
};

const normalizeYearlyWorkspaceData = (value: unknown): YearlyWorkspaceData | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const data = value as Partial<YearlyWorkspaceData>;
  if (
    typeof data.year !== 'number' ||
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.taskDailyMemos)
  ) {
    return null;
  }

  const tasks = data.tasks.map(normalizeTask).filter((task): task is Task => task !== null);
  const taskDailyMemos = data.taskDailyMemos.filter(isTaskDailyMemo).map((memo) => ({ ...memo }));
  const projectExclusions = Array.isArray(data.projectExclusions)
    ? data.projectExclusions
        .map(normalizeProjectExclusion)
        .filter((exclusion): exclusion is ProjectExclusionPeriod => exclusion !== null)
    : [];

  return {
    schemaVersion: YEARLY_SCHEMA_VERSION,
    year: data.year,
    tasks,
    taskDailyMemos,
    projectExclusions,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : data.updatedAt ?? new Date().toISOString(),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
  };
};

const isYearlyWorkspaceData = (value: unknown): value is YearlyWorkspaceData => normalizeYearlyWorkspaceData(value) !== null;

const isAppMeta = (value: unknown): value is AppMeta => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const meta = value as Partial<AppMeta>;
  return (
    typeof meta.activeYear === 'number' &&
    Array.isArray(meta.years) &&
    meta.years.every((year) => typeof year === 'number') &&
    typeof meta.updatedAt === 'string'
  );
};

const normalizeMeta = (value: unknown): AppMeta | null => {
  if (!isAppMeta(value)) {
    return null;
  }

  return {
    ...value,
    schemaVersion: APP_SCHEMA_VERSION,
    appVersion: value.appVersion ?? APP_VERSION,
    years: sortYears(value.years),
    createdAt: value.createdAt ?? value.updatedAt ?? new Date().toISOString(),
    updatedAt: value.updatedAt || new Date().toISOString(),
  };
};

const createMeta = (activeYear: number, years: number[]): AppMeta => {
  const theme = typeof window === 'undefined' ? undefined : window.localStorage.getItem(THEME_STORAGE_KEY) ?? undefined;
  const storedPanelWidth = typeof window === 'undefined' ? NaN : Number(window.localStorage.getItem(LEFT_PANEL_WIDTH_STORAGE_KEY));

  return {
    schemaVersion: APP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    activeYear,
    years: sortYears(years),
    theme,
    leftPanelWidth: Number.isFinite(storedPanelWidth) ? storedPanelWidth : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const createEmptyYearData = (year: number): YearlyWorkspaceData => ({
  schemaVersion: YEARLY_SCHEMA_VERSION,
  year,
  tasks: [],
  taskDailyMemos: [],
  projectExclusions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const createYearData = (
  year: number,
  tasks: Task[] = [],
  taskDailyMemos: TaskDailyMemo[] = [],
  projectExclusions: ProjectExclusionPeriod[] = [],
): YearlyWorkspaceData => ({
  schemaVersion: YEARLY_SCHEMA_VERSION,
  year,
  tasks: cloneTasks(tasks),
  taskDailyMemos: taskDailyMemos.map((memo) => ({ ...memo })),
  projectExclusions: projectExclusions
    .map(normalizeProjectExclusion)
    .filter((exclusion): exclusion is ProjectExclusionPeriod => exclusion !== null),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createInitialWorkspace = async (driver: YearlyStorageDriver) => {
  const activeYear = getCurrentYear();
  const data = createEmptyYearData(activeYear);
  const meta = createMeta(activeYear, [activeYear]);
  await driver.saveYearData(activeYear, data);
  await driver.saveMeta(meta);
  return meta;
};

const backupLegacyStorage = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = {
    backedUpAt: new Date().toISOString(),
    tasks: window.localStorage.getItem(LEGACY_TASK_STORAGE_KEY),
    taskDailyMemos: window.localStorage.getItem(LEGACY_TASK_DAILY_MEMO_STORAGE_KEY),
    theme: window.localStorage.getItem(THEME_STORAGE_KEY),
    leftPanelWidth: window.localStorage.getItem(LEFT_PANEL_WIDTH_STORAGE_KEY),
  };
  window.localStorage.setItem(`toodo:legacyBackup:${timestamp}`, JSON.stringify(backup));
};

const migrateLegacyData = async (driver: YearlyStorageDriver, legacyTasks: Task[], legacyMemos: TaskDailyMemo[]) => {
  backupLegacyStorage();

  const taskYearById = new Map<string, number>();
  const tasksByYear = new Map<number, Task[]>();
  const memosByYear = new Map<number, TaskDailyMemo[]>();

  for (const task of legacyTasks) {
    const year = getTaskWorkspaceYear(task);
    taskYearById.set(task.id, year);
    tasksByYear.set(year, [...(tasksByYear.get(year) ?? []), { ...task }]);
  }

  for (const memo of legacyMemos) {
    const year = taskYearById.get(memo.taskId) ?? getYearFromIsoDate(memo.date) ?? getCurrentYear();
    memosByYear.set(year, [...(memosByYear.get(year) ?? []), { ...memo }]);
  }

  const years = sortYears([...tasksByYear.keys(), ...memosByYear.keys()]);
  const fallbackYear = getCurrentYear();
  const targetYears = years.length > 0 ? years : [fallbackYear];

  for (const year of targetYears) {
    await driver.saveYearData(year, createYearData(year, tasksByYear.get(year) ?? [], memosByYear.get(year) ?? []));
  }

  const currentYear = getCurrentYear();
  const activeYear = targetYears.includes(currentYear) ? currentYear : Math.max(...targetYears);
  const meta = createMeta(activeYear, targetYears);
  await driver.saveMeta(meta);
  return meta;
};

const resolveDriver = async (): Promise<YearlyStorageDriver> => {
  if (isDesktopRuntime()) {
    await desktopFileStorage.getDataDirPath?.();
    return desktopFileStorage;
  }

  try {
    await indexedDbStorage.listYears();
    return indexedDbStorage;
  } catch {
    return localStorageFallback;
  }
};

export const getStorageDriver = () => {
  driverPromise ??= resolveDriver();
  return driverPromise;
};

export const migrateLegacyDataIfNeeded = async () => {
  const driver = await getStorageDriver();
  const existingMeta = await driver.loadMeta();
  const normalizedExistingMeta = normalizeMeta(existingMeta);
  if (normalizedExistingMeta) {
    if (existingMeta?.schemaVersion !== APP_SCHEMA_VERSION) {
      await driver.saveMeta(normalizedExistingMeta);
    }
    return normalizedExistingMeta;
  }

  const legacyTasks = parseJson<unknown>(window.localStorage.getItem(LEGACY_TASK_STORAGE_KEY));
  const legacyMemos = parseJson<unknown>(window.localStorage.getItem(LEGACY_TASK_DAILY_MEMO_STORAGE_KEY));
  const taskList = Array.isArray(legacyTasks)
    ? legacyTasks.map(normalizeTask).filter((task): task is Task => task !== null)
    : [];
  const memoList = Array.isArray(legacyMemos) ? legacyMemos.filter(isTaskDailyMemo) : [];

  if (taskList.length > 0 || memoList.length > 0) {
    return migrateLegacyData(driver, taskList, memoList);
  }

  const localV2Meta = normalizeMeta(parseJson<unknown>(window.localStorage.getItem(META_STORAGE_KEY)));
  if (localV2Meta) {
    for (const year of localV2Meta.years) {
      const data = normalizeYearlyWorkspaceData(parseJson<unknown>(window.localStorage.getItem(getYearStorageKey(year))));
      if (data) {
        await driver.saveYearData(year, data);
      }
    }
    await driver.saveMeta(localV2Meta);
    return localV2Meta;
  }

  return createInitialWorkspace(driver);
};

export const loadMeta = async () => {
  const driver = await getStorageDriver();
  const meta = await driver.loadMeta();
  const normalizedMeta = normalizeMeta(meta);
  return normalizedMeta ?? migrateLegacyDataIfNeeded();
};

export const saveMeta = async (meta: AppMeta) => {
  const driver = await getStorageDriver();
  await driver.saveMeta({
    ...meta,
    schemaVersion: APP_SCHEMA_VERSION,
    appVersion: meta.appVersion ?? APP_VERSION,
    years: sortYears(meta.years),
    createdAt: meta.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

export const listYears = async () => {
  const driver = await getStorageDriver();
  const meta = await loadMeta();
  const storedYears = await driver.listYears();
  return sortYears([...meta.years, ...storedYears]);
};

export const getActiveYear = async () => {
  const meta = await loadMeta();
  return meta.activeYear;
};

export const setActiveYear = async (year: number) => {
  const meta = await loadMeta();
  const nextMeta = { ...meta, activeYear: year, years: sortYears([...meta.years, year]), updatedAt: new Date().toISOString() };
  await saveMeta(nextMeta);
  return nextMeta;
};

export const createYear = async (year: number) => {
  const existing = await loadYearData(year);
  if (!existing) {
    await saveYearData(year, createEmptyYearData(year));
  }
  return setActiveYear(year);
};

export const loadYearData = async (year: number) => {
  const driver = await getStorageDriver();
  const data = await driver.loadYearData(year);
  return normalizeYearlyWorkspaceData(data);
};

export const saveYearData = async (year: number, data: YearlyWorkspaceData) => {
  const driver = await getStorageDriver();
  const normalizedData = normalizeYearlyWorkspaceData({ ...data, year });
  if (!normalizedData) {
    throw new Error('저장할 연도 데이터가 올바르지 않습니다.');
  }
  await driver.saveYearData(year, { ...normalizedData, updatedAt: new Date().toISOString() });
};

export const getStorageInfo = async () => {
  const driver = await getStorageDriver();
  return {
    name: driver.name,
    kind: driver.kind ?? 'browser',
    dataDirPath: driver.getDataDirPath ? await driver.getDataDirPath() : null,
  };
};

export const openDataDir = async () => {
  const driver = await getStorageDriver();
  if (!driver.openDataDir) {
    throw new Error('Desktop 데이터 폴더 열기는 설치형 앱에서만 사용할 수 있습니다.');
  }
  await driver.openDataDir();
};

export const backupYearData = async (year: number) => {
  const driver = await getStorageDriver();
  if (!driver.backupYear) {
    throw new Error('연도 백업 파일 생성은 설치형 앱에서만 사용할 수 있습니다.');
  }
  return driver.backupYear(year);
};

export const deleteYear = async (year: number) => {
  const driver = await getStorageDriver();
  const meta = await loadMeta();
  const remainingYears = meta.years.filter((storedYear) => storedYear !== year);
  await driver.deleteYear(year);
  const activeYear =
    remainingYears.includes(meta.activeYear) ? meta.activeYear : (remainingYears[remainingYears.length - 1] ?? getCurrentYear());
  const nextMeta = createMeta(activeYear, remainingYears.length > 0 ? remainingYears : [activeYear]);
  await driver.saveMeta(nextMeta);
  if (remainingYears.length === 0) {
    await driver.saveYearData(activeYear, createEmptyYearData(activeYear));
  }
  return nextMeta;
};

export const exportYear = async (year: number) => {
  const data = await loadYearData(year);
  return data ?? createEmptyYearData(year);
};

export const exportAllYears = async (): Promise<AllYearsBackup> => {
  const meta = await loadMeta();
  const years = await listYears();
  const yearlyWorkspaces = await Promise.all(years.map((year) => exportYear(year)));

  return {
    schemaVersion: APP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    meta: { ...meta, years },
    yearlyWorkspaces,
  };
};

export const importYear = async (json: string | YearlyWorkspaceData) => {
  const parsed = typeof json === 'string' ? parseJson<unknown>(json) : json;
  const normalizedData = normalizeYearlyWorkspaceData(parsed);
  if (!normalizedData) {
    throw new Error('올바른 연도 백업 파일이 아닙니다.');
  }

  const driver = await getStorageDriver();
  if (driver.backupYear && (await driver.loadYearData(normalizedData.year))) {
    await driver.backupYear(normalizedData.year).catch(() => undefined);
  }
  await saveYearData(normalizedData.year, normalizedData);
  return setActiveYear(normalizedData.year);
};

export const importAllYears = async (json: string | AllYearsBackup) => {
  const parsed = typeof json === 'string' ? parseJson<unknown>(json) : json;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('올바른 전체 백업 파일이 아닙니다.');
  }

  const backup = parsed as Partial<AllYearsBackup>;
  if (!backup.schemaVersion || backup.schemaVersion > APP_SCHEMA_VERSION || !Array.isArray(backup.yearlyWorkspaces)) {
    throw new Error('지원하지 않는 백업 schemaVersion입니다.');
  }

  const workspaces = backup.yearlyWorkspaces
    .map(normalizeYearlyWorkspaceData)
    .filter((workspace): workspace is YearlyWorkspaceData => workspace !== null);
  if (workspaces.length !== backup.yearlyWorkspaces.length) {
    throw new Error('백업 파일 안에 손상된 연도 데이터가 있습니다.');
  }

  const years = sortYears(workspaces.map((workspace) => workspace.year));
  if (years.length === 0) {
    throw new Error('가져올 연도 데이터가 없습니다.');
  }

  const driver = await getStorageDriver();
  const existingYears = await listYears();
  if (driver.backupYear) {
    await Promise.all(existingYears.map((existingYear) => driver.backupYear?.(existingYear).catch(() => undefined)));
  }
  for (const existingYear of existingYears) {
    if (!years.includes(existingYear)) {
      await driver.deleteYear(existingYear);
    }
  }

  for (const workspace of workspaces) {
    await saveYearData(workspace.year, workspace);
  }

  const requestedActiveYear = backup.meta?.activeYear;
  const activeYear =
    typeof requestedActiveYear === 'number' && years.includes(requestedActiveYear)
      ? requestedActiveYear
      : years[years.length - 1];
  const meta = createMeta(activeYear, years);
  await saveMeta(meta);
  return meta;
};
