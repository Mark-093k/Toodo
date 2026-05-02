import { useSyncExternalStore } from 'react';
import type { Task } from '../types';
import { workspaceStore } from './workspaceStore';

export const taskStore = {
  subscribe: workspaceStore.subscribe,

  getSnapshot() {
    return workspaceStore.getSnapshot().data.tasks;
  },

  addTask(parentId: string | null = null) {
    return workspaceStore.addTask(parentId);
  },

  updateTask(id: string, patch: Partial<Omit<Task, 'id'>>) {
    workspaceStore.updateTask(id, patch);
  },

  deleteTask(id: string) {
    workspaceStore.deleteTask(id);
  },

  toggleChecked(id: string) {
    workspaceStore.toggleChecked(id);
  },

  toggleCollapsed(id: string) {
    workspaceStore.toggleCollapsed(id);
  },
};

export const useTasks = () =>
  useSyncExternalStore(taskStore.subscribe, taskStore.getSnapshot, taskStore.getSnapshot);
