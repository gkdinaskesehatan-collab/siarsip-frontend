import { useEffect, useMemo, useRef, useState } from 'react';

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  /** Bila diisi (misal "Semua"), muncul pilihan untuk mengosongkan nilai (untuk kolom filter). */
  allLabel?: string;
  /** Izinkan memilih teks baru yang belum ada di daftar (untuk form tambah dokumen). */
  allowCreate?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}

type Item =
  | { kind: 'all' }
  | { kind: 'option'; text: string }
  | { kind: 'create'; text: string };

const norm = (s: string) => s.trim().toLowerCase();

const DEFAULT_INPUT =
  'w-full px-3 py-2.5 pr-8 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-200 transition disabled:opacity-60';

export default function Combobox({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  allowCreate = false,
  disabled,
  required,
  className = '',
  inputClassName = DEFAULT_INPUT,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dirty, setDirty] = useState(false); // true bila pengguna sedang mengetik
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const q = norm(query);
  const typing = dirty && q.length > 0;

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    if (allLabel && !typing) list.push({ kind: 'all' });

    let shown = options;
    if (typing) {
      const rank = (o: string) => (norm(o) === q ? 0 : norm(o).startsWith(q) ? 1 : 2);
      shown = options
        .filter((o) => norm(o).includes(q))
        .sort((a, b) => rank(a) - rank(b));
    }
    shown.forEach((text) => list.push({ kind: 'option', text }));

    if (allowCreate && typing && !options.some((o) => norm(o) === q)) {
      list.push({ kind: 'create', text: query.trim() });
    }
    return list;
  }, [options, allLabel, allowCreate, typing, q, query]);

  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const reset = () => {
    setOpen(false);
    setDirty(false);
    setQuery('');
  };

  const choose = (item: Item) => {
    onChange(item.kind === 'all' ? '' : item.text);
    reset();
  };

  // Saat kolom kehilangan fokus, teks yang diketik diterapkan bila cocok / boleh dibuat baru
  const commitTyped = () => {
    if (dirty) {
      const text = query.trim();
      if (!text) {
        if (allLabel) onChange('');
      } else {
        const exact = options.find((o) => norm(o) === norm(text));
        if (exact) onChange(exact);
        else if (allowCreate) onChange(text);
      }
    }
    reset();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setHighlight((h) => Math.min(h + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && items[highlight]) {
        e.preventDefault(); // jangan kirim form, cukup pilih item
        choose(items[highlight]);
      }
    } else if (e.key === 'Escape') {
      reset();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        value={dirty ? query : value}
        placeholder={allLabel ?? placeholder}
        disabled={disabled}
        required={required}
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onBlur={commitTyped}
        onChange={(e) => {
          setQuery(e.target.value);
          setDirty(true);
          setOpen(true);
          setHighlight(0);
        }}
        onKeyDown={onKeyDown}
        className={inputClassName}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          if (open) reset();
          else setOpen(true);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
        aria-label="Buka daftar"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && !disabled && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-56 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm"
        >
          {items.length === 0 && <li className="px-3 py-2 text-slate-400">Tidak ada hasil</li>}
          {items.map((item, i) => {
            const label =
              item.kind === 'all' ? allLabel : item.kind === 'create' ? `Tambah baru: "${item.text}"` : item.text;
            const selected = item.kind === 'option' ? item.text === value : item.kind === 'all' && value === '';
            return (
              <li
                key={`${item.kind}-${label}`}
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => {
                  e.preventDefault(); // cegah blur sebelum klik terproses
                  choose(item);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                  i === highlight ? 'bg-brand-50 text-brand-800' : 'text-slate-700'
                } ${item.kind === 'create' ? 'font-semibold text-brand-700' : ''}`}
              >
                <span className="truncate">{label}</span>
                {selected && <span className="text-brand-600 text-xs">✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}