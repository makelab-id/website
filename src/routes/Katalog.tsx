import { useMemo, useState } from "react";
import { useModels, useSettings } from "../lib/api";
import { buildCatalogOrderMessage, rupiah, waLink } from "../lib/pricing";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { Link } from "react-router-dom";

const ALL = "Semua";

export function Katalog() {
  const { data: models, isLoading } = useModels();
  const { data: settings } = useSettings();
  const [filter, setFilter] = useState<string>(ALL);

  const visible = useMemo(() => (models ?? []).filter((m) => m.active), [models]);
  const categories = useMemo(() => Array.from(new Set(visible.map((m) => m.category))), [visible]);
  const filtered = useMemo(
    () => (filter === ALL ? visible : visible.filter((m) => m.category === filter)),
    [visible, filter],
  );

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 24px 0" }}>
      <h6 style={{ color: "var(--color-accent)", marginBottom: 6 }}>Model library</h6>
      <h1 style={{ fontSize: 44, margin: "0 0 10px" }}>Katalog siap cetak</h1>
      <p style={{ maxWidth: "62ch", color: "var(--color-neutral-700)", fontSize: 15 }}>
        Model yang sudah kami uji cetak — tinggal pilih material dan warna. Katalog terus bertambah; kalau ada part
        yang kamu cari belum ada, tanyakan lewat chat.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "26px 0 28px", alignItems: "center" }}>
        <button
          className="btn btn-secondary"
          onClick={() => setFilter(ALL)}
          style={{
            padding: "9px 18px",
            ...(filter === ALL
              ? { background: "var(--color-accent)", color: "var(--color-bg)", borderColor: "var(--color-accent)" }
              : {}),
          }}
        >
          {ALL}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className="btn btn-secondary"
            onClick={() => setFilter(cat)}
            style={{
              padding: "9px 18px",
              ...(filter === cat
                ? { background: "var(--color-accent)", color: "var(--color-bg)", borderColor: "var(--color-accent)" }
                : {}),
            }}
          >
            {cat}
          </button>
        ))}
        <span style={{ alignSelf: "center", fontSize: 13, color: "var(--color-neutral-600)", marginLeft: 6 }}>
          {isLoading ? "Memuat…" : `${filtered.length} model${filter === ALL ? "" : " · " + filter}`}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {filtered.map((m) => (
          <div key={m.slot} className="card elev-sm" style={{ padding: 0, overflow: "hidden", gap: 0 }}>
            <div className="washed" style={{ height: 190, background: "var(--color-neutral-200)" }}>
              <ImagePlaceholder category={m.category} label="Foto hasil cetak" />
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <span className="card-kicker">{m.category}</span>
              <span className="card-title">{m.name}</span>
              <p className="card-body">{m.description}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="tag tag-neutral">{m.sizeLabel}</span>
                <span className="tag tag-accent-2">{m.materialLabel}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>mulai {rupiah(m.basePrice)}</span>
                <a
                  className="btn btn-primary"
                  href={settings ? waLink(settings.whatsappNumber, buildCatalogOrderMessage(m)) : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "9px 16px" }}
                >
                  Order
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 40,
          background: "var(--color-surface)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          padding: "34px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 26,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ fontSize: 22, margin: "0 0 6px" }}>Punya desain sendiri?</h3>
          <p style={{ margin: 0, fontSize: 14, color: "var(--color-neutral-700)" }}>
            Upload file kamu dan lihat estimasi harganya dulu.
          </p>
        </div>
        <Link to="/quote" className="btn btn-primary" style={{ padding: "13px 24px" }}>
          Upload file
        </Link>
      </div>
    </main>
  );
}
