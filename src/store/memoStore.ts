import { useMemo, useSyncExternalStore } from 'react';
import type { TaskDailyMemo } from '../types';
import { workspaceStore } from './workspaceStore';

const getMemoKey = (taskId: string, date: string) => `${taskId}::${date}`;

export const memoStore = {
  subscribe: workspaceStore.subscribe,

  getSnapshot() {
    return workspaceStore.getSnapshot().data.taskDailyMemos;
  },

  upsertMemo(taskId: string, date: string, content: string) {
    return workspaceStore.upsertMemo(taskId, date, content);
  },

  deleteMemo(id: string) {
    workspaceStore.deleteMemo(id);
  },

  deleteMemoForTaskDate(taskId: string, date: string) {
    workspaceStore.deleteMemoForTaskDate(taskId, date);
  },

  deleteMemosForTaskIds(taskIds: Iterable<string>) {
    workspaceStore.deleteMemosForTaskIds(taskIds);
  },
};

export const buildTaskDailyMemoKey = getMemoKey;

export const useTaskDailyMemos = () =>
  useSyncExternalStore(memoStore.subscribe, memoStore.getSnapshot, memoStore.getSnapshot);

export const useTaskDailyMemoMap = () => {
  const memos = useTaskDailyMemos();

  return useMemo(() => {
    const memoMap = new Map<string, TaskDailyMemo>();
    for (const memo of memos) {
      memoMap.set(getMemoKey(memo.taskId, memo.date), memo);
    }
    return memoMap;
  }, [memos]);
};
