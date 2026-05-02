import type { Task } from '../types';

export type TaskRowModel = {
  task: Task;
  depth: number;
  hasChildren: boolean;
};

export const getChildTaskIds = (tasks: Task[], parentId: string): Set<string> => {
  const ids = new Set<string>();
  let changed = true;

  while (changed) {
    changed = false;
    for (const task of tasks) {
      const belongsToParent = task.parentId === parentId;
      const belongsToKnownChild = task.parentId ? ids.has(task.parentId) : false;

      if ((belongsToParent || belongsToKnownChild) && !ids.has(task.id)) {
        ids.add(task.id);
        changed = true;
      }
    }
  }

  return ids;
};

export const buildTaskRows = (tasks: Task[], includeCollapsedChildren = false): TaskRowModel[] => {
  const rows: TaskRowModel[] = [];
  const childrenByParent = new Map<string, Task[]>();
  const rootTasks: Task[] = [];

  for (const task of tasks) {
    if (task.parentId) {
      const siblings = childrenByParent.get(task.parentId) ?? [];
      siblings.push(task);
      childrenByParent.set(task.parentId, siblings);
    } else {
      rootTasks.push(task);
    }
  }

  const sortByOrder = (a: Task, b: Task) => a.order - b.order || a.title.localeCompare(b.title);
  rootTasks.sort(sortByOrder);
  childrenByParent.forEach((children) => children.sort(sortByOrder));

  const visit = (task: Task, depth: number) => {
    const children = childrenByParent.get(task.id) ?? [];
    rows.push({ task, depth, hasChildren: children.length > 0 });

    if (!task.collapsed || includeCollapsedChildren) {
      for (const child of children) {
        visit(child, depth + 1);
      }
    }
  };

  for (const task of rootTasks) {
    visit(task, 0);
  }

  return rows;
};
