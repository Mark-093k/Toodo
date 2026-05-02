import { useMemo, useState } from 'react';
import { taskStore, useTasks } from '../store/taskStore';
import { useProjectExclusions } from '../store/workspaceStore';
import type { Task, TaskEditableField } from '../types';
import { getProjectExclusions } from '../utils/projectExclusions';
import { buildTaskRows } from '../utils/taskTree';
import ProjectExclusionModal from './ProjectExclusionModal';
import TaskRow from './TaskRow';

const editableFields: TaskEditableField[] = ['title', 'owner', 'status', 'priority', 'startDate', 'dueDate', 'note'];

type ActiveCell = {
  taskId: string;
  field: TaskEditableField;
} | null;

export default function MainTable() {
  const tasks = useTasks();
  const projectExclusions = useProjectExclusions();
  const rows = useMemo(() => buildTaskRows(tasks), [tasks]);
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = useMemo(
    () => tasks.find((task) => task.id === selectedProjectId) ?? null,
    [selectedProjectId, tasks],
  );

  const handleAddTask = () => {
    const id = taskStore.addTask(null);
    setActiveCell({ taskId: id, field: 'title' });
  };

  const handleAddChild = (parentId: string) => {
    const id = taskStore.addTask(parentId);
    setActiveCell({ taskId: id, field: 'title' });
  };

  const handleNavigateCell = (taskId: string, field: TaskEditableField, direction: 1 | -1) => {
    const cellOrder = rows.flatMap((row) => editableFields.map((editableField) => `${row.task.id}:${editableField}`));
    const currentIndex = cellOrder.indexOf(`${taskId}:${field}`);
    const nextKey = cellOrder[currentIndex + direction];

    if (!nextKey) {
      setActiveCell(null);
      return;
    }

    const [nextTaskId, nextField] = nextKey.split(':') as [string, TaskEditableField];
    setActiveCell({ taskId: nextTaskId, field: nextField });
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
                onSetActiveCell={setActiveCell}
                onNavigateCell={handleNavigateCell}
                onUpdateTask={taskStore.updateTask}
                onToggleChecked={taskStore.toggleChecked}
                onToggleCollapsed={taskStore.toggleCollapsed}
                onAddChild={handleAddChild}
                onDeleteTask={taskStore.deleteTask}
                onOpenProjectSettings={(project: Task) => setSelectedProjectId(project.id)}
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
    </section>
  );
}
