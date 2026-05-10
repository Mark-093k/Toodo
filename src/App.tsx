import { useEffect, useState } from 'react';
import GanttView from './components/GanttView';
import MainTable from './components/MainTable';
import SupabaseAuthPanel from './components/SupabaseAuthPanel';
import TopNav from './components/TopNav';
import { isDesktopRuntime } from './storage/desktopFileStorage';
import { useWorkspaceStatus, workspaceStore } from './store/workspaceStore';
import { useSupabaseAuth } from './supabase/useSupabaseAuth';
import type { ViewMode } from './types';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('table');
  const { isReady, isYearLoading, error } = useWorkspaceStatus();
  const supabaseAuth = useSupabaseAuth();
  const cloudAuthRequired = supabaseAuth.isConfigured && !isDesktopRuntime();
  const sessionUserId = supabaseAuth.session?.user.id ?? null;

  useEffect(() => {
    if (supabaseAuth.isLoading) {
      return;
    }

    workspaceStore.reset();

    if (cloudAuthRequired && !sessionUserId) {
      return;
    }

    void workspaceStore.initialize();
  }, [cloudAuthRequired, sessionUserId, supabaseAuth.isLoading]);

  if (cloudAuthRequired && supabaseAuth.isLoading) {
    return (
      <section className="workspace-panel empty-state-panel auth-loading-panel">
        <h2>Session loading</h2>
        <p>Supabase 세션을 확인하는 중입니다.</p>
      </section>
    );
  }

  if (cloudAuthRequired && !sessionUserId) {
    return <SupabaseAuthPanel error={supabaseAuth.error} />;
  }

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
