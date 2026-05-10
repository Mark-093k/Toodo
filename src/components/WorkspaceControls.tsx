import { useEffect, useRef, useState } from 'react';
import { useWorkspaceMeta, useWorkspaceStatus, workspaceStore } from '../store/workspaceStore';

type StorageInfo = Awaited<ReturnType<typeof workspaceStore.getStorageInfo>>;

const readFileAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const downloadJson = (fileName: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export default function WorkspaceControls() {
  const meta = useWorkspaceMeta();
  const { isReady, isSaving, isYearLoading } = useWorkspaceStatus();
  const yearImportRef = useRef<HTMLInputElement>(null);
  const allImportRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const isBusy = !isReady || isYearLoading;
  const isDesktop = storageInfo?.kind === 'desktop';
  const isCloud = storageInfo?.kind === 'cloud';

  useEffect(() => {
    if (!isReady) {
      return;
    }

    workspaceStore
      .getStorageInfo()
      .then(setStorageInfo)
      .catch(() => setStorageInfo(null));
  }, [isReady]);

  const handleCreateYear = async () => {
    const defaultYear = String(new Date().getFullYear() + 1);
    const rawYear = window.prompt('새로 만들 연도를 입력하세요.', defaultYear);
    if (!rawYear) {
      return;
    }

    const year = Number(rawYear);
    if (!Number.isInteger(year) || year < 1900 || year > 2999) {
      window.alert('1900~2999 사이의 연도를 입력해주세요.');
      return;
    }

    try {
      await workspaceStore.createYear(year);
      setMessage(`${year}년 보드를 만들었습니다.`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '새 연도를 만들지 못했습니다.');
    }
  };

  const handleExportYear = async () => {
    const data = await workspaceStore.exportCurrentYear();
    downloadJson(`toodo-${data.year}-backup.json`, data);
    setMessage(`${data.year}년 데이터를 내보냈습니다.`);
  };

  const handleExportAll = async () => {
    const data = await workspaceStore.exportAllYears();
    downloadJson('toodo-all-years-backup.json', data);
    setMessage('전체 연도 데이터를 내보냈습니다.');
  };

  const handleSaveNow = async () => {
    try {
      await workspaceStore.saveNow();
      setMessage('저장되었습니다.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
  };

  const handleOpenDataDir = async () => {
    try {
      await workspaceStore.openDataDir();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '데이터 폴더를 열 수 없습니다.');
    }
  };

  const handleBackupYear = async () => {
    try {
      const backupPath = await workspaceStore.backupCurrentYear();
      setMessage(`백업 생성: ${backupPath}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '백업 생성에 실패했습니다.');
    }
  };

  const handleImportYear = async (file?: File) => {
    if (!file) {
      return;
    }

    if (!window.confirm('현재 저장소의 동일 연도 데이터를 가져온 파일로 덮어쓸까요?')) {
      return;
    }

    try {
      await workspaceStore.importYear(await readFileAsText(file));
      setMessage('연도 데이터를 가져왔습니다.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '가져오기에 실패했습니다.');
    } finally {
      if (yearImportRef.current) {
        yearImportRef.current.value = '';
      }
    }
  };

  const handleImportAll = async (file?: File) => {
    if (!file) {
      return;
    }

    if (!window.confirm('전체 연도 데이터를 가져온 파일로 교체할까요? 현재 저장된 다른 연도 데이터도 덮어쓸 수 있습니다.')) {
      return;
    }

    try {
      await workspaceStore.importAllYears(await readFileAsText(file));
      setMessage('전체 연도 데이터를 가져왔습니다.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '가져오기에 실패했습니다.');
    } finally {
      if (allImportRef.current) {
        allImportRef.current.value = '';
      }
    }
  };

  return (
    <div className="workspace-controls" aria-label="Workspace controls">
      <label className="year-switcher">
        <span>Year</span>
        <select
          value={meta.activeYear}
          disabled={isBusy}
          aria-label="Active year"
          onChange={(event) => void workspaceStore.switchYear(Number(event.target.value))}
        >
          {meta.years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className="small-button" disabled={isBusy} onClick={handleCreateYear}>
        + Year
      </button>
      <button type="button" className="small-button" disabled={isBusy} onClick={handleExportYear}>
        Export Year
      </button>
      <button type="button" className="small-button" disabled={isBusy} onClick={() => yearImportRef.current?.click()}>
        Import Year
      </button>
      <button type="button" className="small-button" disabled={isBusy} onClick={handleExportAll}>
        Export All
      </button>
      <button type="button" className="small-button" disabled={isBusy} onClick={() => allImportRef.current?.click()}>
        Import All
      </button>
      {isDesktop ? (
        <>
          <button type="button" className="small-button" disabled={isBusy} onClick={handleSaveNow}>
            Save Now
          </button>
          <button type="button" className="small-button" disabled={isBusy} onClick={handleBackupYear}>
            Backup Year
          </button>
          <button type="button" className="small-button" disabled={isBusy} onClick={handleOpenDataDir}>
            Data Folder
          </button>
        </>
      ) : null}
      <input
        ref={yearImportRef}
        className="file-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) => void handleImportYear(event.target.files?.[0])}
      />
      <input
        ref={allImportRef}
        className="file-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) => void handleImportAll(event.target.files?.[0])}
      />

      <span className="workspace-save-state">
        {isSaving ? 'Saving...' : message || (isDesktop ? 'Desktop file storage' : isCloud ? 'Supabase cloud storage' : '')}
      </span>
      {storageInfo?.dataDirPath ? (
        <span className="workspace-storage-path" title={storageInfo.dataDirPath}>
          {storageInfo.dataDirPath}
        </span>
      ) : null}
    </div>
  );
}
