import { useEffect, useMemo, useRef, useState } from 'react';

function toGroups(options) {
  if (options.length === 0) return [];
  if (Array.isArray(options[0]?.options)) return options;
  return [{ label: '', options }];
}

export default function SelectCombobox({
  options,
  value,
  onChange,
  placeholder = 'Select\u2026',
  searchPlaceholder = 'Search\u2026',
  emptyLabel = 'No matches',
  clearable = false,
  id,
  style,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const activeRef = useRef(null);

  const groups = useMemo(() => toGroups(options), [options]);

  const selected = useMemo(() => {
    for (const group of groups) {
      const found = group.options.find(o => o.id === value);
      if (found) return found;
    }
    return null;
  }, [groups, value]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [];
    for (const group of groups) {
      const opts = group.options.filter(o =>
        !q || o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
      );
      if (opts.length === 0) continue;
      out.push({ type: 'header', key: `h-${group.label}`, label: group.label });
      for (const option of opts) out.push({ type: 'option', key: option.id, option });
    }
    return out;
  }, [groups, query]);

  const isOption = (row) => row && row.type === 'option';

  const initialIndex = () => {
    const idx = value
      ? rows.findIndex(r => r.type === 'option' && r.option.id === value)
      : -1;
    if (idx >= 0) return idx;
    return rows.findIndex(r => r.type === 'option');
  };

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(initialIndex());
      searchRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value, options]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const select = (option) => {
    onChange(option.id);
    setOpen(false);
  };

  const stepToOption = (from, dir) => {
    let i = from;
    for (let n = 0; n < rows.length; n++) {
      i = (i + dir + rows.length) % rows.length;
      if (isOption(rows[i])) return i;
    }
    return from;
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setActiveIndex(rows.findIndex(r => r.type === 'option'));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => stepToOption(i, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => stepToOption(i, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = rows[activeIndex];
      if (isOption(row)) select(row.option);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const activeRow = rows[activeIndex];
  const activeLabel = isOption(activeRow) ? `combobox-option-${activeIndex}` : undefined;

  return (
    <div className="combobox position-relative" style={style} ref={containerRef}>
      <button
        id={id}
        type="button"
        className="combobox-control"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-truncate">{selected ? selected.label : placeholder}</span>
        <span className="d-flex align-items-center gap-2">
          {clearable && value && (
            <span
              role="button"
              className="combobox-clear"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              &times;
            </span>
          )}
          <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'} text-body-secondary`} />
        </span>
      </button>

      {open && (
        <div className="combobox-panel">
          <input
            ref={searchRef}
            className="form-control form-control-sm combobox-search"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            role="combobox"
            aria-expanded="true"
            aria-controls="combobox-listbox"
            aria-activedescendant={activeLabel}
          />
          <ul id="combobox-listbox" role="listbox" className="combobox-list">
            {rows.length === 0 ? (
              <li className="combobox-option combobox-empty text-body-secondary">{emptyLabel}</li>
            ) : (
              rows.map((row, i) =>
                row.type === 'header' ? (
                  <li key={row.key} className="combobox-header">{row.label}</li>
                ) : (
                  <li
                    key={row.key}
                    id={`combobox-option-${i}`}
                    ref={i === activeIndex ? activeRef : null}
                    role="option"
                    aria-selected={value === row.option.id}
                    className={`combobox-option ${i === activeIndex ? 'combobox-option--active' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => select(row.option)}
                  >
                    {row.option.label}
                  </li>
                )
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
