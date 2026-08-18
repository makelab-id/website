import { describe, expect, it } from "vitest";
import type { Color, FinishOption, InfillOption, Material, QualityOption, Settings } from "../../src/lib/types";
import {
  type FakeFile,
  buildCatalogOrderMessage,
  buildGenericInquiryMessage,
  buildQuoteMessage,
  calc,
  fileFrom,
  hoursText,
  priceRange,
  round500,
  rupiah,
  sanitizePhoneNumber,
  waLink,
} from "../../src/lib/pricing";

const PLA: Material = { id: 1, name: "PLA", ratePerGram: 1800, density: 1.24, comingSoon: false, sortOrder: 0 };

const QUALITY_STANDARD: QualityOption = { id: 2, label: "0,20 mm — standar", timeMultiplier: 1, isDefault: true, sortOrder: 1 };
const QUALITY_FINE: QualityOption = { id: 3, label: "0,12 mm — halus", timeMultiplier: 1.6, isDefault: false, sortOrder: 2 };

const INFILL_UMUM: InfillOption = { id: 2, label: "25% — umum", percent: 25, fillFraction: 0.5, isDefault: true, sortOrder: 1 };

const BLACK: Color = { id: 1, name: "Hitam", hex: "#3a3632", extraPrice: 0, sortOrder: 0 };
const PREMIUM: Color = { id: 6, name: "Gold", hex: "#d4af37", extraPrice: 5000, sortOrder: 5 };

const FINISH_NONE: FinishOption = { id: 1, label: "Apa adanya", price: 0, sortOrder: 0 };
const FINISH_SAND: FinishOption = { id: 2, label: "Amplas halus", price: 15000, sortOrder: 1 };

const SETTINGS: Settings = {
  id: 1,
  whatsappNumber: "+62 812-3456-7890",
  machineRatePerHour: 7000,
  setupFee: 10000,
  expressMarkupPct: 0.4,
  bulkQtyThreshold: 5,
  bulkDiscountPct: 0.1,
  shellThicknessMm: 1.2,
};

// A 20mm cube: round numbers make the shell-vs-infill math easy to verify
// by hand. vol = 8 cm^3 = 8000 mm^3, surfaceAreaMm2 = 6 faces * 400mm^2.
const CUBE_FILE: FakeFile = { name: "cube.stl", kb: 500, vol: 8, bbox: [20, 20, 20], surfaceAreaMm2: 2400 };

describe("fileFrom", () => {
  it("derives a plausible volume from file size and clamps it to [2.5, 140] cm^3", () => {
    expect(fileFrom("tiny.stl", 1).vol).toBe(2.5);
    expect(fileFrom("huge.stl", 1_000_000).vol).toBe(140);
    expect(fileFrom("mid.stl", 2840).vol).toBeCloseTo(2840 / 42, 5);
  });

  it("derives a bounding box proportional to the cube root of the volume", () => {
    const f = fileFrom("part.stl", 2100); // vol = 50
    const s = Math.cbrt(50) * 10;
    expect(f.bbox).toEqual([s * 1.6, s * 0.95, s * 0.72]);
  });

  it("derives a box surface area from that same bounding box", () => {
    const f = fileFrom("part.stl", 2100);
    const [w, d, h] = f.bbox;
    expect(f.surfaceAreaMm2).toBeCloseTo(2 * (w * d + w * h + d * h), 6);
  });
});

describe("rupiah", () => {
  it("formats with the Rp prefix and Indonesian thousands separators", () => {
    expect(rupiah(1800)).toBe("Rp 1.800");
    expect(rupiah(1_250_000)).toBe("Rp 1.250.000");
  });

  it("rounds to the nearest whole rupiah", () => {
    expect(rupiah(999.6)).toBe("Rp 1.000");
    expect(rupiah(999.4)).toBe("Rp 999");
  });
});

describe("round500", () => {
  it("rounds to the nearest 500", () => {
    expect(round500(25100)).toBe(25000);
    expect(round500(25300)).toBe(25500);
    expect(round500(0)).toBe(0);
  });
});

describe("hoursText", () => {
  it("shows minutes only under an hour", () => {
    expect(hoursText(0.58)).toBe("35 menit");
  });

  it("shows hours and minutes over an hour", () => {
    expect(hoursText(1 + 20 / 60)).toBe("1 jam 20 menit");
  });

  it("floors at 1 minute so a near-zero estimate never reads as 0 menit", () => {
    expect(hoursText(0)).toBe("1 menit");
  });
});

