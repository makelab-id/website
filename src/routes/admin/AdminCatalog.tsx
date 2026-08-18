// Ported from Admin.dc.html's "Katalog Model" page — the list behind the
// public Katalog screen. Each row expands into an edit form; the photo
// slot shows the uploaded product photo once one exists, and falls back to
// the same category-tinted placeholder the public site uses otherwise
// (see src/components/ImagePlaceholder).
import { useEffect, useMemo, useRef, useState } from "react";
import { useModels } from "../../lib/api";
import { useModelImageUpload, useModelMutations } from "../../lib/adminApi";
import type { PrintModel } from "../../lib/types";
import { ImagePlaceholder } from "../../components/ImagePlaceholder";
import { Pagination } from "../../components/ui/Pagination";
import { CommitInput } from "./CommitInput";

const PAGE_SIZE = 8;

export function AdminCatalog() {
  const { data: models } = useModels();
  const modelMut = useModelMutations();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models ?? [];
    return (models ?? []).filter(
      (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q),
    );
  }, [models, search]);

  useEffect(() => setPage(1), [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

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
                description: "Deskripsi belum diisi.",
                sizeLabel: "Ukuran belum diisi",
                materialLabel: "PLA",
                basePrice: 0,
                active: true,
                sortOrder: models?.length ?? 0,
              },
              {
                onSuccess: (row) => {
                  setSearch("");
                  setExpandedId(row.id);
                  setPage(Math.max(1, Math.ceil(((models?.length ?? 0) + 1) / PAGE_SIZE)));
                },
              },
            )
          }
        >
          + Tambah model
        </button>
      </div>
      <p style={{ maxWidth: "60ch", color: "var(--color-neutral-700)", fontSize: 14, marginBottom: 10 }}>
        Model yang tampil di halaman Katalog. Klik kotak gambar untuk mengunggah/mengganti foto.
      </p>
      {modelMut.create.isError && (
        <p style={{ color: "var(--color-accent)", fontSize: 13, marginBottom: 16 }}>
          Gagal menambah model: {modelMut.create.error instanceof Error ? modelMut.create.error.message : "Terjadi kesalahan."}
        </p>
      )}

      <div style={{ maxWidth: 320, marginBottom: 18 }}>
        <input
          type="search"
          className="input"
          placeholder="Cari nama atau kategori…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Cari model"
        />
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        {pageItems.map((m) => (
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
        {models && filtered.length === 0 && (
          <p style={{ color: "var(--color-neutral-600)", fontSize: 14 }}>
            Tidak ada model yang cocok dengan pencarian.
          </p>
        )}
      </div>

      <div style={{ marginBottom: 60 }}>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
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
        <div className="admin-model-row" style={{ display: "flex", gap: 20, padding: 18, borderTop: "1px solid var(--color-divider)", alignItems: "flex-start", flexWrap: "wrap" }}>
          <ModelImageTile row={row} />
          <div className="admin-model-fields" style={{ flex: 1, minWidth: 260, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, alignItems: "end" }}>
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

function ModelImageTile({ row }: { row: PrintModel }) {
  const upload = useModelImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) upload.mutate({ id: row.id, file });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "none" }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title="Klik untuk upload foto"
        style={{
          width: 150,
          height: 150,
          padding: 0,
          border: "none",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          background: "var(--color-neutral-200)",
          cursor: upload.isPending ? "wait" : "pointer",
          position: "relative",
        }}
        disabled={upload.isPending}
      >
        <ImagePlaceholder category={row.category} label="Klik untuk upload foto" src={row.imageUrl ?? undefined} />
        {upload.isPending && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "color-mix(in srgb, var(--color-bg) 55%, transparent)",
              fontSize: 12,
              color: "var(--color-text)",
            }}
          >
            Mengunggah…
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: "none" }} onChange={onFileChange} />
      {upload.isError && (
        <span style={{ fontSize: 11, color: "var(--color-accent)", maxWidth: 150 }}>
          {upload.error instanceof Error ? upload.error.message : "Upload gagal."}
        </span>
      )}
    </div>
  );
}
