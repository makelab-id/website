import { Link } from "react-router-dom";
import { useMaterials, useSettings } from "../lib/api";
import { rupiah } from "../lib/pricing";

const EXAMPLES = [
  {
    kicker: "PLA · 0,20 mm · infill 25%",
    title: "Gantungan kunci 4 cm",
    body: "±8 gram, cetak 35 menit.",
    price: "Rp 25.000 – Rp 32.000",
  },
  {
    kicker: "PLA · 0,20 mm · infill 25%",
    title: "Part chassis Tamiya",
    body: "±18 gram, cetak 1 jam 20 menit.",
    price: "Rp 48.000 – Rp 60.000",
  },
  {
    kicker: "PETG · 0,20 mm · infill 50%",
    title: "Mount aksesori airsoft",
    body: "±34 gram, cetak 2 jam 30 menit.",
    price: "Rp 105.000 – Rp 132.000",
  },
  {
    kicker: "Resin 8K · figur mini",
    title: "Figur 6 cm + finishing",
    body: "±22 gram resin, sudah termasuk amplas halus.",
    price: "Rp 135.000 – Rp 165.000",
  },
];

export function Harga() {
  const { data: materials } = useMaterials();
  const { data: settings } = useSettings();

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 24px 0" }}>
      <h6 style={{ color: "var(--color-accent)", marginBottom: 6 }}>Pricing</h6>
      <h1 style={{ fontSize: 44, margin: "0 0 10px" }}>Cara kami menghitung harga</h1>
      <p style={{ maxWidth: "62ch", color: "var(--color-neutral-700)", fontSize: 15 }}>
        Harga cetak = material yang terpakai + waktu mesin + finishing + biaya setup. Tidak ada biaya tersembunyi;
        kalau estimasi website berbeda jauh dari hitungan asli, kami kabari sebelum mulai.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, marginTop: 34, alignItems: "start" }}>
        <div>
          <h2 style={{ fontSize: 26, marginBottom: 14 }}>Tarif dasar</h2>
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
                  <tr>
                    <td>Amplas halus</td>
                    <td>{rupiah(settings.finishCostSand)} / pcs</td>
                  </tr>
                  <tr>
                    <td>Amplas + cat</td>
                    <td>{rupiah(settings.finishCostPaint)} / pcs</td>
                  </tr>
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
          <p style={{ fontSize: 13, color: "var(--color-neutral-600)", marginTop: 14 }}>
            Layer 0,12 mm menambah waktu mesin sekitar 60%; 0,28 mm memotongnya sekitar 25%. Infill mengubah berat
            material.
          </p>
        </div>
        <div>
          <h2 style={{ fontSize: 26, marginBottom: 14 }}>Contoh harga nyata</h2>
          <div style={{ display: "grid", gap: 14 }}>
            {EXAMPLES.map((ex) => (
              <div key={ex.title} className="card elev-sm" style={{ gap: 6 }}>
                <span className="card-kicker">{ex.kicker}</span>
                <span className="card-title">{ex.title}</span>
                <p className="card-body">{ex.body}</p>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>{ex.price}</span>
              </div>
            ))}
          </div>
          <Link to="/quote" className="btn btn-primary" style={{ padding: "13px 24px", marginTop: 20, display: "inline-flex" }}>
            Hitung file kamu sendiri
          </Link>
        </div>
      </div>
    </main>
  );
}