describe("sanitizePhoneNumber / waLink", () => {
  it("strips everything but digits", () => {
    expect(sanitizePhoneNumber("+62 812-3456-7890")).toBe("6281234567890");
  });

  it("builds a wa.me link with the message URL-encoded", () => {
    const link = waLink("+62 812-3456-7890", "Halo Makelab!");
    expect(link).toBe("https://wa.me/6281234567890?text=Halo%20Makelab!");
  });
});

describe("calc", () => {
  const base = {
    file: null,
    scale: 100,
    qty: 1,
    finish: FINISH_NONE,
    delivery: "reguler" as const,
    material: PLA,
    quality: QUALITY_STANDARD,
    infill: INFILL_UMUM,
    color: BLACK,
    settings: SETTINGS,
  };

  it("falls back to an 18 cm^3 reference volume when no file has been picked", () => {
    const r = calc(base);
    expect(r.vol).toBe(18);
  });

  it("scales volume by the cube of the scale percentage", () => {
    const r = calc({ ...base, scale: 50 });
    expect(r.vol).toBeCloseTo(18 * 0.5 ** 3, 6);
  });

  it("uses the uploaded file's volume instead of the fallback once present", () => {
    const file = fileFrom("part.stl", 2100); // vol = 50
    const r = calc({ ...base, file });
    expect(r.vol).toBe(50);
  });

  it("weighs the always-solid shell (surface area * shell thickness) at full density, and only the interior at the infill fraction", () => {
    const r = calc({ ...base, file: CUBE_FILE });
    // shell = 2400mm^2 * 1.2mm = 2880mm^3; interior = 8000 - 2880 = 5120mm^3
    // at 50% fill = 2560mm^3; effective = 5440mm^3 = 5.44cm^3.
    const expectedGrams = 5.44 * PLA.density;
    expect(r.grams).toBeCloseTo(expectedGrams, 6);
    // The naive (pre-shell-model) formula would have under-counted this.
    expect(r.grams).toBeGreaterThan(CUBE_FILE.vol * INFILL_UMUM.fillFraction * PLA.density);
  });

  it("weighs a fully solid part (100% infill) at its full volume regardless of shell thickness", () => {
    const solidInfill: InfillOption = { ...INFILL_UMUM, fillFraction: 1 };
    const r = calc({ ...base, file: CUBE_FILE, infill: solidInfill });
    expect(r.grams).toBeCloseTo(CUBE_FILE.vol * PLA.density, 6);
  });

  it("caps the shell volume at the part's own volume so a tiny/thin part never exceeds 100% solid weight", () => {
    const thickShell: Settings = { ...SETTINGS, shellThicknessMm: 100 }; // absurdly thick on purpose
    const r = calc({ ...base, file: CUBE_FILE, settings: thickShell });
    expect(r.grams).toBeCloseTo(CUBE_FILE.vol * PLA.density, 6);
  });

  it("reduces to volume * infill fraction * density when the shell is disabled (thickness 0)", () => {
    const noShell: Settings = { ...SETTINGS, shellThicknessMm: 0 };
    const r = calc({ ...base, file: CUBE_FILE, settings: noShell });
    expect(r.grams).toBeCloseTo(CUBE_FILE.vol * INFILL_UMUM.fillFraction * PLA.density, 6);
  });

  it("derives machine hours from the same shell-aware effective volume, scaled by the quality time multiplier", () => {
    const standard = calc({ ...base, file: CUBE_FILE });
    const fine = calc({ ...base, file: CUBE_FILE, quality: QUALITY_FINE });
    expect(standard.hours).toBeCloseTo(5.44 / 5.5, 6);
    expect(fine.hours).toBeCloseTo(standard.hours * 1.6, 6);
  });

  it("multiplies per-unit material and machine cost by quantity", () => {
    const one = calc(base);
    const five = calc({ ...base, qty: 5, delivery: "reguler" });
    // qty 5 hits the bulk discount, so compare against qty 4 to isolate the linear scaling.
    const four = calc({ ...base, qty: 4 });
    expect(four.matCost).toBeCloseTo(one.matCost * 4, 6);
    expect(four.timeCost).toBeCloseTo(one.timeCost * 4, 6);
    expect(five.matCost).toBeCloseTo(one.matCost * 5, 6);
  });

  it("charges the selected finish option's price, scaled by quantity", () => {
    const sanded = calc({ ...base, finish: FINISH_SAND, qty: 3 });
    expect(sanded.finishCost).toBe(FINISH_SAND.price * 3);
  });

  it("charges the selected color's extra price, scaled by quantity, and nothing for a free color", () => {
    const free = calc({ ...base, color: BLACK, qty: 3 });
    const premium = calc({ ...base, color: PREMIUM, qty: 3 });
    expect(free.colorCost).toBe(0);
    expect(premium.colorCost).toBe(PREMIUM.extraPrice * 3);
  });

  it("always includes the flat setup fee", () => {
    expect(calc(base).setup).toBe(SETTINGS.setupFee);
  });

  it("applies the bulk discount once quantity reaches the threshold, not before", () => {
    const belowQty = SETTINGS.bulkQtyThreshold - 1;
    const below = calc({ ...base, qty: belowQty });
    const at = calc({ ...base, qty: SETTINGS.bulkQtyThreshold });

    // matCost/timeCost scale linearly with qty (asserted above), so the
    // per-unit rate can be recovered from a qty that's too low to trigger
    // the discount, then used to predict the undiscounted total at the
    // threshold — independent of the material/quality/infill constants.
    const perUnitCost = (below.matCost + below.timeCost) / belowQty;
    const atTotalWithoutDiscount = perUnitCost * SETTINGS.bulkQtyThreshold + at.setup;

    expect(at.total).toBeLessThan(atTotalWithoutDiscount);
    expect(at.total).toBeCloseTo(atTotalWithoutDiscount * (1 - SETTINGS.bulkDiscountPct), 6);
  });

  it("applies the express markup on top of (not instead of) the bulk discount", () => {
    const reguler = calc({ ...base, qty: SETTINGS.bulkQtyThreshold, delivery: "reguler" });
    const express = calc({ ...base, qty: SETTINGS.bulkQtyThreshold, delivery: "express" });
    expect(express.total).toBeCloseTo(reguler.total * (1 + SETTINGS.expressMarkupPct), 6);
  });

  it("never applies the express markup for regular delivery", () => {
    const r = calc({ ...base, delivery: "reguler" });
    const withoutMarkup = calc({ ...base, delivery: "reguler" });
    expect(r.total).toBe(withoutMarkup.total);
  });
});

