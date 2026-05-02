import { type CSSProperties, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Task, TaskDailyMemo } from '../types';

type GanttTaskMemoMarkerProps = {
  task: Task;
  date: string;
  memo?: TaskDailyMemo;
  style: CSSProperties;
  onOpen: (task: Task, date: string, element: HTMLElement) => void;
};

const VIEWPORT_PADDING = 10;
const TOOLTIP_GAP = 7;

const getMemoPreview = (memo: TaskDailyMemo) => memo.content.split(/\r?\n/)[0]?.slice(0, 80) || memo.content.slice(0, 80);

export default function GanttTaskMemoMarker({ task, date, memo, style, onOpen }: GanttTaskMemoMarkerProps) {
  const tooltipId = useId();
  const markerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });

  const updateTooltipPosition = useCallback(() => {
    const marker = markerRef.current;
    const tooltip = tooltipRef.current;
    if (!marker || !tooltip) {
      return;
    }

    const markerRect = marker.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const left = Math.min(
      window.innerWidth - tooltipRect.width - VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, markerRect.left + markerRect.width / 2 - tooltipRect.width / 2),
    );
    const preferredTop = markerRect.top - tooltipRect.height - TOOLTIP_GAP;
    const fallbackTop = markerRect.bottom + TOOLTIP_GAP;
    const top = preferredTop >= VIEWPORT_PADDING ? preferredTop : fallbackTop;

    setTooltipPosition({
      left,
      top: Math.min(window.innerHeight - tooltipRect.height - VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, top)),
    });
  }, []);

  useLayoutEffect(() => {
    if (!memo || !isPreviewVisible) {
      return;
    }

    updateTooltipPosition();
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition, true);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition, true);
    };
  }, [isPreviewVisible, memo, updateTooltipPosition]);

  const showPreview = () => {
    if (memo) {
      setIsPreviewVisible(true);
    }
  };

  const hidePreview = () => setIsPreviewVisible(false);

  return (
    <>
      <button
        ref={markerRef}
        type="button"
        className={`gantt-task-memo-marker ${memo ? 'has-memo' : 'is-empty'}`}
        style={style}
        data-task-memo-marker="true"
        data-task-id={task.id}
        data-memo-date={date}
        aria-label={`${task.title} ${date} ${memo ? '작업 메모 보기' : '작업 메모 추가'}`}
        aria-describedby={memo && isPreviewVisible ? tooltipId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          onOpen(task, date, event.currentTarget);
        }}
        onMouseEnter={showPreview}
        onMouseMove={() => isPreviewVisible && updateTooltipPosition()}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
      >
        {memo ? 'M' : '+'}
      </button>

      {memo && isPreviewVisible
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="gantt-task-memo-preview"
              style={{ left: `${tooltipPosition.left}px`, top: `${tooltipPosition.top}px` }}
            >
              <strong>{task.title}</strong>
              <span>{date}</span>
              <p>{getMemoPreview(memo)}</p>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
