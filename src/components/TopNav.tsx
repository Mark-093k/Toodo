import type { ViewMode } from '../types';
import WorkspaceControls from './WorkspaceControls';
import ThemeSwitcher from './ui/ThemeSwitcher';

type TopNavProps = {
  activeView: ViewMode;
  onChangeView: (view: ViewMode) => void;
};

export default function TopNav({ activeView, onChangeView }: TopNavProps) {
  return (
    <header className="top-nav">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div>
          <h1>Toodo</h1>
          <p>Local project board</p>
        </div>
      </div>

      <div className="top-nav-actions">
        <WorkspaceControls />
        <nav className="view-tabs" aria-label="View tabs">
          <button
            type="button"
            className={activeView === 'table' ? 'active' : ''}
            aria-pressed={activeView === 'table'}
            onClick={() => onChangeView('table')}
          >
            Main Table
          </button>
          <button
            type="button"
            className={activeView === 'gantt' ? 'active' : ''}
            aria-pressed={activeView === 'gantt'}
            onClick={() => onChangeView('gantt')}
          >
            Gantt
          </button>
        </nav>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