describe("priceRange", () => {
  it("returns a low/high band rounded to the nearest 500", () => {
    const { low, high } = priceRange(100000);
    expect(low).toBe(round500(90000));
    expect(high).toBe(round500(112000));
    expect(low).toBeLessThan(high);
  });
});

describe("buildQuoteMessage", () => {
  it("includes the file name, specs, and formatted price range", () => {
    const msg = buildQuoteMessage({
      file: fileFrom("bracket.stl", 2840),
      materialName: "PLA",
      colorName: "Hitam",
      qualityLabel: "0,20 mm — standar",
      infillPercent: 25,
      scale: 100,
      qty: 2,
      finishLabel: "Amplas halus",
      delivery: "express",
      total: 100000,
    });
    expect(msg).toContain("bracket.stl");
    expect(msg).toContain("Material: PLA — Hitam");
    expect(msg).toContain("Infill 25%");
    expect(msg).toContain("Jumlah: 2 pcs");
    expect(msg).toContain("Amplas halus");
    expect(msg).toContain("Express 24 jam");
    expect(msg).toContain(rupiah(priceRange(100000).low));
  });

  it("prompts to send the file later when none has been picked yet", () => {
    const msg = buildQuoteMessage({
      file: null,
      materialName: "PLA",
      colorName: "Hitam",
      qualityLabel: "0,20 mm — standar",
      infillPercent: 25,
      scale: 100,
      qty: 1,
      finishLabel: "Apa adanya",
      delivery: "reguler",
      total: 50000,
    });
    expect(msg).toContain("(akan saya kirim)");
    expect(msg).toContain("Reguler 3–5 hari");
  });
});

describe("buildGenericInquiryMessage / buildCatalogOrderMessage", () => {
  it("returns the fixed generic inquiry text", () => {
    expect(buildGenericInquiryMessage()).toBe("Halo Makelab! Saya mau tanya soal jasa cetak 3D.");
  });

  it("includes the model's catalog details and formatted base price", () => {
    const msg = buildCatalogOrderMessage({
      name: "Servo mount 1/10",
      category: "RC Toys",
      sizeLabel: "58 × 38 × 24 mm",
      materialLabel: "PETG / ABS",
      basePrice: 78000,
    });
    expect(msg).toContain("Servo mount 1/10 (RC Toys)");
    expect(msg).toContain("58 × 38 × 24 mm");
    expect(msg).toContain("PETG / ABS");
    expect(msg).toContain(rupiah(78000));
  });
});
