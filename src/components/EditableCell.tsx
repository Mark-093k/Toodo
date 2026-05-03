import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';

type ShortcutContext<T extends string> = {
  draft: T;
  setDraft: (value: T) => void;
};

type EditableCellProps<T extends string> = {
  value: T;
  active: boolean;
  inputType?: 'text' | 'date' | 'select';
  options?: readonly T[];
  placeholder?: string;
  className?: string;
  renderValue?: (value: T) => ReactNode;
  onActivate: () => void;
  onCommit: (value: T) => void;
  onNavigate: (direction: 1 | -1) => void;
  onCancel: () => void;
  onShortcutKeyDown?: (
    event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    context: ShortcutContext<T>,
  ) => void;
};

export default function EditableCell<T extends string>({
  value,
  active,
  inputType = 'text',
  options = [],
  placeholder = '',
  className = '',
  renderValue,
  onActivate,
  onCommit,
  onNavigate,
  onCancel,
  onShortcutKeyDown,
}: EditableCellProps<T>) {
  const [draft, setDraft] = useState<T>(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (active) {
      setDraft(value);
      requestAnimationFrame(() => {
        const editor = selectRef.current ?? inputRef.current;
        editor?.focus();
        if (inputRef.current instanceof HTMLInputElement && inputType !== 'date') {
          inputRef.current.select();
        }
      });
    }
  }, [active, inputType, value]);

  const commit = () => {
    onCommit(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    onShortcutKeyDown?.(event, { draft, setDraft });
    if (event.defaultPrevented) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(value);
      onCancel();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      commit();
      onNavigate(event.shiftKey ? -1 : 1);
    }
  };

  if (active) {
    if (inputType === 'select') {
      return (
        <select
          ref={selectRef}
          className={`cell-editor ${className}`}
          value={draft}
          onBlur={commit}
          onChange={(event) => setDraft(event.target.value as T)}
          onKeyDown={handleKeyDown}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={inputRef}
        className={`cell-editor ${className}`}
        type={inputType}
        value={draft}
        placeholder={placeholder}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value as T)}
        onKeyDown={handleKeyDown}
      />
    );
  }

  const hasValue = value.trim().length > 0;

  return (
    <button type="button" className={`editable-cell ${className}`} onClick={onActivate}>
      {hasValue ? renderValue?.(value) ?? value : <span className="muted">{placeholder || '-'}</span>}
    </button>
  );
}
