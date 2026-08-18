// Custom dropdown (not a native <select>) for material, quality, infill,
// finish, and delivery pickers on the Quote screen. A native <select>'s
// option popup is an OS-level control positioned in real screen
// coordinates, so it renders detached from the field on any page shown
// inside a scaled/transformed preview frame (e.g. a device-mockup
// wrapper) — this version keeps the menu entirely in normal DOM/CSS flow.
import { useEffect, useRef, useState, type CSSProperties } from "react";

export interface SegOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SegRadioGroupProps<T extends string | number> {
  name: string;
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: CSSProperties;
}

export function SegRadioGroup<T extends string | number>({
  name,
  options,
  value,
  onChange,
  style,
}: SegRadioGroupProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="dropdown" style={style}>
      <button
        type="button"
        className="input dropdown-toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {selected?.label ?? ""}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label={name} className="dropdown-menu">
          {options.map((opt) => (
            <li key={String(opt.value)} role="option" aria-selected={opt.value === value}>
              <button
                type="button"
                className="dropdown-opt"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
