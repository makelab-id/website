import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { parse3mfFile, parseGltfFile } from "../../src/lib/modelFile";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("parseGltfFile", () => {
  it("computes volume/bbox/surface area from a flat mesh, exported round-trip as .glb", async () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20));
    const buffer = await new GLTFExporter().parseAsync(mesh, { binary: true });
    const file = new File([buffer as ArrayBuffer], "cube.glb", { type: "model/gltf-binary" });

    const { volumeCm3, bboxMm, surfaceAreaMm2 } = await parseGltfFile(file);

    expect(volumeCm3).toBeCloseTo(8, 5); // 20mm cube = 8000mm^3 = 8cm^3
    expect(bboxMm[0]).toBeCloseTo(20, 4);
    expect(bboxMm[1]).toBeCloseTo(20, 4);
    expect(bboxMm[2]).toBeCloseTo(20, 4);
    expect(surfaceAreaMm2).toBeCloseTo(2400, 4); // 6 * 20 * 20
  });

  it("bakes a parent node's transform into the measured geometry", async () => {
    // A 10mm cube inside a group scaled 2x should measure as a 20mm cube —
    // this only passes if world transforms are applied before measuring.
    const group = new THREE.Group();
    group.scale.setScalar(2);
    group.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10)));

    const buffer = await new GLTFExporter().parseAsync(group, { binary: true });
    const file = new File([buffer as ArrayBuffer], "scaled.glb", { type: "model/gltf-binary" });

    const { volumeCm3, bboxMm } = await parseGltfFile(file);

    expect(volumeCm3).toBeCloseTo(8, 5);
    expect(bboxMm[0]).toBeCloseTo(20, 3);
  });

  it("rejects a file with no meshes", async () => {
    const buffer = await new GLTFExporter().parseAsync(new THREE.Group(), { binary: true });
    const file = new File([buffer as ArrayBuffer], "empty.glb", { type: "model/gltf-binary" });
    await expect(parseGltfFile(file)).rejects.toThrow();
  });
});

// three's 3MFLoader has no matching exporter, so this fixture is a hand-
// built minimal package: a package-relationships part pointing at the model
// part, plus a <model> document describing one 20mm cube (the same cube
// used in tests/unit/stl.test.ts, for an easy cross-check). It's built with
// fflate.zipSync in a plain Node script (not at test time — vitest's jsdom
// environment resolves fflate through a browser build whose zipSync
// silently produces an empty archive there, a jsdom/Vite realm quirk
// unrelated to the real loader code) and checked in as a real, valid .3mf.
describe("parse3mfFile", () => {
  it("computes volume/bbox/surface area of a hand-built minimal 3MF cube", async () => {
    const bytes = readFileSync(path.join(__dirname, "../fixtures/cube.3mf"));
    const file = new File([bytes], "cube.3mf", { type: "model/3mf" });
    const { volumeCm3, bboxMm, surfaceAreaMm2 } = await parse3mfFile(file);

    expect(volumeCm3).toBeCloseTo(8, 5);
    expect(bboxMm[0]).toBeCloseTo(20, 5);
    expect(bboxMm[1]).toBeCloseTo(20, 5);
    expect(bboxMm[2]).toBeCloseTo(20, 5);
    expect(surfaceAreaMm2).toBeCloseTo(2400, 5);
  });
});
