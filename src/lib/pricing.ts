// Ported from Makelab.dc.html's Component class (calc/rupiah/round500/
// hoursText/wa/fileFrom) — the instant price estimator. Parameterized by
// the DB rows fetched via lib/api.ts instead of the original's hardcoded
// DEFAULT_* arrays, but the arithmetic is unchanged.
import type { Color, InfillOption, Material, PrintModel, QualityOption, Settings } from "./types";

export type Finish = "none" | "sand" | "paint";
export type Delivery = "reguler" | "express";

export interface FakeFile {
  name: string;
  kb: number;
  vol: number; // cm^3, heuristic only
  bbox: [number, number, number]; // mm
}

// The site never parses real mesh geometry — it estimates a plausible
// volume from the uploaded file's byte size, which is enough to give a
// same-ballpark price before the shop confirms the real one on WhatsApp.
export function fileFrom(name: string, kb: number): FakeFile {
  const vol = Math.max(2.5, Math.min(140, kb / 42));
  const s = Math.cbrt(vol) * 10;
  return { name, kb, vol, bbox: [s * 1.6, s * 0.95, s * 0.72] };
}

export const SAMPLE_FILE = { name: "bracket_tamiya_v3.stl", kb: 2840 };

export function rupiah(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function round500(n: number): number {
  return Math.round(n / 500) * 500;
}

export function hoursText(hours: number): string {
  const totalMinutes = Math.max(1, Math.round(hours * 60));
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return hh ? `${hh} jam ${mm} menit` : `${mm} menit`;
}

export function sanitizePhoneNumber(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

export function waLink(phoneNumber: string, text: string): string {
  return `https://wa.me/${sanitizePhoneNumber(phoneNumber)}?text=${encodeURIComponent(text)}`;
}

export interface CalcInput {
  file: FakeFile | null;
  scale: number; // percent, e.g. 100
  qty: number;
  finish: Finish;
  delivery: Delivery;
  material: Material;
  quality: QualityOption;
  infill: InfillOption;
  color: Color;
  settings: Settings;
}

export interface CalcResult {
  vol: number;
  grams: number;
  hours: number;
  matCost: number;
  timeCost: number;
  finishCost: number;
  colorCost: number;
  setup: number;
  total: number;
}

const FINISH_COST_FIELD = {
  none: "finishCostNone",
  sand: "finishCostSand",
  paint: "finishCostPaint",
} as const satisfies Record<Finish, keyof Settings>;

export function calc(input: CalcInput): CalcResult {
  const { file, scale, qty, finish, delivery, material, quality, infill, color, settings } = input;

  // No file yet: fall back to a mid-sized part (~18 cm^3) so the estimate
  // panel shows a plausible number instead of zero before anything's picked.
  const vol = (file ? file.vol : 18) * Math.pow(scale / 100, 3);
  const fill = infill.fillFraction;
  const grams = vol * fill * material.density;
  const hours = ((vol * fill) / 5.5) * quality.timeMultiplier;

  const matCostEach = grams * material.ratePerGram;
  const timeCostEach = hours * settings.machineRatePerHour;
  const finishCost = settings[FINISH_COST_FIELD[finish]] * qty;
  const colorCost = (color.extraPrice || 0) * qty;
  const setup = settings.setupFee;

  let total = (matCostEach + timeCostEach) * qty + finishCost + colorCost + setup;
  if (qty >= settings.bulkQtyThreshold) total *= 1 - settings.bulkDiscountPct;
  if (delivery === "express") total *= 1 + settings.expressMarkupPct;

  return {
    vol,
    grams,
    hours,
    matCost: matCostEach * qty,
    timeCost: timeCostEach * qty,
    finishCost,
    colorCost,
    setup,
    total,
  };
}

export function priceRange(total: number): { low: number; high: number } {
  return { low: round500(total * 0.9), high: round500(total * 1.12) };
}

const FINISH_LABEL: Record<Finish, string> = {
  none: "Apa adanya",
  sand: "Amplas halus",
  paint: "Amplas + cat",
};

export interface QuoteMessageInput {
  file: FakeFile | null;
  materialName: string;
  colorName: string;
  qualityLabel: string;
  infillPercent: number;
  scale: number;
  qty: number;
  finish: Finish;
  delivery: Delivery;
  total: number;
}

export function buildQuoteMessage(input: QuoteMessageInput): string {
  const { low, high } = priceRange(input.total);
  const specLines = [
    `Material: ${input.materialName} — ${input.colorName}`,
    `Kualitas: ${input.qualityLabel} | Infill ${input.infillPercent}% | Skala ${input.scale}%`,
    `Jumlah: ${input.qty} pcs`,
    `Finishing: ${FINISH_LABEL[input.finish]}`,
    `Pengerjaan: ${input.delivery === "express" ? "Express 24 jam" : "Reguler 3–5 hari"}`,
  ].join("\n");

  return (
    "Halo Makelab! Saya mau order cetak 3D.\n\n" +
    `File: ${input.file ? input.file.name : "(akan saya kirim)"}\n${specLines}` +
    `\n\nEstimasi dari website: ${rupiah(low)} – ${rupiah(high)}` +
    "\n\nMohon dicek filenya dan konfirmasi harga final ya. Terima kasih!"
  );
}

export function buildGenericInquiryMessage(): string {
  return "Halo Makelab! Saya mau tanya soal jasa cetak 3D.";
}

export function buildCatalogOrderMessage(
  model: Pick<PrintModel, "name" | "category" | "sizeLabel" | "materialLabel" | "basePrice">,
): string {
  return (
    "Halo Makelab! Saya mau order dari katalog.\n\n" +
    `Model: ${model.name} (${model.category})\n` +
    `Ukuran: ${model.sizeLabel}\n` +
    `Material: ${model.materialLabel}\n` +
    "Jumlah: 1 pcs\n\n" +
    `Harga di website mulai ${rupiah(model.basePrice)}. Mohon konfirmasi harga final dan estimasi selesainya. Terima kasih!`
  );
}
