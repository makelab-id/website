import { Link } from "react-router-dom";
import { useSettings } from "../lib/api";
import { buildGenericInquiryMessage, waLink } from "../lib/pricing";

const FAQS = [
  {
    q: "Format file apa yang diterima?",
    a: ".stl, .glb / .gltf, .3mf, .obj, .ply, dan .step / .stp. Kalau punya file CAD lain, kirim saja — biasanya masih bisa kami buka.",
  },
  {
    q: "Kenapa harganya berupa rentang?",
    a: "Estimasi website dihitung dari ukuran file, bukan slicing sesungguhnya. Setelah file kami slice, harga final biasanya jatuh di dalam rentang itu.",
  },
  {
    q: "Berapa lama pengerjaannya?",
    a: "Reguler 3–5 hari kerja sejak pembayaran. Express 24 jam bisa untuk part kecil, dengan tambahan 40%.",
  },
  {
    q: "Bisa bantu desain dari nol?",
    a: "Bisa. Kirim sketsa, foto, atau ukuran part aslinya, dan kami buatkan modelnya sebelum cetak. Biaya desain dihitung terpisah.",
  },
  {
    q: "Bagaimana cara ambil pesanan?",
    a: "Pickup di workshop Yogyakarta (gratis) atau kirim via ekspedisi pilihan kamu. Ongkir mengikuti tarif kurir.",
  },
];

export function Tentang() {
  const { data: settings } = useSettings();
  const waHref = settings ? waLink(settings.whatsappNumber, buildGenericInquiryMessage()) : "#";

  return (
    <main className="mk-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 24px 0" }}>
      <h6 style={{ color: "var(--color-accent)", marginBottom: 6 }}>About &amp; FAQ</h6>
      <h1 style={{ fontSize: "clamp(28px, 6vw, 44px)", margin: "0 0 10px" }}>Makelab — Design | Print | Create</h1>
      <div className="mk-grid mk-stack-900" style={{ gridTemplateColumns: "1fr 1fr", gap: 44, marginTop: 26, alignItems: "start" }}>
        <div>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--color-neutral-800)" }}>
            Kami workshop kecil di Yogyakarta yang mengerjakan tiga hal: desain 3D, jasa cetak 3D, dan produk cetak
            yang siap kirim. Sebagian besar pelanggan kami penghobi Tamiya, RC, dan airsoft — jadi kami terbiasa
            dengan part kecil yang harus presisi dan kuat.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
            <a className="btn btn-primary" href={waHref} target="_blank" rel="noopener noreferrer" style={{ padding: "13px 24px" }}>
              Chat WhatsApp
            </a>
            <Link to="/katalog" className="btn btn-secondary" style={{ padding: "13px 24px" }}>
              Lihat katalog
            </Link>
          </div>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {FAQS.map((faq, i) => (
            <details
              key={faq.q}
              open={i === 0}
              style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "20px 24px" }}
            >
              <summary style={{ fontFamily: "var(--font-heading)", fontSize: 17 }}>{faq.q}</summary>
              <p style={{ fontSize: 14, color: "var(--color-neutral-700)", margin: "10px 0 0" }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
