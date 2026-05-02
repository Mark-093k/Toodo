import { useEffect, useState } from 'react';
import GanttView from './components/GanttView';
import MainTable from './components/MainTable';
import TopNav from './components/TopNav';
import { useWorkspaceStatus, workspaceStore } from './store/workspaceStore';
import type { ViewMode } from './types';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('table');
  const { isReady, isYearLoading, error } = useWorkspaceStatus();

  useEffect(() => {
    void workspaceStore.initialize();
  }, []);

  return (
    <div className="app-shell">
      <TopNav activeView={activeView} onChangeView={setActiveView} />
      <main>
        {error ? (
          <section className="workspace-panel empty-state-panel">
            <h2>데이터를 불러오지 못했습니다</h2>
            <p>{error}</p>
          </section>
        ) : !isReady || isYearLoading ? (
          <section className="workspace-panel empty-state-panel">
            <h2>Workspace loading</h2>
            <p>현재 선택된 연도 데이터만 불러오는 중입니다.</p>
          </section>
        ) : activeView === 'table' ? (
          <MainTable />
        ) : (
          <GanttView />
        )}
      </main>
    </div>
  );
}
