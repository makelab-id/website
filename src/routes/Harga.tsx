import { Link } from "react-router-dom";
import { useFinishOptions, useMaterials, useSettings } from "../lib/api";
import { rupiah } from "../lib/pricing";

export function Harga() {
  const { data: materials } = useMaterials();
  const { data: finishOptions } = useFinishOptions();
  const { data: settings } = useSettings();

  return (
    <main className="mk-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 24px 0" }}>
      <h6 style={{ color: "var(--color-accent)", marginBottom: 6 }}>Pricing</h6>
      <h1 style={{ fontSize: "clamp(30px, 6vw, 44px)", margin: "0 0 10px" }}>Cara kami menghitung harga</h1>
      <p style={{ maxWidth: "62ch", color: "var(--color-neutral-700)", fontSize: 15 }}>
        Tidak ada biaya tersembunyi. Kalau estimasi website berbeda jauh dari hitungan asli, kami kabari sebelum
        mulai.
      </p>

      <div
        style={{
          marginTop: 28,
          background: "var(--color-accent-2-100)",
          borderRadius: "calc(var(--radius-lg) * 1.15)",
          padding: "28px 32px",
        }}
      >
        <h6 style={{ color: "var(--color-accent-2-800)", marginBottom: 14 }}>Rumus harga</h6>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 10px" }}>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(18px, 2.8vw, 24px)",
              color: "var(--color-accent-2-900)",
            }}
          >
            Harga Cetak
          </span>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(18px, 2.8vw, 24px)", color: "var(--color-accent-2-700)" }}>
            =
          </span>
          <span className="tag tag-accent-2" style={{ fontSize: 17 }}>Biaya setup</span>
          <span style={{ fontSize: 17, color: "var(--color-accent-2-700)" }}>+</span>
          <span className="tag tag-accent-2" style={{ fontSize: 17 }}>Biaya material</span>
          <span style={{ fontSize: 17, color: "var(--color-accent-2-700)" }}>+</span>
          <span className="tag tag-accent-2" style={{ fontSize: 17 }}>Biaya waktu mesin</span>
          <span style={{ fontSize: 17, color: "var(--color-accent-2-700)" }}>+</span>
          <span className="tag tag-accent-2" style={{ fontSize: 17 }}>Biaya finishing</span>
        </div>
      </div>

      <div className="mk-grid mk-stack-900" style={{ gridTemplateColumns: "1.1fr 0.9fr", gap: 28, marginTop: 34, marginBottom: 40, alignItems: "start" }}>
        <div style={{ background: "var(--color-surface)", borderRadius: "calc(var(--radius-lg) * 1.15)", padding: 32, boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontSize: 24, marginBottom: 14 }}>Tarif dasar</h2>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Komponen</th>
                  <th>Tarif</th>
                </tr>
              </thead>
              <tbody>
                {materials?.filter((m) => !m.comingSoon).map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{rupiah(m.ratePerGram)} / gram</td>
                  </tr>
                ))}
                {settings && (
                  <>
                    <tr>
                      <td>Waktu mesin</td>
                      <td>{rupiah(settings.machineRatePerHour)} / jam</td>
                    </tr>
                    <tr>
                      <td>Setup &amp; QC</td>
                      <td>{rupiah(settings.setupFee)} / order</td>
                    </tr>
                    {finishOptions?.filter((f) => f.price > 0).map((f) => (
                      <tr key={f.id}>
                        <td>{f.label}</td>
                        <td>{rupiah(f.price)} / pcs</td>
                      </tr>
                    ))}
                    <tr>
                      <td>Express 24 jam</td>
                      <td>+{Math.round(settings.expressMarkupPct * 100)}%</td>
                    </tr>
                    <tr>
                      <td>Order {settings.bulkQtyThreshold} pcs ke atas</td>
                      <td>−{Math.round(settings.bulkDiscountPct * 100)}%</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            borderRadius: "calc(var(--radius-lg) * 1.15)",
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <h3 style={{ fontSize: 20, margin: 0, color: "var(--color-bg)" }}>Mau tahu harga part kamu?</h3>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.9 }}>
            Upload file .stl dan lihat estimasinya langsung di layar, dihitung dari rumus yang sama persis dengan di
            atas.
          </p>
          <Link
            to="/quote"
            className="btn"
            style={{ background: "var(--color-bg)", color: "var(--color-text)", padding: "13px 24px", alignSelf: "flex-start" }}
          >
            Hitung file kamu sendiri
          </Link>
        </div>
      </div>
    </main>
  );
}
