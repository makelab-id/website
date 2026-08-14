import { Link } from "react-router-dom";
import { ImagePlaceholder } from "../components/ImagePlaceholder";
import { useSettings } from "../lib/api";
import { buildGenericInquiryMessage, waLink } from "../lib/pricing";

const MATERIALS = [
  {
    kicker: "FDM · Rp 1.800 / g",
    title: "PLA",
    body: "Paling ekonomis, detail rapi. Pas untuk prototipe, display, dan part yang tidak kena panas.",
    meta: "Kaku · mudah difinishing",
  },
  {
    kicker: "FDM · Rp 2.400 / g",
    title: "PETG",
    body: "Lebih liat dan tahan cuaca. Favorit untuk mount RC dan aksesori airsoft yang kena benturan.",
    meta: "Tahan panas sedang",
  },
  {
    kicker: "FDM · Rp 2.600 / g",
    title: "ABS",
    body: "Kuat, tahan panas, bisa diamplas dan dicat halus. Untuk part fungsional di dalam bodi.",
    meta: "Perlu enclosure",
  },
  {
    kicker: "Resin · Rp 4.500 / g",
    title: "Resin 8K",
    body: "Detail paling tajam untuk figur kecil, lencana, dan part presisi berukuran mini.",
    meta: "Getas · finishing wajib",
  },
];

const STEPS = [
  {
    n: 1,
    bg: "var(--color-accent)",
    title: "Upload atau pilih model",
    body: ".stl, .obj, .3mf, atau .step. Kalau file bermasalah, kami cek dan perbaiki dulu sebelum cetak.",
  },
  {
    n: 2,
    bg: "var(--color-accent-2-500)",
    title: "Atur material & kualitas",
    body: "Pilih material, ketebalan layer, infill, warna, dan finishing. Estimasi harga berubah langsung.",
  },
  {
    n: 3,
    bg: "var(--color-neutral-800)",
    title: "Lanjut ke WhatsApp",
    body: "Kirim rincian ke chat kami, kami konfirmasi harga final dan mulai antrean cetak.",
  },
];

const LOGISTICS = [
  { title: "3–5 hari kerja", body: "Antrean normal. Express 24 jam tersedia dengan biaya tambahan." },
  { title: "Harga terbuka", body: "Tarif per gram dan per jam mesin kami tulis apa adanya di halaman Harga." },
  { title: "Ambil di tempat", body: "Bisa pickup langsung di workshop Yogyakarta, atau kirim ke seluruh Indonesia." },
  { title: "Perbaikan file", body: "Mesh bolong, dinding terlalu tipis, skala kacau — kami betulkan sebelum cetak." },
];

