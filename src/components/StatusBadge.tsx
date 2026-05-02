import type { TaskStatus } from '../types';

type StatusBadgeProps = {
  status: TaskStatus;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`badge status-${status}`}>{status}</span>;
}
