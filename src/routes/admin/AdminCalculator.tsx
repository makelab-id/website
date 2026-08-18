// Ported from Admin.dc.html's "Opsi Kalkulator" page — every input the
// public Quote screen's calculator reads from (materials, quality/infill
// options, filament colors) plus the flat cost components in `settings`.
// Edits commit straight to the API; the public site picks them up on its
// next fetch (react-query invalidation keeps this page in sync with itself
// too).
import type { ReactNode } from "react";
import { useColors, useFinishOptions, useInfillOptions, useMaterials, useQualityOptions, useSettings } from "../../lib/api";
import {
  useColorMutations,
  useFinishOptionMutations,
  useInfillOptionMutations,
  useMaterialMutations,
  useQualityOptionMutations,
  useUpdateSettings,
} from "../../lib/adminApi";
import type { Color, FinishOption, InfillOption, Material, QualityOption } from "../../lib/types";
import { CommitInput } from "./CommitInput";

export function AdminCalculator() {
  const { data: materials } = useMaterials();
  const { data: colors } = useColors();
  const { data: qualityOptions } = useQualityOptions();
  const { data: infillOptions } = useInfillOptions();
  const { data: finishOptions } = useFinishOptions();
  const { data: settings } = useSettings();

  const materialMut = useMaterialMutations();
  const colorMut = useColorMutations();
  const qualityMut = useQualityOptionMutations();
  const infillMut = useInfillOptionMutations();
  const finishMut = useFinishOptionMutations();
  const settingsMut = useUpdateSettings();

  return (
    <div>
      <h6 style={{ color: "var(--color-accent)", marginBottom: 6 }}>Backend</h6>
      <h1 style={{ fontSize: 36, margin: "0 0 10px" }}>Opsi kalkulator</h1>
      <p style={{ maxWidth: "62ch", color: "var(--color-neutral-700)", fontSize: 14, marginBottom: 28 }}>
        Semua pilihan di form "Upload &amp; Quote" — material, kualitas, infill, warna filament — dan komponen biaya
        untuk estimasi harga. Perubahan di sini langsung berlaku di website.
      </p>

      <SectionHeader
        title="Material"
        onAdd={() => materialMut.create.mutate({ name: "Material baru", ratePerGram: 0, density: 1, comingSoon: true, sortOrder: (materials?.length ?? 0) })}
        addLabel="+ Tambah material"
      />
      <p style={{ fontSize: 13, color: "var(--color-neutral-600)", margin: "0 0 12px" }}>
        Tarif per gram dan densitas — tandai "Coming soon" untuk material yang belum bisa dipilih pelanggan.
      </p>
      <div className="card" style={{ padding: 0, overflow: "auto", gap: 0, marginBottom: 36 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Rp / gram</th>
              <th>Densitas (g/cm³)</th>
              <th>Coming soon</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {materials?.map((m) => (
              <MaterialRow key={m.id} row={m} onUpdate={materialMut.update.mutate} onRemove={() => materialMut.remove.mutate(m.id)} />
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeader
        title="Kualitas / tinggi layer"
        onAdd={() => qualityMut.create.mutate({ label: "Kualitas baru", timeMultiplier: 1, isDefault: false, sortOrder: (qualityOptions?.length ?? 0) })}
        addLabel="+ Tambah kualitas"
      />
      <p style={{ fontSize: 13, color: "var(--color-neutral-600)", margin: "0 0 12px" }}>
        Multiplier waktu: di atas 1 = lebih lama cetak, di bawah 1 = lebih cepat. Pilih salah satu sebagai default di
        form.
      </p>
      <div className="card" style={{ padding: 0, overflow: "auto", gap: 0, marginBottom: 36 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Default</th>
              <th>Label di form</th>
              <th>Multiplier waktu</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {qualityOptions?.map((q) => (
              <QualityRow
                key={q.id}
                row={q}
                onUpdate={qualityMut.update.mutate}
                onRemove={() => qualityMut.remove.mutate(q.id)}
                onSetDefault={() => setExclusiveDefault(qualityOptions, q.id, qualityMut.update.mutate)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeader
        title="Infill"
        onAdd={() => infillMut.create.mutate({ label: "Infill baru", percent: 0, fillFraction: 0.5, isDefault: false, sortOrder: (infillOptions?.length ?? 0) })}
        addLabel="+ Tambah infill"
      />
      <p style={{ fontSize: 13, color: "var(--color-neutral-600)", margin: "0 0 12px" }}>
        Persentase yang tampil ke pelanggan, dan fraksi volume terisi yang dipakai untuk hitung berat.
      </p>
      <div className="card" style={{ padding: 0, overflow: "auto", gap: 0, marginBottom: 36 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Default</th>
              <th>Label di form</th>
              <th>Persentase</th>
              <th>Fraksi volume (0–1)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {infillOptions?.map((inf) => (
              <InfillRow
                key={inf.id}
                row={inf}
                onUpdate={infillMut.update.mutate}
                onRemove={() => infillMut.remove.mutate(inf.id)}
                onSetDefault={() => setExclusiveDefault(infillOptions, inf.id, infillMut.update.mutate)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeader
        title="Warna filament"
        onAdd={() => colorMut.create.mutate({ name: "Warna baru", hex: "#808080", extraPrice: 0, sortOrder: (colors?.length ?? 0) })}
        addLabel="+ Tambah warna"
      />
      <p style={{ fontSize: 13, color: "var(--color-neutral-600)", margin: "0 0 12px" }}>
        Tambahan biaya per pcs untuk warna tertentu (mis. warna khusus/metalik). Kosongkan / isi 0 untuk warna
        standar.
      </p>
      <div style={{ display: "grid", gap: 10, marginBottom: 36 }}>
        {colors?.map((c) => (
          <ColorRow key={c.id} row={c} onUpdate={colorMut.update.mutate} onRemove={() => colorMut.remove.mutate(c.id)} />
        ))}
      </div>

      <SectionHeader
        title="Finishing"
        onAdd={() => finishMut.create.mutate({ label: "Finishing baru", price: 0, sortOrder: (finishOptions?.length ?? 0) })}
        addLabel="+ Tambah finishing"
      />
      <p style={{ fontSize: 13, color: "var(--color-neutral-600)", margin: "0 0 12px" }}>
        Opsi finishing yang bisa dipilih pelanggan di form Quote, beserta tambahan biaya per pcs.
      </p>
      <div style={{ display: "grid", gap: 10, marginBottom: 36 }}>
        {finishOptions?.map((f) => (
          <FinishRow key={f.id} row={f} onUpdate={finishMut.update.mutate} onRemove={() => finishMut.remove.mutate(f.id)} />
        ))}
      </div>

      <h3 style={{ fontSize: 19, marginBottom: 10 }}>Komponen biaya lain</h3>
      <div style={{ background: "var(--color-accent-2-100)", borderRadius: "var(--radius-lg)", padding: "18px 22px", marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--color-accent-2-900)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          Rumus perhitungan harga
        </h3>
        <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-accent-2-800)", margin: 0, fontFamily: "monospace" }}>
          Total = ((berat × harga material/g) + (waktu cetak × tarif mesin/jam)) × jumlah pcs
          <br />
          &nbsp;&nbsp;+ (biaya finishing × jumlah pcs) + biaya setup &amp; QC
          <br />
          &nbsp;&nbsp;lalu dikurangi diskon jumlah (jika pcs ≥ ambang) dan ditambah markup express (jika pengerjaan
          express)
        </p>
      </div>
      {settings && (
        <div className="mk-grid mk-grid-3" style={{ gap: 18 }}>
          <Field label="Waktu mesin (Rp / jam)">
            <CommitInput type="number" min={0} step={500} value={settings.machineRatePerHour} onCommit={(v) => settingsMut.mutate({ machineRatePerHour: Number(v) || 0 })} />
          </Field>
          <Field label="Setup & QC (Rp / order)">
            <CommitInput type="number" min={0} step={500} value={settings.setupFee} onCommit={(v) => settingsMut.mutate({ setupFee: Number(v) || 0 })} />
          </Field>
          <Field label="Express markup (%)">
            <CommitInput type="number" min={0} step={5} value={Math.round(settings.expressMarkupPct * 100)} onCommit={(v) => settingsMut.mutate({ expressMarkupPct: (Number(v) || 0) / 100 })} />
          </Field>
          <Field label="Diskon dari jumlah (pcs)">
            <CommitInput type="number" min={1} step={1} value={settings.bulkQtyThreshold} onCommit={(v) => settingsMut.mutate({ bulkQtyThreshold: Math.max(1, Number(v) || 1) })} />
          </Field>
          <Field label="Diskon jumlah (%)">
            <CommitInput type="number" min={0} step={5} value={Math.round(settings.bulkDiscountPct * 100)} onCommit={(v) => settingsMut.mutate({ bulkDiscountPct: (Number(v) || 0) / 100 })} />
          </Field>
          <Field label="Ketebalan shell (mm)">
            <CommitInput
              type="number"
              min={0.1}
              max={10}
              step={0.1}
              value={settings.shellThicknessMm}
              onCommit={(v) => settingsMut.mutate({ shellThicknessMm: Number(v) || 0.1 })}
            />
          </Field>
        </div>
      )}
      <p style={{ fontSize: 12, color: "var(--color-neutral-600)", marginTop: 10 }}>
        Ketebalan shell dipakai untuk memperkirakan berapa bagian model yang tetap tercetak solid (dinding luar +
        lapisan atas/bawah) walau infill-nya rendah — bukan cuma volume × persen infill.
      </p>
    </div>
  );
}

function setExclusiveDefault<T extends { id: number; isDefault: boolean }>(
  rows: T[],
  newDefaultId: number,
  update: (vars: { id: number; isDefault: boolean }) => void,
) {
  const previous = rows.find((r) => r.isDefault && r.id !== newDefaultId);
  if (previous) update({ id: previous.id, isDefault: false });
  update({ id: newDefaultId, isDefault: true });
}

function SectionHeader({ title, onAdd, addLabel }: { title: string; onAdd: () => void; addLabel: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 6 }}>
      <h3 style={{ fontSize: 19, margin: 0 }}>{title}</h3>
      <button className="btn btn-secondary" style={{ padding: "8px 16px" }} onClick={onAdd}>
        {addLabel}
      </button>
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

function MaterialRow({
  row,
  onUpdate,
  onRemove,
}: {
  row: Material;
  onUpdate: (vars: { id: number } & Partial<Material>) => void;
  onRemove: () => void;
}) {
  return (
    <tr>
      <td>
        <CommitInput type="text" value={row.name} onCommit={(v) => onUpdate({ id: row.id, name: v })} style={{ width: 140 }} />
      </td>
      <td>
        <CommitInput type="number" min={0} step={50} value={row.ratePerGram} onCommit={(v) => onUpdate({ id: row.id, ratePerGram: Number(v) || 0 })} style={{ width: 120 }} />
      </td>
      <td>
        <CommitInput type="number" min={0} step={0.01} value={row.density} onCommit={(v) => onUpdate({ id: row.id, density: Number(v) || 0 })} style={{ width: 120 }} />
      </td>
      <td>
        <input type="checkbox" checked={row.comingSoon} onChange={(e) => onUpdate({ id: row.id, comingSoon: e.target.checked })} />
      </td>
      <td>
        <button className="btn btn-secondary" style={{ padding: "7px 14px" }} onClick={onRemove}>
          Hapus
        </button>
      </td>
    </tr>
  );
}

function QualityRow({
  row,
  onUpdate,
  onRemove,
  onSetDefault,
}: {
  row: QualityOption;
  onUpdate: (vars: { id: number } & Partial<QualityOption>) => void;
  onRemove: () => void;
  onSetDefault: () => void;
}) {
  return (
    <tr>
      <td>
        <input type="radio" name="admin-q-default" checked={row.isDefault} onChange={onSetDefault} />
      </td>
      <td>
        <CommitInput type="text" value={row.label} onCommit={(v) => onUpdate({ id: row.id, label: v })} style={{ width: 240 }} />
      </td>
      <td>
        <CommitInput type="number" min={0} step={0.05} value={row.timeMultiplier} onCommit={(v) => onUpdate({ id: row.id, timeMultiplier: Number(v) || 0 })} style={{ width: 120 }} />
      </td>
      <td>
        <button className="btn btn-secondary" style={{ padding: "7px 14px" }} onClick={onRemove}>
          Hapus
        </button>
      </td>
    </tr>
  );
}

function InfillRow({
  row,
  onUpdate,
  onRemove,
  onSetDefault,
}: {
  row: InfillOption;
  onUpdate: (vars: { id: number } & Partial<InfillOption>) => void;
  onRemove: () => void;
  onSetDefault: () => void;
}) {
  return (
    <tr>
      <td>
        <input type="radio" name="admin-inf-default" checked={row.isDefault} onChange={onSetDefault} />
      </td>
      <td>
        <CommitInput type="text" value={row.label} onCommit={(v) => onUpdate({ id: row.id, label: v })} style={{ width: 240 }} />
      </td>
      <td>
        <CommitInput type="number" min={0} max={100} step={5} value={row.percent} onCommit={(v) => onUpdate({ id: row.id, percent: Number(v) || 0 })} style={{ width: 100 }} />
      </td>
      <td>
        <CommitInput type="number" min={0} max={1} step={0.02} value={row.fillFraction} onCommit={(v) => onUpdate({ id: row.id, fillFraction: Number(v) || 0 })} style={{ width: 120 }} />
      </td>
      <td>
        <button className="btn btn-secondary" style={{ padding: "7px 14px" }} onClick={onRemove}>
          Hapus
        </button>
      </td>
    </tr>
  );
}

function ColorRow({
  row,
  onUpdate,
  onRemove,
}: {
  row: Color;
  onUpdate: (vars: { id: number } & Partial<Color>) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input
        type="color"
        value={row.hex}
        onChange={(e) => onUpdate({ id: row.id, hex: e.target.value })}
        style={{ width: 40, height: 36, border: "1px solid var(--color-divider)", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", padding: 2 }}
      />
      <CommitInput type="text" value={row.name} onCommit={(v) => onUpdate({ id: row.id, name: v })} style={{ maxWidth: 220 }} />
      <CommitInput
        type="number"
        min={0}
        step={500}
        value={row.extraPrice}
        onCommit={(v) => onUpdate({ id: row.id, extraPrice: Number(v) || 0 })}
        placeholder="Tambahan Rp"
        style={{ width: 130 }}
      />
      <button className="btn btn-secondary" style={{ padding: "8px 14px" }} onClick={onRemove}>
        Hapus
      </button>
    </div>
  );
}

function FinishRow({
  row,
  onUpdate,
  onRemove,
}: {
  row: FinishOption;
  onUpdate: (vars: { id: number } & Partial<FinishOption>) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <CommitInput type="text" value={row.label} onCommit={(v) => onUpdate({ id: row.id, label: v })} style={{ flex: 1, maxWidth: 260 }} />
      <CommitInput
        type="number"
        min={0}
        step={500}
        value={row.price}
        onCommit={(v) => onUpdate({ id: row.id, price: Number(v) || 0 })}
        placeholder="Tambahan Rp"
        style={{ width: 130 }}
      />
      <button className="btn btn-secondary" style={{ padding: "8px 14px" }} onClick={onRemove}>
        Hapus
      </button>
    </div>
  );
}
