import {
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { Task } from '../types';

type GanttBarProps = {
  task: Task;
  className: string;
  style: CSSProperties;
  rangeLabel: string;
};

type TooltipPosition = {
  left: number;
  top: number;
};

const VIEWPORT_PADDING = 10;
const TOOLTIP_GAP = 8;

export default function GanttBar({ task, className, style, rangeLabel }: GanttBarProps) {
  const tooltipId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ left: 0, top: 0 });

  const updateTooltipPosition = useCallback(() => {
    const bar = barRef.current;
    const tooltip = tooltipRef.current;
    if (!bar || !tooltip) {
      return;
    }

    const barRect = bar.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const left = Math.min(
      window.innerWidth - tooltipRect.width - VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, barRect.left + barRect.width / 2 - tooltipRect.width / 2),
    );
    const preferredTop = barRect.top - tooltipRect.height - TOOLTIP_GAP;
    const fallbackTop = barRect.bottom + TOOLTIP_GAP;
    const top = preferredTop >= VIEWPORT_PADDING ? preferredTop : fallbackTop;

    setTooltipPosition({
      left,
      top: Math.min(window.innerHeight - tooltipRect.height - VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, top)),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isTooltipVisible) {
      return;
    }

    updateTooltipPosition();
    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition, true);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition, true);
    };
  }, [isTooltipVisible, updateTooltipPosition]);

  const showTooltip = () => setIsTooltipVisible(true);
  const hideTooltip = () => setIsTooltipVisible(false);

  const handleMouseMove = (_event: MouseEvent<HTMLDivElement>) => {
    if (isTooltipVisible) {
      updateTooltipPosition();
    }
  };

  const handleFocus = (_event: FocusEvent<HTMLDivElement>) => showTooltip();
  const handleBlur = (_event: FocusEvent<HTMLDivElement>) => hideTooltip();
  const certaintyLabel = task.scheduleCertainty === 'tentative' ? '미정' : '확정';

  return (
    <>
      <div
        ref={barRef}
        className={className}
        style={style}
        tabIndex={0}
        role="img"
        aria-label={`${task.title}: ${rangeLabel}, 일정 ${certaintyLabel}`}
        aria-describedby={isTooltipVisible ? tooltipId : undefined}
        onMouseEnter={showTooltip}
        onMouseMove={handleMouseMove}
        onMouseLeave={hideTooltip}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      {isTooltipVisible
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="gantt-bar-tooltip"
              style={{
                left: `${tooltipPosition.left}px`,
                top: `${tooltipPosition.top}px`,
              }}
            >
              <strong>{task.title}</strong>
              <span>{rangeLabel}</span>
              <span>
                {task.status} · 일정: {certaintyLabel}
              </span>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
