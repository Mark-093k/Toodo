import type { ProjectExclusionPeriod, ProjectExclusionReasonType, Task } from '../types';

export const projectExclusionReasonLabels: Record<ProjectExclusionReasonType, string> = {
  holiday: '연휴',
  client: '고객사 일정',
  internal: '사내 일정',
  waiting: '대기기간',
  etc: '기타',
};

export const projectExclusionReasonOptions = Object.entries(projectExclusionReasonLabels).map(([value, label]) => ({
  value: value as ProjectExclusionReasonType,
  label,
}));

export const getProjectExclusions = (projectId: string, exclusions: ProjectExclusionPeriod[]) =>
  exclusions.filter((exclusion) => exclusion.projectId === projectId);

export const getProjectIdForTask = (task: Task, tasksById: Map<string, Task>): string => {
  let cursor: Task | undefined = task;
  const visited = new Set<string>();

  while (cursor?.parentId && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    const parent = tasksById.get(cursor.parentId);
    if (!parent) {
      break;
    }
    cursor = parent;
  }

  return cursor?.id ?? task.id;
};

export const isTaskInProjectGroup = (task: Task, projectId: string, tasksById: Map<string, Task>): boolean => {
  let cursor: Task | undefined = task;
  const visited = new Set<string>();

  while (cursor && !visited.has(cursor.id)) {
    if (cursor.id === projectId) {
      return true;
    }

    visited.add(cursor.id);
    cursor = cursor.parentId ? tasksById.get(cursor.parentId) : undefined;
  }

  return false;
};

export const getInheritedProjectExclusions = (
  task: Task,
  tasksById: Map<string, Task>,
  exclusions: ProjectExclusionPeriod[],
) => {
  const projectId = getProjectIdForTask(task, tasksById);
  return getProjectExclusions(projectId, exclusions);
};
