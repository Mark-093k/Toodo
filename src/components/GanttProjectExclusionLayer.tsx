import type { CSSProperties } from 'react';
import type { ProjectExclusionPeriod } from '../types';
import { diffInDays, parseDate } from '../utils/date';
import { isTaskInProjectGroup } from '../utils/projectExclusions';
import type { TaskRowModel } from '../utils/taskTree';

type GanttProjectExclusionLayerProps = {
  rows: TaskRowModel[];
  exclusions: ProjectExclusionPeriod[];
  timelineStart: Date;
  days: Date[];
  dayWidth: number;
  rowHeight: number;
};

export default function GanttProjectExclusionLayer({
  rows,
  exclusions,
  timelineStart,
  days,
  dayWidth,
  rowHeight,
}: GanttProjectExclusionLayerProps) {
  const tasksById = new Map(rows.map(({ task }) => [task.id, task]));

  return (
    <div className="gantt-project-exclusion-layer" aria-hidden="true">
      {exclusions.flatMap((exclusion) => {
        const rowIndexes = rows.flatMap(({ task }, index) =>
          isTaskInProjectGroup(task, exclusion.projectId, tasksById) ? [index] : [],
        );
        const startDate = parseDate(exclusion.startDate);
        const endDate = parseDate(exclusion.endDate);

        if (!startDate || !endDate || rowIndexes.length === 0 || days.length === 0) {
          return [];
        }

        const normalizedStart = startDate <= endDate ? startDate : endDate;
        const normalizedEnd = startDate <= endDate ? endDate : startDate;
        const firstVisibleDayIndex = Math.max(0, diffInDays(timelineStart, normalizedStart));
        const lastVisibleDayIndex = Math.min(days.length - 1, diffInDays(timelineStart, normalizedEnd));

        if (lastVisibleDayIndex < firstVisibleDayIndex) {
          return [];
        }

        const firstRowIndex = Math.min(...rowIndexes);
        const lastRowIndex = Math.max(...rowIndexes);
        const color = exclusion.color ?? 'yellow';

        return (
          <div
            key={exclusion.id}
            className={`gantt-project-exclusion color-${color}`}
            style={
              {
                left: `${firstVisibleDayIndex * dayWidth}px`,
                top: `${firstRowIndex * rowHeight}px`,
                width: `${(lastVisibleDayIndex - firstVisibleDayIndex + 1) * dayWidth}px`,
                height: `${(lastRowIndex - firstRowIndex + 1) * rowHeight}px`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
