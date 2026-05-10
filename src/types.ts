export type TaskStatus = '예정' | '진행중' | '완료';

export type TaskPriority = '낮음' | '보통' | '높음';

export type ScheduleCertainty = 'fixed' | 'tentative';

export type TaskDropPosition = 'before' | 'inside' | 'after';

export type ProjectExclusionReasonType = 'holiday' | 'client' | 'internal' | 'waiting' | 'etc';

export type ProjectExclusionColor = 'yellow' | 'blue' | 'gray' | 'red';

export type Task = {
  id: string;
  parentId?: string | null;
  title: string;
  owner?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  note?: string;
  checked: boolean;
  collapsed?: boolean;
  order: number;
  scheduleCertainty?: ScheduleCertainty;
};

export type TaskEditableField =
  | 'title'
  | 'owner'
  | 'status'
  | 'priority'
  | 'startDate'
  | 'dueDate'
  | 'note';

export type ViewMode = 'table' | 'gantt';

export type TaskDailyMemo = {
  id: string;
  taskId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectExclusionPeriod = {
  id: string;
  projectId: string;
  startDate: string;
  endDate: string;
  reasonType: ProjectExclusionReasonType;
  title: string;
  note?: string;
  color?: ProjectExclusionColor;
  createdAt: string;
  updatedAt: string;
};

export type AppMeta = {
  schemaVersion: number;
  appVersion?: string;
  activeYear: number;
  years: number[];
  theme?: string;
  leftPanelWidth?: number;
  createdAt?: string;
  updatedAt: string;
};

export type YearlyWorkspaceData = {
  schemaVersion: number;
  year: number;
  tasks: Task[];
  taskDailyMemos: TaskDailyMemo[];
  projectExclusions: ProjectExclusionPeriod[];
  createdAt?: string;
  updatedAt: string;
};

export type AllYearsBackup = {
  schemaVersion: number;
  exportedAt: string;
  meta: AppMeta;
  yearlyWorkspaces: YearlyWorkspaceData[];
};
