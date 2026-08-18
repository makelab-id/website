// Site-wide settings that aren't part of the price calculator: the WhatsApp
// number used for every "Chat WA" link across the public site. Calculator
// cost components (materials, quality, infill, colors, finishing, ...) live
// on the Opsi Kalkulator page instead.
import type { ReactNode } from "react";
import { useSettings } from "../../lib/api";
import { useUpdateSettings } from "../../lib/adminApi";
import { CommitInput } from "./CommitInput";

export function AdminSettings() {
  const { data: settings } = useSettings();
  const settingsMut = useUpdateSettings();

  return (
    <div>
      <h6 style={{ color: "var(--color-accent)", marginBottom: 6 }}>Backend</h6>
      <h1 style={{ fontSize: 36, margin: "0 0 10px" }}>Pengaturan</h1>
      <p style={{ maxWidth: "62ch", color: "var(--color-neutral-700)", fontSize: 14, marginBottom: 28 }}>
        Pengaturan umum situs. Untuk komponen biaya kalkulator, lihat halaman Opsi Kalkulator.
      </p>

      {settings && (
        <div className="mk-grid mk-grid-3" style={{ gap: 18 }}>
          <Field label="Nomor WhatsApp">
            <CommitInput
              type="text"
              value={settings.whatsappNumber}
              placeholder="62xxxxxxxxxx"
              onCommit={(v) => settingsMut.mutate({ whatsappNumber: v })}
            />
          </Field>
        </div>
      )}
      <p style={{ fontSize: 12, color: "var(--color-neutral-600)", marginTop: 10 }}>
        Nomor WhatsApp dipakai tanpa "+" atau "0" di depan, mis. 6281234567890.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
