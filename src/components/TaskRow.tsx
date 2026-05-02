import type { ScheduleCertainty, Task, TaskEditableField, TaskPriority, TaskStatus } from '../types';
import EditableCell from './EditableCell';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

const statusOptions: readonly TaskStatus[] = ['예정', '진행중', '완료'];
const priorityOptions: readonly TaskPriority[] = ['낮음', '보통', '높음'];

type ActiveCell = {
  taskId: string;
  field: TaskEditableField;
} | null;

type TaskRowProps = {
  task: Task;
  depth: number;
  hasChildren: boolean;
  isProject: boolean;
  projectExclusionCount: number;
  activeCell: ActiveCell;
  onSetActiveCell: (cell: ActiveCell) => void;
  onNavigateCell: (taskId: string, field: TaskEditableField, direction: 1 | -1) => void;
  onUpdateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void;
  onToggleChecked: (id: string) => void;
  onToggleCollapsed: (id: string) => void;
  onAddChild: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenProjectSettings: (task: Task) => void;
};

export default function TaskRow({
  task,
  depth,
  hasChildren,
  isProject,
  projectExclusionCount,
  activeCell,
  onSetActiveCell,
  onNavigateCell,
  onUpdateTask,
  onToggleChecked,
  onToggleCollapsed,
  onAddChild,
  onDeleteTask,
  onOpenProjectSettings,
}: TaskRowProps) {
  const isActive = (field: TaskEditableField) => activeCell?.taskId === task.id && activeCell.field === field;
  const setActive = (field: TaskEditableField) => onSetActiveCell({ taskId: task.id, field });
  const clearActive = () => onSetActiveCell(null);
  const navigate = (field: TaskEditableField) => (direction: 1 | -1) => onNavigateCell(task.id, field, direction);

  return (
    <tr
      className={`${depth === 0 ? 'parent-row' : 'child-row'} ${task.checked ? 'checked-row' : ''} ${
        task.scheduleCertainty === 'tentative' ? 'tentative-row' : ''
      }`}
    >
      <td className="checkbox-cell">
        <input
          aria-label={`${task.title} 체크`}
          type="checkbox"
          checked={task.checked}
          onChange={() => onToggleChecked(task.id)}
        />
      </td>
      <td className="title-cell">
        <div className="title-stack" style={{ paddingLeft: `${depth * 22}px` }}>
          <button
            type="button"
            className={`icon-button tree-toggle ${hasChildren ? '' : 'hidden-toggle'}`}
            onClick={() => hasChildren && onToggleCollapsed(task.id)}
            aria-label={task.collapsed ? '하위 아이템 펼치기' : '하위 아이템 접기'}
            disabled={!hasChildren}
          >
            {task.collapsed ? '▸' : '▾'}
          </button>
          <EditableCell
            value={task.title}
            active={isActive('title')}
            placeholder="아이템명"
            className="title-edit"
            onActivate={() => setActive('title')}
            onCommit={(title) => {
              onUpdateTask(task.id, { title: title.trim() || '제목 없음' });
              clearActive();
            }}
            onNavigate={navigate('title')}
            onCancel={clearActive}
          />
        </div>
      </td>
      <td>
        <EditableCell
          value={task.owner ?? ''}
          active={isActive('owner')}
          placeholder="-"
          onActivate={() => setActive('owner')}
          onCommit={(owner) => {
            onUpdateTask(task.id, { owner });
            clearActive();
          }}
          onNavigate={navigate('owner')}
          onCancel={clearActive}
        />
      </td>
      <td>
        <EditableCell<TaskStatus>
          value={task.status}
          active={isActive('status')}
          inputType="select"
          options={statusOptions}
          renderValue={(status) => <StatusBadge status={status} />}
          onActivate={() => setActive('status')}
          onCommit={(status) => {
            onUpdateTask(task.id, { status });
            clearActive();
          }}
          onNavigate={navigate('status')}
          onCancel={clearActive}
        />
      </td>
      <td>
        <EditableCell<TaskPriority>
          value={task.priority}
          active={isActive('priority')}
          inputType="select"
          options={priorityOptions}
          renderValue={(priority) => <PriorityBadge priority={priority} />}
          onActivate={() => setActive('priority')}
          onCommit={(priority) => {
            onUpdateTask(task.id, { priority });
            clearActive();
          }}
          onNavigate={navigate('priority')}
          onCancel={clearActive}
        />
      </td>
      <td>
        <EditableCell
          value={task.startDate ?? ''}
          active={isActive('startDate')}
          inputType="date"
          placeholder="-"
          onActivate={() => setActive('startDate')}
          onCommit={(startDate) => {
            onUpdateTask(task.id, { startDate });
            clearActive();
          }}
          onNavigate={navigate('startDate')}
          onCancel={clearActive}
        />
      </td>
      <td>
        <EditableCell
          value={task.dueDate ?? ''}
          active={isActive('dueDate')}
          inputType="date"
          placeholder="-"
          onActivate={() => setActive('dueDate')}
          onCommit={(dueDate) => {
            onUpdateTask(task.id, { dueDate });
            clearActive();
          }}
          onNavigate={navigate('dueDate')}
          onCancel={clearActive}
        />
      </td>
      <td>
        <EditableCell
          value={task.note ?? ''}
          active={isActive('note')}
          placeholder="-"
          onActivate={() => setActive('note')}
          onCommit={(note) => {
            onUpdateTask(task.id, { note });
            clearActive();
          }}
          onNavigate={navigate('note')}
          onCancel={clearActive}
        />
      </td>
      <td className="row-actions">
        <button type="button" className="small-button" onClick={() => onAddChild(task.id)}>
          하위
        </button>
        {isProject ? (
          <button type="button" className="small-button exclusion-button" onClick={() => onOpenProjectSettings(task)}>
            {projectExclusionCount > 0 ? `제외 ${projectExclusionCount}` : '제외기간'}
          </button>
        ) : null}
        <select
          className={`certainty-select ${task.scheduleCertainty === 'tentative' ? 'is-tentative' : ''}`}
          value={task.scheduleCertainty ?? 'fixed'}
          aria-label={`${task.title} 일정 확정 여부`}
          onChange={(event) =>
            onUpdateTask(task.id, { scheduleCertainty: event.target.value as ScheduleCertainty })
          }
        >
          <option value="fixed">확정</option>
          <option value="tentative">미정</option>
        </select>
        <button type="button" className="small-button danger" onClick={() => onDeleteTask(task.id)}>
          삭제
        </button>
      </td>
    </tr>
  );
}
