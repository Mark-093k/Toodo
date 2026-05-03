import { useMemo, useState } from 'react';
import { isDesktopRuntime } from '../storage/desktopFileStorage';
import { taskStore, useTasks } from '../store/taskStore';
import { useCurrentYear, useProjectExclusions } from '../store/workspaceStore';
import type { Task, TaskEditableField } from '../types';
import { copyTextToClipboard, readTextFromClipboard } from '../utils/clipboard';
import { normalizeDateInput } from '../utils/dateInput';
import { getProjectExclusions } from '../utils/projectExclusions';
import { buildTaskRows } from '../utils/taskTree';
import ProjectExclusionModal from './ProjectExclusionModal';
import TaskRow from './TaskRow';

const editableFields: TaskEditableField[] = ['title', 'owner', 'status', 'priority', 'startDate', 'dueDate', 'note'];

type ActiveCell = {
  taskId: string;
  field: TaskEditableField;
} | null;

type DateEditableField = Extract<TaskEditableField, 'startDate' | 'dueDate'>;

type ClipboardNotice = {
  id: number;
  tone: 'success' | 'error' | 'info';
  message: string;
} | null;

const isDateField = (field: TaskEditableField): field is DateEditableField => field === 'startDate' || field === 'dueDate';

export default function MainTable() {
  const tasks = useTasks();
  const activeYear = useCurrentYear();
  const projectExclusions = useProjectExclusions();
  const rows = useMemo(() => buildTaskRows(tasks), [tasks]);
  const desktopDateClipboardEnabled = useMemo(() => isDesktopRuntime(), []);
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);
  const [selectedDateCell, setSelectedDateCell] = useState<ActiveCell>(null);
  const [clipboardNotice, setClipboardNotice] = useState<ClipboardNotice>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = useMemo(
    () => tasks.find((task) => task.id === selectedProjectId) ?? null,
    [selectedProjectId, tasks],
  );

  const showClipboardNotice = (message: string, tone: NonNullable<ClipboardNotice>['tone'] = 'info') => {
    const id = Date.now();
    setClipboardNotice({ id, tone, message });
    window.setTimeout(() => {
      setClipboardNotice((currentNotice) => (currentNotice?.id === id ? null : currentNotice));
    }, 1600);
  };

  const handleSetActiveCell = (cell: ActiveCell) => {
    setActiveCell(cell);
    if (!cell || !isDateField(cell.field)) {
      setSelectedDateCell(null);
    }
  };

  const handleAddTask = () => {
    const id = taskStore.addTask(null);
    handleSetActiveCell({ taskId: id, field: 'title' });
  };

  const handleAddChild = (parentId: string) => {
    const id = taskStore.addTask(parentId);
    handleSetActiveCell({ taskId: id, field: 'title' });
  };

  const handleNavigateCell = (taskId: string, field: TaskEditableField, direction: 1 | -1) => {
    const cellOrder = rows.flatMap((row) => editableFields.map((editableField) => `${row.task.id}:${editableField}`));
    const currentIndex = cellOrder.indexOf(`${taskId}:${field}`);
    const nextKey = cellOrder[currentIndex + direction];

    if (!nextKey) {
      handleSetActiveCell(null);
      return;
    }

    const [nextTaskId, nextField] = nextKey.split(':') as [string, TaskEditableField];
    handleSetActiveCell({ taskId: nextTaskId, field: nextField });
  };

  const handleDateClipboardShortcut: React.ComponentProps<typeof TaskRow>['onDateClipboardShortcut'] = ({
    event,
    task,
    field,
    value,
    setDraft,
  }) => {
    if (!desktopDateClipboardEnabled) {
      return;
    }

    const isModifierKey = event.ctrlKey || event.metaKey;
    if (!isModifierKey || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();
    if (!['a', 'c', 'v'].includes(key)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setSelectedDateCell({ taskId: task.id, field });

    if (key === 'a') {
      showClipboardNotice('Date selected', 'info');
      return;
    }

    if (key === 'c') {
      const currentDate = normalizeDateInput(value || task[field] || '', activeYear);
      if (!currentDate) {
        showClipboardNotice('No valid date to copy', 'error');
        return;
      }

      void copyTextToClipboard(currentDate)
        .then(() => showClipboardNotice('Date copied', 'success'))
        .catch(() => showClipboardNotice('Clipboard copy failed', 'error'));
      return;
    }

    void readTextFromClipboard()
      .then((clipboardText) => {
        const nextDate = normalizeDateInput(clipboardText, activeYear);
        if (!nextDate) {
          showClipboardNotice('Invalid date', 'error');
          return;
        }

        taskStore.updateTask(task.id, { [field]: nextDate });
        setDraft(nextDate);
        showClipboardNotice('Date pasted', 'success');
      })
      .catch(() => showClipboardNotice('Clipboard paste failed', 'error'));
  };

  return (
    <section className="workspace-panel">
      <div className="panel-toolbar">
        <div>
          <h2>Main Todo List</h2>
          <p>{tasks.length} tasks saved locally</p>
        </div>
        <button type="button" className="primary-button" onClick={handleAddTask}>
          + Task
        </button>
      </div>

      <div className="table-shell">
        <table className="task-table">
          <colgroup>
            <col className="col-check" />
            <col className="col-title" />
            <col className="col-owner" />
            <col className="col-status" />
            <col className="col-priority" />
            <col className="col-date" />
            <col className="col-date" />
            <col className="col-note" />
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th aria-label="체크박스" />
              <th>아이템명</th>
              <th>담당자</th>
              <th>상태</th>
              <th>우선순위</th>
              <th>시작일</th>
              <th>마감일</th>
              <th>비고</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ task, depth, hasChildren }) => {
              const isProject = depth === 0 || hasChildren;
              const projectExclusionCount = isProject ? getProjectExclusions(task.id, projectExclusions).length : 0;

              return (
              <TaskRow
                key={task.id}
                task={task}
                depth={depth}
                hasChildren={hasChildren}
                isProject={isProject}
                projectExclusionCount={projectExclusionCount}
                activeCell={activeCell}
                selectedDateCell={selectedDateCell}
                onSetActiveCell={handleSetActiveCell}
                onNavigateCell={handleNavigateCell}
                onUpdateTask={taskStore.updateTask}
                onToggleChecked={taskStore.toggleChecked}
                onToggleCollapsed={taskStore.toggleCollapsed}
                onAddChild={handleAddChild}
                onDeleteTask={taskStore.deleteTask}
                onOpenProjectSettings={(project: Task) => setSelectedProjectId(project.id)}
                onDateClipboardShortcut={handleDateClipboardShortcut}
              />
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedProject ? (
        <ProjectExclusionModal
          project={selectedProject}
          exclusions={getProjectExclusions(selectedProject.id, projectExclusions)}
          onClose={() => setSelectedProjectId(null)}
        />
      ) : null}
      {desktopDateClipboardEnabled && clipboardNotice ? (
        <div className={`table-clipboard-toast ${clipboardNotice.tone}`} role="status" aria-live="polite">
          {clipboardNotice.message}
        </div>
      ) : null}
    </section>
  );
}
