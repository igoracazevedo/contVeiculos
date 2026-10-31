'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Combo com digitação livre e lista própria (no lugar do datalist do navegador, que só mostra o que
 * combina com o texto já digitado). A seta abre todas as opções, mesmo com o campo preenchido.
 */
export default function ComboInput({
  value,
  onChange,
  options,
  placeholder,
  inputClassName = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('touchstart', outside);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('touchstart', outside);
    };
  }, [open]);

  const list = useMemo(() => {
    const unique = Array.from(new Set(options));
    const t = value.trim().toLowerCase();
    return filtering && t ? unique.filter((o) => o.toLowerCase().includes(t)) : unique;
  }, [options, value, filtering]);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        className={`${inputClassName} pr-10`}
        onChange={(e) => {
          onChange(e.target.value);
          setFiltering(true);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'ArrowDown') {
            setFiltering(false);
            setOpen(true);
          }
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Ver opções"
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          setFiltering(false);
          setOpen((o) => !o);
        }}
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10"
      >
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && list.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl dark:border-[#293548] dark:bg-[#151f32]"
        >
          {list.map((o) => (
            <li key={o} role="option" aria-selected={o === value}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-xs transition hover:bg-[#ff6200]/10 hover:text-[#ec7000] ${
                  o === value ? 'bg-[#ff6200]/10 font-semibold text-[#ec7000]' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