export function Home() {
  const { data: settings } = useSettings();
  const waHref = settings ? waLink(settings.whatsappNumber, buildGenericInquiryMessage()) : "#";

  return (
    <main>
      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "56px 24px 24px",
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: 48,
          alignItems: "center",
        }}
      >
        <div>
          <span className="tag tag-accent-2" style={{ marginBottom: 18 }}>
            Yogyakarta, Indonesia
          </span>
          <h1 style={{ fontSize: 62, margin: "14px 0 0", maxWidth: "15ch", textWrap: "balance" }}>
            Kirim file, dapat harga, kami cetak.
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.6, maxWidth: "46ch", margin: "20px 0 8px", color: "var(--color-neutral-800)" }}>
            Upload file .stl kamu dan lihat estimasi harga langsung di layar. Belum punya file? Pilih dari katalog
            kami — part Tamiya, RC, dan aksesori airsoft yang siap cetak.
          </p>
          <p style={{ fontSize: 14, color: "var(--color-neutral-600)", marginBottom: 26 }}>
            Upload your .stl and get an instant estimate — or pick a ready-to-print model from our library.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link to="/quote" className="btn btn-primary" style={{ padding: "14px 26px", fontSize: 15 }}>
              Upload file &amp; hitung harga
            </Link>
            <Link to="/katalog" className="btn btn-secondary" style={{ padding: "14px 26px", fontSize: 15 }}>
              Lihat katalog
            </Link>
          </div>
          <div style={{ display: "flex", gap: 26, marginTop: 34, flexWrap: "wrap", fontSize: 13, color: "var(--color-neutral-700)" }}>
            <span>3–5 hari kerja</span>
            <span>Ambil sendiri di Yogya</span>
            <span>File rusak? Kami perbaiki</span>
          </div>
        </div>
        <div
          style={{
            position: "relative",
            aspectRatio: "1",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            background: "var(--color-accent-2-200)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="washed" style={{ position: "absolute", inset: 0 }}>
            <ImagePlaceholder category="hero" label="Foto printer / hasil cetak" />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            background: "var(--color-accent-2-100)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 26px",
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              flex: "none",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-accent-2-500)",
              color: "var(--color-bg)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-heading)",
              fontSize: 18,
            }}
          >
            3D
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 17, margin: "0 0 4px", color: "var(--color-accent-2-900)" }}>Belum punya file 3D?</h3>
            <p style={{ fontSize: 13, margin: 0, color: "var(--color-accent-2-800)" }}>
              Kami juga menyediakan jasa desain 3D dari sketsa, foto, atau ukuran part aslinya — sebelum lanjut ke cetak.
            </p>
          </div>
          <a className="btn btn-secondary" href={waHref} target="_blank" rel="noopener noreferrer" style={{ padding: "11px 20px", flex: "none" }}>
            Tanya jasa desain
          </a>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 24px 24px" }}>
        <h6 style={{ color: "var(--color-accent)", marginBottom: 6 }}>How it works</h6>
        <h2 style={{ fontSize: 38, marginBottom: 32 }}>Tiga langkah saja</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 26 }}>
          {STEPS.map((step) => (
            <div key={step.n} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <span
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "var(--radius-sm)",
                  background: step.bg,
                  color: "var(--color-bg)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-heading)",
                  fontSize: 24,
                }}
              >
                {step.n}
              </span>
              <h3 style={{ fontSize: 22, margin: 0 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: "var(--color-neutral-700)", margin: 0 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 24px 24px" }}>
        <h6 style={{ color: "var(--color-accent)", marginBottom: 6 }}>Material</h6>
        <h2 style={{ fontSize: 38, marginBottom: 32 }}>Yang kami cetak sehari-hari</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {MATERIALS.map((m) => (
            <div key={m.title} className="card elev-sm">
              <span className="card-kicker">{m.kicker}</span>
              <span className="card-title">{m.title}</span>
              <p className="card-body">{m.body}</p>
              <span className="card-meta">{m.meta}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 24px 24px" }}>
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "calc(var(--radius-lg) * 1.15)",
            padding: 44,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 32,
          }}
        >
          {LOGISTICS.map((item) => (
            <div key={item.title}>
              <h3 style={{ fontSize: 20, margin: "0 0 8px" }}>{item.title}</h3>
              <p style={{ fontSize: 13, margin: 0, color: "var(--color-neutral-700)" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 24px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
            flexWrap: "wrap",
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            borderRadius: "calc(var(--radius-lg) * 1.15)",
            padding: "44px 48px",
          }}
        >
          <div>
            <h2 style={{ fontSize: 34, margin: "0 0 8px", color: "var(--color-bg)" }}>Siap cetak hari ini?</h2>
            <p style={{ margin: 0, fontSize: 15, opacity: 0.9 }}>Upload file untuk estimasi, lalu lanjut chat untuk harga final.</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link to="/quote" className="btn" style={{ background: "var(--color-bg)", color: "var(--color-text)", padding: "14px 26px", fontSize: 15 }}>
              Hitung estimasi
            </Link>
            <a
              className="btn btn-secondary"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ borderColor: "color-mix(in srgb, #f5ead8 55%, transparent)", color: "var(--color-bg)", padding: "14px 26px", fontSize: 15 }}
            >
              Chat dulu
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
