import { Suspense, lazy, useEffect, useMemo, useReducer, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { BufferGeometry } from "three";
import type { ParsedModel } from "../lib/geometryMetrics";
import { useQuoteConfig } from "../lib/api";
import {
  type Delivery,
  type FakeFile,
  SAMPLE_FILE,
  buildQuoteMessage,
  calc,
  fileFrom,
  hoursText,
  priceRange,
  rupiah,
  waLink,
} from "../lib/pricing";
import { SegRadioGroup } from "../components/ui/SegRadioGroup";

// `three` is ~600KB minified — code-split it into its own chunk so every
// other route (and /quote before a file is even picked) doesn't pay for it.
const PartStage = lazy(() => import("../components/PartStage").then((m) => ({ default: m.PartStage })));

type ModelStatus = "idle" | "loading" | "error";

interface QuoteState {
  file: FakeFile | null;
  geometry: BufferGeometry | null;
  modelStatus: ModelStatus;
  modelError: string | null;
  materialName: string;
  qualityLabel: string;
  infillPercent: number;
  colorName: string;
  scale: number;
  qty: number;
  finishLabel: string;
  delivery: Delivery;
}

const initialState: QuoteState = {
  file: null,
  geometry: null,
  modelStatus: "idle",
  modelError: null,
  materialName: "",
  qualityLabel: "",
  infillPercent: 0,
  colorName: "",
  scale: 100,
  qty: 1,
  finishLabel: "",
  delivery: "reguler",
};

type QuoteAction =
  | { type: "SET_FILE"; file: FakeFile | null }
  | { type: "MODEL_LOADING" }
  | { type: "MODEL_LOADED"; file: FakeFile; geometry: BufferGeometry }
  | { type: "MODEL_ERROR"; message: string }
  | { type: "SET_FIELD"; field: "materialName" | "qualityLabel" | "colorName" | "finishLabel"; value: string }
  | { type: "SET_INFILL"; value: number }
  | { type: "SET_SCALE"; value: number }
  | { type: "SET_QTY"; value: number }
  | { type: "SET_DELIVERY"; value: Delivery }
  | { type: "INIT_DEFAULTS"; material: string; quality: string; infill: number; color: string; finish: string };

function reducer(state: QuoteState, action: QuoteAction): QuoteState {
  switch (action.type) {
    case "SET_FILE":
      return { ...state, file: action.file, geometry: null, modelStatus: "idle", modelError: null };
    case "MODEL_LOADING":
      return { ...state, modelStatus: "loading", modelError: null };
    case "MODEL_LOADED":
      return { ...state, file: action.file, geometry: action.geometry, modelStatus: "idle", modelError: null };
    case "MODEL_ERROR":
      return { ...state, geometry: null, modelStatus: "error", modelError: action.message };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_INFILL":
      return { ...state, infillPercent: action.value };
    case "SET_SCALE":
      return { ...state, scale: action.value };
    case "SET_QTY":
      return { ...state, qty: Math.max(1, Math.min(200, action.value || 1)) };
    case "SET_DELIVERY":
      return { ...state, delivery: action.value };
    case "INIT_DEFAULTS":
      return {
        ...state,
        materialName: state.materialName || action.material,
        qualityLabel: state.qualityLabel || action.quality,
        infillPercent: state.infillPercent || action.infill,
        colorName: state.colorName || action.color,
        finishLabel: state.finishLabel || action.finish,
      };
    default:
      return state;
  }
}

const DELIVERY_OPTIONS = [
  { value: "reguler" as Delivery, label: "Reguler 3–5 hari" },
  { value: "express" as Delivery, label: "Express 24 jam" },
];

export function Quote() {
  const { materials, colors, quality, infill, finish, settings, isLoading, isError } = useQuoteConfig();
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized.current || !materials || !colors || !quality || !infill || !finish) return;
    const activeMaterials = materials.filter((m) => !m.comingSoon);
    dispatch({
      type: "INIT_DEFAULTS",
      material: activeMaterials[0]?.name ?? "",
      quality: (quality.find((q) => q.isDefault) ?? quality[0])?.label ?? "",
      infill: (infill.find((i) => i.isDefault) ?? infill[0])?.percent ?? 0,
      color: colors[0]?.name ?? "",
      finish: finish[0]?.label ?? "",
    });
    initialized.current = true;
  }, [materials, colors, quality, infill, finish]);

  // Dispose the previous mesh's GPU/CPU buffers whenever it's replaced by a
  // new upload or cleared, and on unmount.
  useEffect(() => {
    return () => {
      state.geometry?.dispose();
    };
  }, [state.geometry]);

  const selectedMaterial = materials?.find((m) => m.name === state.materialName);
  const selectedQuality = quality?.find((q) => q.label === state.qualityLabel);
  const selectedInfill = infill?.find((i) => i.percent === state.infillPercent);
  const selectedColor = colors?.find((c) => c.name === state.colorName);
  const selectedFinish = finish?.find((f) => f.label === state.finishLabel);

  const result = useMemo(() => {
    if (!selectedMaterial || !selectedQuality || !selectedInfill || !selectedColor || !selectedFinish || !settings) return null;
    return calc({
      file: state.file,
      scale: state.scale,
      qty: state.qty,
      finish: selectedFinish,
      delivery: state.delivery,
      material: selectedMaterial,
      quality: selectedQuality,
      infill: selectedInfill,
      color: selectedColor,
      settings,
    });
  }, [selectedMaterial, selectedQuality, selectedInfill, selectedColor, selectedFinish, settings, state]);

  // .stl, .glb/.gltf, and .3mf can be parsed client-side for real geometry;
  // .obj/.ply/.step/.stp keep the byte-size heuristic from fileFrom() above.
  // Each parser lives in its own module, loaded dynamically here (along
  // with `three`, ~600KB) so routes other than an active /quote upload
  // never pay for it — matches the lazy PartStage import below.
  const loadParserFor = (name: string): Promise<(file: File) => Promise<ParsedModel>> | null => {
    if (/\.stl$/i.test(name)) return import("../lib/stl").then((m) => m.parseStlFile);
    if (/\.(glb|gltf)$/i.test(name)) return import("../lib/modelFile").then((m) => m.parseGltfFile);
    if (/\.3mf$/i.test(name)) return import("../lib/modelFile").then((m) => m.parse3mfFile);
    return null;
  };

  const onPick = (f: File) => {
    dispatch({ type: "SET_FILE", file: fileFrom(f.name, f.size / 1024) });

    const parserPromise = loadParserFor(f.name);
    if (!parserPromise) return;

    dispatch({ type: "MODEL_LOADING" });
    parserPromise
      .then((parse) => parse(f))
      .then(({ geometry, volumeCm3, bboxMm, surfaceAreaMm2 }) => {
        dispatch({
          type: "MODEL_LOADED",
          geometry,
          file: { name: f.name, kb: f.size / 1024, vol: volumeCm3, bbox: bboxMm, surfaceAreaMm2 },
        });
      })
      .catch((err) => {
        dispatch({
          type: "MODEL_ERROR",
          message: err instanceof Error ? err.message : "Gagal membaca file model. Coba file lain.",
        });
      });
  };

  // Home's hero dropzone hands off a File via navigation state so it can
  // land directly in the preview here instead of round-tripping the file.
  useEffect(() => {
    const incoming = (location.state as { file?: File } | null)?.file;
    if (!incoming) return;
    onPick(incoming);
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  if (
    isLoading ||
    !result ||
    !selectedMaterial ||
    !selectedQuality ||
    !selectedInfill ||
    !selectedColor ||
    !selectedFinish ||
    !settings
  ) {
    return (
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 24px 0" }}>
        <p style={{ color: "var(--color-neutral-700)" }}>
          {isError ? "Gagal memuat data harga. Coba muat ulang halaman." : "Memuat…"}
        </p>
      </main>
    );
  }

  const { low, high } = priceRange(result.total);
  const quoteMsg = buildQuoteMessage({
    file: state.file,
    materialName: state.materialName,
    colorName: state.colorName,
    qualityLabel: state.qualityLabel,
    infillPercent: state.infillPercent,
    scale: state.scale,
    qty: state.qty,
    finishLabel: state.finishLabel,
    delivery: state.delivery,
    total: result.total,
  });
  const waQuote = waLink(settings.whatsappNumber, quoteMsg);

  return (
    <main className="mk-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 24px 0" }}>
      <h6 style={{ color: "var(--color-accent)", marginBottom: 6 }}>Upload &amp; instant quote</h6>
      <h1 style={{ fontSize: "clamp(30px, 6vw, 44px)", margin: "0 0 10px" }}>Estimasi harga cetak</h1>
      <p style={{ maxWidth: "60ch", color: "var(--color-neutral-700)", fontSize: 15 }}>
        Angka di halaman ini adalah perkiraan otomatis dari ukuran file. Harga final selalu kami konfirmasi di
        WhatsApp setelah file dicek.
      </p>

      <div className="mk-grid mk-stack-900" style={{ gridTemplateColumns: "1fr 0.85fr", gap: 32, marginTop: 32, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {!state.file && (
            <>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "clamp(28px, 8vw, 52px) clamp(20px, 6vw, 40px)",
                  border: "2px dashed var(--color-neutral-400)",
                  borderRadius: "calc(var(--radius-lg) * 1.15)",
                  background: "var(--color-neutral-100)",
                  cursor: "pointer",
                  position: "relative",
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) onPick(f);
                }}
              >
                <input
                  type="file"
                  accept=".stl,.glb,.gltf,.3mf,.obj,.step,.stp,.ply"
                  style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPick(f);
                    e.target.value = "";
                  }}
                />
                <span
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-accent-200)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8c491a" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v13" />
                    <path d="m6 9 6-6 6 6" />
                    <path d="M4 21h16" />
                  </svg>
                </span>
                <h3 style={{ fontSize: 24, margin: "6px 0 0" }}>Tarik file ke sini, atau klik untuk pilih</h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--color-neutral-700)" }}>
                  .stl · .glb/.gltf · .3mf · .obj · .step — maksimal 100 MB per file
                </p>
              </label>
              <div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "11px 20px" }}
                  onClick={() => dispatch({ type: "SET_FILE", file: fileFrom(SAMPLE_FILE.name, SAMPLE_FILE.kb) })}
                >
                  Coba dengan file contoh
                </button>
              </div>
            </>
          )}

          {state.file && (
            <div style={{ borderRadius: "calc(var(--radius-lg) * 1.15)", background: "var(--color-surface)", padding: 20, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {state.file.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>
                    {(state.file.kb / 1024).toFixed(1)} MB ·{" "}
                    {state.modelStatus === "loading"
                      ? "membaca geometri…"
                      : state.geometry
                        ? "geometri asli dimuat"
                        : "siap dihitung"}
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", flex: "none" }}
                  onClick={() => dispatch({ type: "SET_FILE", file: null })}
                >
                  Ganti file
                </button>
              </div>
              {state.modelStatus === "error" && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-accent-700)",
                    background: "var(--color-accent-100)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    margin: "0 0 14px",
                  }}
                >
                  {state.modelError} Preview memakai bentuk contoh; estimasi tetap dihitung dari ukuran file.
                </p>
              )}
              <div
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  background: "var(--color-neutral-200)",
                  height: "min(320px, 55vw)",
                  minHeight: 220,
                }}
              >
                <Suspense fallback={null}>
                  <PartStage color={selectedColor.hex} geometry={state.geometry} />
                </Suspense>
                {state.modelStatus === "loading" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      color: "var(--color-neutral-700)",
                      background: "color-mix(in srgb, var(--color-neutral-200) 70%, transparent)",
                    }}
                  >
                    Membaca geometri file…
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                <span className="tag tag-neutral">
                  {state.file.bbox.map((v) => Math.round((v * state.scale) / 100)).join(" × ")} mm
                </span>
                <span className="tag tag-neutral">{result.vol.toFixed(1)} cm³</span>
                <span className="tag tag-neutral">± {Math.max(1, Math.round(result.grams))} g</span>
                <span className="tag tag-accent-2">± {hoursText(result.hours)}</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--color-neutral-600)", margin: "12px 0 0" }}>
                {state.geometry
                  ? "Geser untuk memutar, scroll untuk zoom. Preview ini geometri asli dari file kamu."
                  : "Geser untuk memutar model. Preview ini representasi bentuk, bukan geometri asli file."}
              </p>
            </div>
          )}

          <div style={{ borderRadius: "calc(var(--radius-lg) * 1.15)", background: "var(--color-neutral-100)", padding: 26, display: "grid", gap: 22 }}>
            <div className="field">
              <label>Material</label>
              <SegRadioGroup
                name="mk-mat"
                value={state.materialName}
                onChange={(value) => dispatch({ type: "SET_FIELD", field: "materialName", value })}
                options={(materials ?? []).filter((m) => !m.comingSoon).map((m) => ({ value: m.name, label: m.name }))}
              />
            </div>

            <div className="field">
              <label>Kualitas / tinggi layer</label>
              <SegRadioGroup
                name="mk-q"
                value={state.qualityLabel}
                onChange={(value) => dispatch({ type: "SET_FIELD", field: "qualityLabel", value })}
                options={(quality ?? []).map((q) => ({ value: q.label, label: q.label }))}
              />
            </div>

            <div className="field">
              <label>Infill</label>
              <SegRadioGroup
                name="mk-inf"
                value={state.infillPercent}
                onChange={(value) => dispatch({ type: "SET_INFILL", value })}
                options={(infill ?? []).map((i) => ({ value: i.percent, label: i.label }))}
              />
            </div>

            <div className="field">
              <label>Warna filament</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(colors ?? []).map((c) => (
                  <label key={c.name} className="radio" style={{ gap: 7 }}>
                    <input
                      type="radio"
                      name="mk-col"
                      value={c.name}
                      checked={c.name === state.colorName}
                      onChange={() => dispatch({ type: "SET_FIELD", field: "colorName", value: c.name })}
                    />
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        flex: "none",
                        borderRadius: "var(--radius-sm)",
                        border: "1.5px solid var(--color-divider)",
                        background: c.hex,
                      }}
                    />
                    {c.name}{" "}
                    <span style={{ color: "var(--color-neutral-600)", fontSize: 12 }}>
                      {c.extraPrice ? "+" + rupiah(c.extraPrice) : ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: 20, alignItems: "end" }}>
              <div className="field">
                <label>Skala — {state.scale}%</label>
                <input
                  type="range"
                  min={50}
                  max={200}
                  step={5}
                  value={state.scale}
                  onChange={(e) => dispatch({ type: "SET_SCALE", value: Number(e.target.value) })}
                  style={{ width: "100%" }}
                />
              </div>
              <div className="field">
                <label>Jumlah (pcs)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={200}
                  value={state.qty}
                  onChange={(e) => dispatch({ type: "SET_QTY", value: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="field">
              <label>Finishing</label>
              <SegRadioGroup
                name="mk-fin"
                value={state.finishLabel}
                onChange={(value) => dispatch({ type: "SET_FIELD", field: "finishLabel", value })}
                options={(finish ?? []).map((f) => ({ value: f.label, label: f.label }))}
              />
            </div>

            <div className="field">
              <label>Pengerjaan</label>
              <SegRadioGroup
                name="mk-del"
                value={state.delivery}
                onChange={(value) => dispatch({ type: "SET_DELIVERY", value })}
                options={DELIVERY_OPTIONS}
              />
            </div>
          </div>
        </div>

        <aside className="mk-aside-sticky" style={{ position: "sticky", top: 104, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--color-surface)", borderRadius: "calc(var(--radius-lg) * 1.15)", padding: 30, boxShadow: "var(--shadow-md)" }}>
            <h6 style={{ color: "var(--color-accent)", marginBottom: 10 }}>Estimasi</h6>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 34, lineHeight: 1.15 }}>
              {rupiah(low)} – {rupiah(high)}
            </div>
            <p style={{ fontSize: 13, color: "var(--color-neutral-700)", margin: "10px 0 0" }}>
              {state.file
                ? `Perkiraan untuk ${state.qty} pcs, dari volume ${result.vol.toFixed(1)} cm³. Harga final setelah file di-slice.`
                : "Belum ada file — angka ini contoh untuk part berukuran sedang (±18 cm³)."}
            </p>

            <div style={{ height: 1, background: "var(--color-divider)", margin: "22px 0" }} />

            <div style={{ display: "grid", gap: 9, fontSize: 13 }}>
              <Row label={`Material ${state.materialName} · ${Math.max(1, Math.round(result.grams * state.qty))} g`} value={rupiah(result.matCost)} />
              <Row label="Waktu mesin" value={rupiah(result.timeCost)} />
              <Row label="Finishing" value={result.finishCost ? rupiah(result.finishCost) : "—"} />
              <Row label="Warna" value={result.colorCost ? rupiah(result.colorCost) : "—"} />
              <Row label="Setup & QC" value={rupiah(result.setup)} />
              <Row
                label={state.delivery === "express" ? "Express 24 jam" : "Jumlah"}
                value={
                  state.delivery === "express"
                    ? `+${Math.round(settings.expressMarkupPct * 100)}%`
                    : state.qty >= settings.bulkQtyThreshold
                      ? `${state.qty} pcs · diskon ${Math.round(settings.bulkDiscountPct * 100)}%`
                      : `${state.qty} pcs`
                }
              />
            </div>

            <div style={{ height: 1, background: "var(--color-divider)", margin: "22px 0" }} />

            <a className="btn btn-primary btn-block" href={waQuote} target="_blank" rel="noopener noreferrer" style={{ padding: "15px 22px", fontSize: 15 }}>
              Lanjut ke WhatsApp
            </a>
            <p style={{ fontSize: 12, color: "var(--color-neutral-600)", margin: "12px 0 0" }}>
              Rincian di atas otomatis ikut terkirim di pesan pertama.
            </p>
          </div>
          <div style={{ background: "var(--color-accent-2-100)", borderRadius: "calc(var(--radius-lg) * 1.15)", padding: "22px 26px" }}>
            <h3 style={{ fontSize: 17, margin: "0 0 6px", color: "var(--color-accent-2-900)" }}>File belum sempurna?</h3>
            <p style={{ fontSize: 13, margin: 0, color: "var(--color-accent-2-800)" }}>
              Mesh bolong atau dinding terlalu tipis kami perbaiki gratis untuk perbaikan ringan. Kirim saja filenya.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--color-neutral-700)" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
