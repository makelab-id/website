// Ported from Admin.dc.html's "Katalog Model" page — the list behind the
// public Katalog screen. Each row expands into an edit form; the photo
// slot renders the same category-tinted placeholder the public site uses
// until a real photo pipeline exists (see src/components/ImagePlaceholder).
import { useState } from "react";
import { useModels } from "../../lib/api";
import { useModelMutations } from "../../lib/adminApi";
import type { PrintModel } from "../../lib/types";
import { ImagePlaceholder } from "../../components/ImagePlaceholder";
import { CommitInput } from "./CommitInput";

export function AdminCatalog() {
  const { data: models } = useModels();
  const modelMut = useModelMutations();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div>
      <h6 style={{ color: "var(--color-accent)", marginBottom: 6 }}>Backend</h6>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 10 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>Katalog model</h1>
        <button
          className="btn btn-secondary"
          style={{ padding: "9px 18px" }}
          onClick={() =>
            modelMut.create.mutate(
              {
                slot: `mk-new-${Date.now()}`,
                category: "Tamiya",
                name: "Model baru",
                description: "",
                sizeLabel: "",
                materialLabel: "PLA",
                basePrice: 0,
                active: true,
                sortOrder: models?.length ?? 0,
              },
              { onSuccess: (row) => setExpandedId(row.id) },
            )
          }
        >
          + Tambah model
        </button>
      </div>
      <p style={{ maxWidth: "60ch", color: "var(--color-neutral-700)", fontSize: 14, marginBottom: 26 }}>
        Model yang tampil di halaman Katalog. Tarik foto ke kotak gambar untuk menggantinya.
      </p>

      <div style={{ display: "grid", gap: 10, marginBottom: 60 }}>
        {models?.map((m) => (
          <ModelRow
            key={m.id}
            row={m}
            expanded={expandedId === m.id}
            onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
            onUpdate={modelMut.update.mutate}
            onRemove={() => {
              modelMut.remove.mutate(m.id);
              if (expandedId === m.id) setExpandedId(null);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ModelRow({
  row,
  expanded,
  onToggle,
  onUpdate,
  onRemove,
}: {
  row: PrintModel;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (vars: { id: number } & Partial<PrintModel>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 18px", cursor: "pointer" }} onClick={onToggle}>
        <input
          type="checkbox"
          checked={row.active}
          title="Aktif di katalog"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdate({ id: row.id, active: e.target.checked })}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>
            {row.category} · {row.sizeLabel}
          </div>
        </div>
        <span className={`tag ${row.active ? "tag-accent-2" : "tag-neutral"}`}>{row.active ? "Aktif" : "Nonaktif"}</span>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 15, flex: "none" }}>Rp {Math.round(row.basePrice).toLocaleString("id-ID")}</span>
        <span style={{ flex: "none", color: "var(--color-neutral-600)", fontSize: 13 }}>{expanded ? "▾" : "▸"}</span>
      </div>

      {expanded && (
        <div style={{ display: "flex", gap: 20, padding: 18, borderTop: "1px solid var(--color-divider)", alignItems: "flex-start" }}>
          <div style={{ width: 150, height: 150, flex: "none", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--color-neutral-200)" }}>
            <ImagePlaceholder category={row.category} label="Foto produk" />
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, alignItems: "end" }}>
            <div className="field" style={{ gridColumn: "span 2" }}>
              <label>a. Nama</label>
              <CommitInput type="text" value={row.name} onCommit={(v) => onUpdate({ id: row.id, name: v })} />
            </div>
            <div className="field">
              <label>b. Kategori</label>
              <CommitInput type="text" value={row.category} onCommit={(v) => onUpdate({ id: row.id, category: v })} />
            </div>
            <div className="field">
              <label>c. Ukuran</label>
              <CommitInput type="text" value={row.sizeLabel} onCommit={(v) => onUpdate({ id: row.id, sizeLabel: v })} />
            </div>
            <div className="field">
              <label>d. Material</label>
              <CommitInput type="text" value={row.materialLabel} onCommit={(v) => onUpdate({ id: row.id, materialLabel: v })} />
            </div>
            <div className="field">
              <label>g. Harga dasar (Rp)</label>
              <CommitInput type="number" min={0} step={1000} value={row.basePrice} onCommit={(v) => onUpdate({ id: row.id, basePrice: Number(v) || 0 })} />
            </div>
            <div className="field" style={{ gridColumn: "span 5" }}>
              <label>e. Deskripsi</label>
              <CommitInput type="text" value={row.description} onCommit={(v) => onUpdate({ id: row.id, description: v })} />
            </div>
            <button className="btn btn-secondary" style={{ padding: "9px 14px" }} onClick={onRemove}>
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
