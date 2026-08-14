// The segmented-radio-group pattern (.seg / .seg-opt) used for material,
// quality, infill, finish, and delivery pickers on the Quote screen —
// ported from Makelab.dc.html's repeated <sc-for> + .seg-opt blocks.
import type { CSSProperties } from "react";

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
  return (
    <div className="seg" style={{ flexWrap: "wrap", ...style }}>
      {options.map((opt) => (
        <label key={String(opt.value)} className="seg-opt">
          <input
            type="radio"
            name={name}
            value={String(opt.value)}
            checked={opt.value === value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
