// Idempotent seed: inserts the original Makelab.dc.html DEFAULT_* data into
// each table only if that table is still empty. Safe to run on every deploy.
import { db } from "./client.js";
import { materials, colors, qualityOptions, infillOptions, models, settings } from "./schema.js";

const DEFAULT_MATERIALS = [
  { name: "PLA", ratePerGram: 1800, density: 1.24, comingSoon: false, sortOrder: 0 },
  { name: "PETG", ratePerGram: 2400, density: 1.27, comingSoon: false, sortOrder: 1 },
  { name: "ABS", ratePerGram: 2600, density: 1.04, comingSoon: false, sortOrder: 2 },
  { name: "Resin 8K", ratePerGram: 4500, density: 1.1, comingSoon: false, sortOrder: 3 },
];

const DEFAULT_COLORS = [
  { name: "Hitam", hex: "#3a3632", extraPrice: 0, sortOrder: 0 },
  { name: "Putih", hex: "#e6ddcd", extraPrice: 0, sortOrder: 1 },
  { name: "Terracotta", hex: "#c67139", extraPrice: 0, sortOrder: 2 },
  { name: "Sage", hex: "#7a8a5e", extraPrice: 0, sortOrder: 3 },
  { name: "Abu", hex: "#82796a", extraPrice: 0, sortOrder: 4 },
];

const DEFAULT_QUALITY = [
  { label: "0,28 mm — cepat", timeMultiplier: 0.75, isDefault: false, sortOrder: 0 },
  { label: "0,20 mm — standar", timeMultiplier: 1, isDefault: true, sortOrder: 1 },
  { label: "0,12 mm — halus", timeMultiplier: 1.6, isDefault: false, sortOrder: 2 },
];

const DEFAULT_INFILL = [
  { label: "15% — display", percent: 15, fillFraction: 0.4, isDefault: false, sortOrder: 0 },
  { label: "25% — umum", percent: 25, fillFraction: 0.5, isDefault: true, sortOrder: 1 },
  { label: "50% — kuat", percent: 50, fillFraction: 0.68, isDefault: false, sortOrder: 2 },
];

const DEFAULT_MODELS = [
  {
    slot: "mk-m1", category: "Tamiya", name: "Mini 4WD roller mount",
    description: "Dudukan roller sisi untuk chassis MS/AR, toleransi sudah disesuaikan untuk PLA.",
    sizeLabel: "48 × 22 × 14 mm", materialLabel: "PLA / PETG", basePrice: 38000, sortOrder: 0,
  },
  {
    slot: "mk-m2", category: "Tamiya", name: "Front bumper guard",
    description: "Bumper depan ringan dengan rib penguat, tahan benturan trek.",
    sizeLabel: "62 × 30 × 18 mm", materialLabel: "PETG", basePrice: 52000, sortOrder: 1,
  },
  {
    slot: "mk-m3", category: "Tamiya", name: "Battery terminal jig",
    description: "Jig pemasangan terminal supaya kontak baterai rapat dan rapi.",
    sizeLabel: "40 × 26 × 20 mm", materialLabel: "PLA", basePrice: 34000, sortOrder: 2,
  },
  {
    slot: "mk-m4", category: "RC Toys", name: "Servo mount 1/10",
    description: "Mount servo standar untuk crawler 1/10, lubang baut M3.",
    sizeLabel: "58 × 38 × 24 mm", materialLabel: "PETG / ABS", basePrice: 78000, sortOrder: 3,
  },
  {
    slot: "mk-m5", category: "RC Toys", name: "Body post riser set",
    description: "Set peninggi bodi 4 pcs, bisa dipesan per tinggi 5–20 mm.",
    sizeLabel: "4 × 45 mm", materialLabel: "PETG", basePrice: 65000, sortOrder: 4,
  },
  {
    slot: "mk-m6", category: "RC Toys", name: "Snorkel & light bar",
    description: "Aksesori bodi crawler, siap diamplas dan dicat.",
    sizeLabel: "110 × 40 × 30 mm", materialLabel: "PLA", basePrice: 96000, sortOrder: 5,
  },
  {
    slot: "mk-m7", category: "Airsoft", name: "Picatinny rail cover",
    description: "Cover rail 4 slot, permukaan bertekstur agar tidak licin.",
    sizeLabel: "85 × 22 × 12 mm", materialLabel: "PETG", basePrice: 58000, sortOrder: 6,
  },
  {
    slot: "mk-m8", category: "Airsoft", name: "Magwell grip adapter",
    description: "Adapter grip magwell, dicetak infill 50% untuk kekuatan.",
    sizeLabel: "92 × 55 × 34 mm", materialLabel: "PETG / ABS", basePrice: 128000, sortOrder: 7,
  },
  {
    slot: "mk-m9", category: "Airsoft", name: "Camera mount helm",
    description: "Mount kamera aksi untuk helm FAST, dengan breakaway plate.",
    sizeLabel: "76 × 48 × 28 mm", materialLabel: "PETG", basePrice: 112000, sortOrder: 8,
  },
].map((m) => ({ ...m, active: true }));

const DEFAULT_SETTINGS = {
  whatsappNumber: "6281234567890",
  machineRatePerHour: 7000,
  setupFee: 10000,
  expressMarkupPct: 0.4,
  bulkQtyThreshold: 5,
  bulkDiscountPct: 0.1,
  finishCostNone: 0,
  finishCostSand: 15000,
  finishCostPaint: 55000,
};

export async function seed() {
  if ((await db.select().from(materials)).length === 0) {
    await db.insert(materials).values(DEFAULT_MATERIALS);
    console.log(`Seeded ${DEFAULT_MATERIALS.length} materials.`);
  }

  if ((await db.select().from(colors)).length === 0) {
    await db.insert(colors).values(DEFAULT_COLORS);
    console.log(`Seeded ${DEFAULT_COLORS.length} colors.`);
  }

  if ((await db.select().from(qualityOptions)).length === 0) {
    await db.insert(qualityOptions).values(DEFAULT_QUALITY);
    console.log(`Seeded ${DEFAULT_QUALITY.length} quality options.`);
  }

  if ((await db.select().from(infillOptions)).length === 0) {
    await db.insert(infillOptions).values(DEFAULT_INFILL);
    console.log(`Seeded ${DEFAULT_INFILL.length} infill options.`);
  }

  if ((await db.select().from(models)).length === 0) {
    await db.insert(models).values(DEFAULT_MODELS);
    console.log(`Seeded ${DEFAULT_MODELS.length} catalog models.`);
  }

  if ((await db.select().from(settings)).length === 0) {
    await db.insert(settings).values(DEFAULT_SETTINGS);
    console.log("Seeded settings.");
  }

  console.log("Seed complete.");
}

// Only auto-run when executed directly (`tsx db/seed.ts`) — importing this
// module from tests to seed a temp database must not also exit the process.
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seed().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
