import type { CSSProperties } from 'react';
import type { Task, TaskDailyMemo } from '../types';
import { diffInDays, getTaskDateRange, toIsoDate } from '../utils/date';
import type { TaskRowModel } from '../utils/taskTree';
import { buildTaskDailyMemoKey } from '../store/memoStore';
import GanttTaskMemoMarker from './GanttTaskMemoMarker';

type GanttTaskMemoLayerProps = {
  rows: TaskRowModel[];
  days: Date[];
  timelineStart: Date;
  dayWidth: number;
  rowHeight: number;
  memosByKey: Map<string, TaskDailyMemo>;
  hoveredTarget: { taskId: string; date: string } | null;
  onOpenMemo: (task: Task, date: string, element: HTMLElement) => void;
};

export default function GanttTaskMemoLayer({
  rows,
  days,
  timelineStart,
  dayWidth,
  rowHeight,
  memosByKey,
  hoveredTarget,
  onOpenMemo,
}: GanttTaskMemoLayerProps) {
  return (
    <div className="gantt-task-memo-layer" aria-label="Task별 일자 메모">
      {rows.flatMap(({ task }, rowIndex) => {
        const range = getTaskDateRange(task.startDate, task.dueDate);
        if (!range) {
          return [];
        }

        const firstVisibleIndex = Math.max(0, diffInDays(timelineStart, range.start));
        const lastVisibleIndex = Math.min(days.length - 1, diffInDays(timelineStart, range.end));
        if (lastVisibleIndex < firstVisibleIndex) {
          return [];
        }

        const markers = [];
        for (let dayIndex = firstVisibleIndex; dayIndex <= lastVisibleIndex; dayIndex += 1) {
          const date = toIsoDate(days[dayIndex]);
          const memo = memosByKey.get(buildTaskDailyMemoKey(task.id, date));
          const isHoveredEmptyTarget = hoveredTarget?.taskId === task.id && hoveredTarget.date === date && !memo;
          if (!memo && !isHoveredEmptyTarget) {
            continue;
          }

          markers.push(
            <GanttTaskMemoMarker
              key={`${task.id}-${date}`}
              task={task}
              date={date}
              memo={memo}
              style={
                {
                  left: `${dayIndex * dayWidth + Math.floor((dayWidth - 20) / 2)}px`,
                  top: `${rowIndex * rowHeight + Math.floor((rowHeight - 20) / 2)}px`,
                } as CSSProperties
              }
              onOpen={onOpenMemo}
            />,
          );
        }

        return markers;
      })}
    </div>
  );
}
