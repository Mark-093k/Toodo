import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { buildTaskDailyMemoKey, useTaskDailyMemoMap } from '../store/memoStore';
import { useProjectExclusions } from '../store/workspaceStore';
import type { ProjectExclusionPeriod, Task } from '../types';
import {
  addDays,
  diffInDays,
  formatKoreanMonthDay,
  formatShortDate,
  getTaskDateRange,
  listDays,
  listWeeks,
  maxDate,
  minDate,
  parseDate,
  startOfWeek,
  toIsoDate,
} from '../utils/date';
import { getProjectExclusions, projectExclusionReasonLabels } from '../utils/projectExclusions';
import type { TaskRowModel } from '../utils/taskTree';
import GanttBar from './GanttBar';
import GanttProjectExclusionLayer from './GanttProjectExclusionLayer';
import GanttTaskMemoLayer from './GanttTaskMemoLayer';
import GanttTaskMemoPopover, {
  getTaskMemoAnchorRect,
  type TaskMemoAnchorRect,
} from './GanttTaskMemoPopover';
import StatusBadge from './StatusBadge';

const DAY_WIDTH = 32;
const ROW_HEIGHT = 36;
const TASK_NAME_LEFT_PADDING = 24;
const TASK_DEPTH_INDENT = 18;

type GanttTimelineProps = {
  rows: TaskRowModel[];
  leftPanelWidth: number;
  isLeftPanelResizing: boolean;
  onToggleCollapsed: (id: string) => void;
  onLeftPanelResizeStart: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onLeftPanelResizeReset: () => void;
};

type ActiveMemoPopover = {
  task: Task;
  date: string;
  anchorRect: TaskMemoAnchorRect;
};

type HoveredMemoTarget = {
  taskId: string;
  date: string;
};

const getTimelineBounds = (tasks: Task[], exclusions: ProjectExclusionPeriod[]) => {
  const taskDates = tasks.flatMap((task) => [parseDate(task.startDate), parseDate(task.dueDate)]);
  const exclusionDates = exclusions.flatMap((exclusion) => [parseDate(exclusion.startDate), parseDate(exclusion.endDate)]);
  const dates = [...taskDates, ...exclusionDates].filter(Boolean) as Date[];
  const today = new Date();

  if (dates.length === 0) {
    const start = addDays(startOfWeek(today), -14);
    return { start, end: addDays(start, 55) };
  }

  const rawStart = minDate([...dates, today]);
  const rawEnd = maxDate([...dates, today]);
  const start = addDays(startOfWeek(rawStart), -7);
  const end = addDays(startOfWeek(rawEnd), 48);
  return { start, end };
};

const getBarClassName = (task: Task) => {
  const certaintyClass = task.scheduleCertainty === 'tentative' ? 'gantt-bar--tentative' : 'gantt-bar--fixed';

  if (task.status === '완료') {
    return `gantt-bar done ${certaintyClass}`;
  }

  if (task.status === '진행중') {
    return `gantt-bar active ${certaintyClass}`;
  }

  return `gantt-bar planned ${certaintyClass}`;
};

const formatExclusionSummary = (exclusions: ReturnType<typeof getProjectExclusions>) =>
  exclusions
    .map((exclusion) => {
      const start = formatShortDate(exclusion.startDate) || exclusion.startDate;
      const end = formatShortDate(exclusion.endDate) || exclusion.endDate;
      const label = exclusion.title || projectExclusionReasonLabels[exclusion.reasonType];
      return `${start} - ${end} ${label}`;
    })
    .join('\n');

