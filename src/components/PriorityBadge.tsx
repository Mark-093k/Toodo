import type { TaskPriority } from '../types';

type PriorityBadgeProps = {
  priority: TaskPriority;
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return <span className={`badge priority-${priority}`}>{priority}</span>;
}
