import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { workspaceStore } from '../store/workspaceStore';
import type { ProjectExclusionColor, ProjectExclusionPeriod, ProjectExclusionReasonType, Task } from '../types';
import { projectExclusionReasonLabels, projectExclusionReasonOptions } from '../utils/projectExclusions';

type ProjectExclusionModalProps = {
  project: Task;
  exclusions: ProjectExclusionPeriod[];
  onClose: () => void;
};

type DraftExclusion = ProjectExclusionPeriod;

const colorOptions: ProjectExclusionColor[] = ['yellow', 'blue', 'gray', 'red'];

const colorLabels: Record<ProjectExclusionColor, string> = {
  yellow: '노랑',
  blue: '파랑',
  gray: '회색',
  red: '빨강',
};

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `exclusion-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createDraftExclusion = (projectId: string): DraftExclusion => {
  const now = new Date().toISOString();
  return {
    id: createId(),
    projectId,
    startDate: '',
    endDate: '',
    reasonType: 'client',
    title: '',
    note: '',
    color: 'yellow',
    createdAt: now,
    updatedAt: now,
  };
};

export default function ProjectExclusionModal({ project, exclusions, onClose }: ProjectExclusionModalProps) {
  const [drafts, setDrafts] = useState<DraftExclusion[]>(() =>
    exclusions.length > 0 ? exclusions.map((exclusion) => ({ ...exclusion })) : [createDraftExclusion(project.id)],
  );
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const existingCountText = useMemo(() => {
    if (exclusions.length === 0) {
      return '아직 설정된 제외기간이 없습니다.';
    }

    return `${exclusions.length}개 설정됨`;
  }, [exclusions.length]);

  const updateDraft = (id: string, patch: Partial<DraftExclusion>) => {
    setError('');
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) => {
        if (draft.id !== id) {
          return draft;
        }

        const nextDraft = { ...draft, ...patch };
        if (patch.reasonType && !draft.title.trim()) {
          nextDraft.title = projectExclusionReasonLabels[patch.reasonType];
        }
        return nextDraft;
      }),
    );
  };

  const handleInputChange =
    (id: string, field: keyof DraftExclusion) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      updateDraft(id, { [field]: event.target.value } as Partial<DraftExclusion>);
    };

  const handleDeleteDraft = (id: string) => {
    setError('');
    setDrafts((currentDrafts) =>
      currentDrafts.length > 1
        ? currentDrafts.filter((currentDraft) => currentDraft.id !== id)
        : [createDraftExclusion(project.id)],
    );
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const validDrafts: ProjectExclusionPeriod[] = [];

    for (const draft of drafts) {
      const hasAnyInput = draft.startDate || draft.endDate || draft.title.trim() || draft.note?.trim();
      if (!hasAnyInput) {
        continue;
      }

      if (!draft.startDate || !draft.endDate) {
        setError('시작일과 종료일을 모두 입력해주세요.');
        return;
      }

      if (draft.endDate < draft.startDate) {
        setError('종료일은 시작일보다 빠를 수 없습니다.');
        return;
      }

      validDrafts.push({
        ...draft,
        projectId: project.id,
        title: draft.title.trim() || projectExclusionReasonLabels[draft.reasonType],
        note: draft.note?.trim() ?? '',
        color: draft.color ?? 'yellow',
        createdAt: draft.createdAt || now,
        updatedAt: now,
      });
    }

    workspaceStore.replaceProjectExclusions(project.id, validDrafts);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="project-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${project.title} 제외기간 설정`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="project-settings-header">
          <div>
            <h2>프로젝트 제외기간</h2>
            <p>{project.title}</p>
          </div>
          <button type="button" className="icon-text-button" onClick={onClose}>
            닫기
          </button>
        </header>

        <div className="project-settings-list">
          {drafts.map((draft, index) => (
            <div key={draft.id} className="project-exclusion-editor">
              <div className="project-exclusion-editor-title">
                <strong>제외기간 {index + 1}</strong>
                <button type="button" className="small-button danger" onClick={() => handleDeleteDraft(draft.id)}>
                  삭제
                </button>
              </div>
              <div className="project-exclusion-grid">
                <label>
                  <span>시작일</span>
                  <input type="date" value={draft.startDate} onChange={handleInputChange(draft.id, 'startDate')} />
                </label>
                <label>
                  <span>종료일</span>
                  <input type="date" value={draft.endDate} onChange={handleInputChange(draft.id, 'endDate')} />
                </label>
                <label>
                  <span>사유</span>
                  <select
                    value={draft.reasonType}
                    onChange={(event) =>
                      updateDraft(draft.id, { reasonType: event.target.value as ProjectExclusionReasonType })
                    }
                  >
                    {projectExclusionReasonOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>색상</span>
                  <select
                    value={draft.color ?? 'yellow'}
                    onChange={(event) => updateDraft(draft.id, { color: event.target.value as ProjectExclusionColor })}
                  >
                    {colorOptions.map((color) => (
                      <option key={color} value={color}>
                        {colorLabels[color]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="project-exclusion-title-field">
                  <span>제목</span>
                  <input
                    type="text"
                    value={draft.title}
                    placeholder={projectExclusionReasonLabels[draft.reasonType]}
                    onChange={handleInputChange(draft.id, 'title')}
                  />
                </label>
                <label className="project-exclusion-note-field">
                  <span>메모</span>
                  <textarea value={draft.note ?? ''} rows={2} onChange={handleInputChange(draft.id, 'note')} />
                </label>
              </div>
            </div>
          ))}
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        <footer className="project-settings-actions">
          <span>{existingCountText}</span>
          <button
            type="button"
            className="small-button"
            onClick={() => setDrafts((currentDrafts) => currentDrafts.concat(createDraftExclusion(project.id)))}
          >
            + 추가
          </button>
          <button type="button" className="primary-button" onClick={handleSave}>
            저장
          </button>
        </footer>
      </section>
    </div>
  );
}
