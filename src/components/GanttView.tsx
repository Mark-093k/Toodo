import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { taskStore, useTasks } from '../store/taskStore';
import { buildTaskRows } from '../utils/taskTree';
import GanttTimeline from './GanttTimeline';

const LEFT_PANEL_WIDTH_STORAGE_KEY = 'gantt:leftPanelWidth';
const MIN_LEFT_PANEL_WIDTH = 420;
const DEFAULT_LEFT_PANEL_WIDTH = 680;
const MAX_LEFT_PANEL_WIDTH = 900;

const getMaxLeftPanelWidth = () => {
  if (typeof window === 'undefined') {
    return MAX_LEFT_PANEL_WIDTH;
  }

  return Math.max(MIN_LEFT_PANEL_WIDTH, Math.min(MAX_LEFT_PANEL_WIDTH, Math.floor(window.innerWidth * 0.7)));
};

const clampLeftPanelWidth = (width: number) => {
  return Math.min(getMaxLeftPanelWidth(), Math.max(MIN_LEFT_PANEL_WIDTH, Math.round(width)));
};

const getInitialLeftPanelWidth = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LEFT_PANEL_WIDTH;
  }

  const storedWidth = Number(window.localStorage.getItem(LEFT_PANEL_WIDTH_STORAGE_KEY));
  return Number.isFinite(storedWidth) && storedWidth > 0
    ? clampLeftPanelWidth(storedWidth)
    : clampLeftPanelWidth(DEFAULT_LEFT_PANEL_WIDTH);
};

export default function GanttView() {
  const tasks = useTasks();
  const rows = useMemo(() => buildTaskRows(tasks), [tasks]);
  const [leftPanelWidth, setLeftPanelWidth] = useState(getInitialLeftPanelWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    window.localStorage.setItem(LEFT_PANEL_WIDTH_STORAGE_KEY, String(leftPanelWidth));
  }, [leftPanelWidth]);

  useEffect(() => {
    const handleWindowResize = () => {
      setLeftPanelWidth((currentWidth) => clampLeftPanelWidth(currentWidth));
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!resizeStartRef.current) {
        return;
      }

      event.preventDefault();
      const delta = event.clientX - resizeStartRef.current.startX;
      setLeftPanelWidth(clampLeftPanelWidth(resizeStartRef.current.startWidth + delta));
    };

    const finishResize = () => {
      resizeStartRef.current = null;
      setIsResizing(false);
      document.body.classList.remove('gantt-resizing');
    };

    document.body.classList.add('gantt-resizing');
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishResize);
    window.addEventListener('pointercancel', finishResize);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishResize);
      window.removeEventListener('pointercancel', finishResize);
      document.body.classList.remove('gantt-resizing');
    };
  }, [isResizing]);

  const handleResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      try {
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } catch {
        // Window-level pointer listeners keep resizing stable even if pointer capture is unavailable.
      }
      resizeStartRef.current = {
        startX: event.clientX,
        startWidth: leftPanelWidth,
      };
      setIsResizing(true);
    },
    [leftPanelWidth],
  );

  const handleResizeReset = useCallback(() => {
    resizeStartRef.current = null;
    setIsResizing(false);
    setLeftPanelWidth(clampLeftPanelWidth(DEFAULT_LEFT_PANEL_WIDTH));
  }, []);

  return (
    <section className="workspace-panel">
      <div className="panel-toolbar">
        <div>
          <h2>Gantt View</h2>
          <p>주차별 일정과 상태를 한 화면에서 확인합니다</p>
        </div>
      </div>
      <GanttTimeline
        rows={rows}
        leftPanelWidth={leftPanelWidth}
        isLeftPanelResizing={isResizing}
        onToggleCollapsed={taskStore.toggleCollapsed}
        onLeftPanelResizeStart={handleResizeStart}
        onLeftPanelResizeReset={handleResizeReset}
      />
    </section>
  );
}
