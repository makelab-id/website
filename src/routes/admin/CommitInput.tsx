import { type InputHTMLAttributes, useEffect, useState } from "react";

/** A text/number input with instant local typing feedback that only PUTs
 *  to the server on blur (or Enter) — avoids firing a request per
 *  keystroke while keeping the field responsive. Resyncs from `value`
 *  whenever the server's copy changes (e.g. after another field's commit
 *  triggers a refetch). */
export function CommitInput({
  value,
  onCommit,
  className,
  ...rest
}: {
  value: string | number;
  onCommit: (raw: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur" | "onKeyDown">) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => setLocal(String(value)), [value]);

  const commit = () => {
    if (local !== String(value)) onCommit(local);
  };

  return (
    <input
      className={className ?? "input"}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      {...rest}
    />
  );
}