export default function GanttTimeline({
  rows,
  leftPanelWidth,
  isLeftPanelResizing,
  onToggleCollapsed,
  onLeftPanelResizeStart,
  onLeftPanelResizeReset,
}: GanttTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasFocusedTodayRef = useRef(false);
  const memosByDate = useTaskDailyMemoMap();
  const projectExclusions = useProjectExclusions();
  const [activeMemoPopover, setActiveMemoPopover] = useState<ActiveMemoPopover | null>(null);
  const [hoveredMemoTarget, setHoveredMemoTarget] = useState<HoveredMemoTarget | null>(null);
  const tasks = useMemo(() => rows.map((row) => row.task), [rows]);
  const { start, end, days, weeks, todayColumn, totalWidth } = useMemo(() => {
    const bounds = getTimelineBounds(tasks, projectExclusions);
    const dayList = listDays(bounds.start, bounds.end);
    const weekList = listWeeks(bounds.start, bounds.end);
    const todayIso = toIsoDate(new Date());
    const todayIndex = dayList.findIndex((day) => toIsoDate(day) === todayIso);
    const column =
      todayIndex >= 0
        ? {
            index: todayIndex,
            left: todayIndex * DAY_WIDTH,
            center: todayIndex * DAY_WIDTH + DAY_WIDTH / 2,
          }
        : null;

    return {
      start: bounds.start,
      end: bounds.end,
      days: dayList,
      weeks: weekList,
      todayColumn: column,
      totalWidth: dayList.length * DAY_WIDTH,
    };
  }, [projectExclusions, tasks]);

  const handleOpenTaskMemo = useCallback((task: Task, date: string, element: HTMLElement) => {
    setActiveMemoPopover({
      task,
      date,
      anchorRect: getTaskMemoAnchorRect(element),
    });
  }, []);

  const handleBodyMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      const bodyRect = event.currentTarget.getBoundingClientRect();
      const dayIndex = Math.floor((event.clientX - bodyRect.left) / DAY_WIDTH);
      const rowIndex = Math.floor((event.clientY - bodyRect.top) / ROW_HEIGHT);
      const row = rows[rowIndex];
      const day = days[dayIndex];

      if (!row || !day) {
        setHoveredMemoTarget(null);
        return;
      }

      const range = getTaskDateRange(row.task.startDate, row.task.dueDate);
      if (!range || day < range.start || day > range.end) {
        setHoveredMemoTarget(null);
        return;
      }

      const date = toIsoDate(day);
      setHoveredMemoTarget((currentTarget) =>
        currentTarget?.taskId === row.task.id && currentTarget.date === date
          ? currentTarget
          : { taskId: row.task.id, date },
      );
    },
    [days, rows],
  );

  const activeMemo = activeMemoPopover
    ? memosByDate.get(buildTaskDailyMemoKey(activeMemoPopover.task.id, activeMemoPopover.date))
    : undefined;

  useEffect(() => {
    if (!todayColumn || !scrollRef.current || hasFocusedTodayRef.current) {
      return;
    }

    const scrollElement = scrollRef.current;
    const centeredTodayLeft = todayColumn.center - scrollElement.clientWidth / 2;
    scrollElement.scrollLeft = Math.max(0, centeredTodayLeft);
    hasFocusedTodayRef.current = true;
  }, [todayColumn]);

  return (
    <div
      className={`gantt-grid ${isLeftPanelResizing ? 'is-resizing' : ''}`}
      style={
        {
          '--gantt-left-panel-width': `${leftPanelWidth}px`,
        } as CSSProperties
      }
    >
      <div className="gantt-left">
        <div className="gantt-left-header">
          <span>Task</span>
          <span>상태 / 기간</span>
        </div>
        <div className="gantt-left-rows">
          {rows.map(({ task, depth, hasChildren }) => {
            const rowExclusions = getProjectExclusions(task.id, projectExclusions);

            return (
              <div key={task.id} className={`gantt-left-row ${depth === 0 ? 'parent' : 'child'}`}>
                <div
                  className="gantt-task-name"
                  style={
                    {
                      '--gantt-task-indent-left': `${TASK_NAME_LEFT_PADDING + depth * TASK_DEPTH_INDENT}px`,
                    } as CSSProperties
                  }
                >
                  <button
                    type="button"
                    className={`icon-button tree-toggle gantt-tree-toggle ${hasChildren ? '' : 'hidden-toggle'}`}
                    onClick={() => hasChildren && onToggleCollapsed(task.id)}
                    aria-label={task.collapsed ? '하위 Task 펼치기' : '하위 Task 접기'}
                    aria-expanded={hasChildren ? !task.collapsed : undefined}
                    disabled={!hasChildren}
                  >
                    <svg className="tree-toggle-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <path d="M4 8h8" />
                      {task.collapsed ? <path d="M8 4v8" /> : null}
                    </svg>
                  </button>
                  <span className="gantt-task-title-text">{task.title}</span>
                  {task.scheduleCertainty === 'tentative' ? <span className="gantt-certainty-badge">미정</span> : null}
                  {rowExclusions.length > 0 ? (
                    <span className="gantt-exclusion-badge" title={formatExclusionSummary(rowExclusions)}>
                      제외 {rowExclusions.length}
                    </span>
                  ) : null}
                </div>
                <div className="gantt-task-meta">
                  <StatusBadge status={task.status} />
                  <span>
                    {formatShortDate(task.startDate) || '-'} - {formatShortDate(task.dueDate) || '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="gantt-resize-handle"
        aria-label="Gantt 좌측 패널 너비 조절"
        title="드래그해서 좌측 패널 너비 조절, 더블클릭으로 기본값 복원"
        onPointerDown={onLeftPanelResizeStart}
        onDoubleClick={onLeftPanelResizeReset}
      />

      <div
        ref={scrollRef}
        className="gantt-scroll"
        aria-label={`${formatKoreanMonthDay(start)}부터 ${formatKoreanMonthDay(end)}까지`}
      >
        <div
          className="gantt-canvas"
          style={
            {
              width: `${totalWidth}px`,
              '--gantt-day-width': `${DAY_WIDTH}px`,
            } as CSSProperties
          }
        >
          {todayColumn ? (
            <>
              <div
                className="today-column-highlight"
                style={{ left: `${todayColumn.left}px`, width: `${DAY_WIDTH}px` }}
              />
              <div className="today-line" style={{ left: `${todayColumn.center}px` }}>
                <span>오늘</span>
              </div>
            </>
          ) : null}

          <div className="gantt-week-header">
            {weeks.map((week) => (
              <div key={`${toIsoDate(week.start)}-${toIsoDate(week.end)}`} style={{ width: `${week.days * DAY_WIDTH}px` }}>
                {formatKoreanMonthDay(week.start)} - {formatKoreanMonthDay(week.end)}
              </div>
            ))}
          </div>
          <div className="gantt-day-header">
            {days.map((day) => (
              <div key={toIsoDate(day)} className={day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}>
                {day.getDate()}
              </div>
            ))}
          </div>

          {activeMemoPopover ? (
            <GanttTaskMemoPopover
              task={activeMemoPopover.task}
              date={activeMemoPopover.date}
              memo={activeMemo}
              anchorRect={activeMemoPopover.anchorRect}
              onClose={() => setActiveMemoPopover(null)}
            />
          ) : null}

          <div
            className="gantt-body"
            style={{ height: `${rows.length * ROW_HEIGHT}px` }}
            onMouseMove={handleBodyMouseMove}
            onMouseLeave={() => setHoveredMemoTarget(null)}
          >
            {days.map((day) => (
              <div
                key={toIsoDate(day)}
                className={`day-column ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`}
                style={{ left: `${diffInDays(start, day) * DAY_WIDTH}px`, width: `${DAY_WIDTH}px` }}
              />
            ))}

            <GanttProjectExclusionLayer
              rows={rows}
              exclusions={projectExclusions}
              timelineStart={start}
              days={days}
              dayWidth={DAY_WIDTH}
              rowHeight={ROW_HEIGHT}
            />

            {rows.map(({ task }, index) => {
              const range = getTaskDateRange(task.startDate, task.dueDate);
              if (!range) {
                return null;
              }

              const left = diffInDays(start, range.start) * DAY_WIDTH + 4;
              const width = (diffInDays(range.start, range.end) + 1) * DAY_WIDTH - 8;
              const rangeLabel = `${toIsoDate(range.start)} - ${toIsoDate(range.end)}`;

              return (
                <GanttBar
                  key={task.id}
                  task={task}
                  className={getBarClassName(task)}
                  style={{
                    left: `${left}px`,
                    top: `${index * ROW_HEIGHT + 7}px`,
                    width: `${Math.max(width, 18)}px`,
                  }}
                  rangeLabel={rangeLabel}
                />
              );
            })}
            <GanttTaskMemoLayer
              rows={rows}
              days={days}
              timelineStart={start}
              dayWidth={DAY_WIDTH}
              rowHeight={ROW_HEIGHT}
              memosByKey={memosByDate}
              hoveredTarget={hoveredMemoTarget}
              onOpenMemo={handleOpenTaskMemo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
