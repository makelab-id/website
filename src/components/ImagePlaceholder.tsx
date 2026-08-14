// Replaces the original <image-slot> (a claude.ai/design-tool-only
// drag-drop widget with no real photo behind it). Renders a category-
// tinted tile with an icon + caption by default; pass `src` once a real
// photo exists (drop it in src/assets and wire it up) — no other changes
// needed at the call site.
import type { CSSProperties } from "react";

type Category = "Tamiya" | "RC Toys" | "Airsoft" | "hero" | string;

const TINTS: Record<string, { bg: string; fg: string }> = {
  Tamiya: { bg: "var(--color-accent-100)", fg: "var(--color-accent-700)" },
  "RC Toys": { bg: "var(--color-accent-2-100)", fg: "var(--color-accent-2-700)" },
  Airsoft: { bg: "var(--color-neutral-200)", fg: "var(--color-neutral-700)" },
  hero: { bg: "var(--color-accent-2-200)", fg: "var(--color-accent-2-800)" },
};
const DEFAULT_TINT = { bg: "var(--color-neutral-200)", fg: "var(--color-neutral-600)" };

export interface ImagePlaceholderProps {
  label: string;
  category?: Category;
  src?: string;
  className?: string;
  style?: CSSProperties;
}

export function ImagePlaceholder({ label, category, src, className, style }: ImagePlaceholderProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={className}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }}
      />
    );
  }

  const tint = (category && TINTS[category]) || DEFAULT_TINT;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        textAlign: "center",
        padding: 12,
        background: tint.bg,
        color: tint.fg,
        ...style,
      }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span style={{ fontSize: 12, opacity: 0.85, maxWidth: "90%" }}>{label}</span>
    </div>
  );
}
