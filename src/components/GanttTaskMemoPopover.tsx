import { type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { memoStore } from '../store/memoStore';
import type { Task, TaskDailyMemo } from '../types';

export type TaskMemoAnchorRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

type GanttTaskMemoPopoverProps = {
  task: Task;
  date: string;
  memo?: TaskDailyMemo;
  anchorRect: TaskMemoAnchorRect;
  onClose: () => void;
};

const VIEWPORT_PADDING = 12;
const POPOVER_GAP = 8;

export const getTaskMemoAnchorRect = (element: HTMLElement): TaskMemoAnchorRect => {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
};

export default function GanttTaskMemoPopover({ task, date, memo, anchorRect, onClose }: GanttTaskMemoPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(memo?.content ?? '');
  const [position, setPosition] = useState({ left: anchorRect.left, top: anchorRect.bottom + POPOVER_GAP });

  useEffect(() => {
    setDraft(memo?.content ?? '');
  }, [memo?.id, memo?.content]);

  useLayoutEffect(() => {
    const popover = popoverRef.current;
    if (!popover) {
      return;
    }

    const rect = popover.getBoundingClientRect();
    const left = Math.min(
      window.innerWidth - rect.width - VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, anchorRect.left + anchorRect.width / 2 - rect.width / 2),
    );
    const preferredTop = anchorRect.bottom + POPOVER_GAP;
    const fallbackTop = anchorRect.top - rect.height - POPOVER_GAP;
    const top =
      preferredTop + rect.height <= window.innerHeight - VIEWPORT_PADDING
        ? preferredTop
        : Math.max(VIEWPORT_PADDING, fallbackTop);

    setPosition({ left, top });
  }, [anchorRect, memo?.id]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (popoverRef.current?.contains(target)) {
        return;
      }

      if (target instanceof Element && target.closest('[data-task-memo-marker="true"]')) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  };

  const handleSave = () => {
    if (!draft.trim()) {
      return;
    }

    memoStore.upsertMemo(task.id, date, draft);
    onClose();
  };

  const handleDelete = () => {
    if (memo) {
      memoStore.deleteMemo(memo.id);
    }
    onClose();
  };

  return createPortal(
    <div
      ref={popoverRef}
      className="gantt-task-memo-popover"
      style={{ left: `${position.left}px`, top: `${position.top}px` }}
      role="dialog"
      aria-label={`${task.title} ${date} 작업 메모`}
      onKeyDown={handleKeyDown}
    >
      <div className="gantt-task-memo-popover-header">
        <div>
          <strong>{task.title}</strong>
          <span>{date}</span>
        </div>
        <button type="button" className="icon-text-button" onClick={onClose}>
          닫기
        </button>
      </div>

      <textarea
        value={draft}
        rows={5}
        placeholder="이 Task에서 오늘 진행한 작업"
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
      />

      <div className="gantt-task-memo-actions">
        <span>{memo ? `수정: ${memo.updatedAt.slice(0, 10)}` : '새 작업 메모'}</span>
        <button type="button" className="small-button danger" disabled={!memo} onClick={handleDelete}>
          삭제
        </button>
        <button type="button" className="primary-button" disabled={!draft.trim()} onClick={handleSave}>
          저장
        </button>
      </div>
    </div>,
    document.body,
  );
}
