import { describe, expect, it } from "vitest";
import { parseStlFile } from "../../src/lib/stl";

// A 20mm axis-aligned cube, well-formed and closed (12 triangles, 2 per face).
const CUBE_STL = `solid cube
facet normal 0 0 -1
  outer loop
    vertex 0 0 0
    vertex 0 20 0
    vertex 20 20 0
  endloop
endfacet
facet normal 0 0 -1
  outer loop
    vertex 0 0 0
    vertex 20 20 0
    vertex 20 0 0
  endloop
endfacet
facet normal 0 0 1
  outer loop
    vertex 0 0 20
    vertex 20 20 20
    vertex 0 20 20
  endloop
endfacet
facet normal 0 0 1
  outer loop
    vertex 0 0 20
    vertex 20 0 20
    vertex 20 20 20
  endloop
endfacet
facet normal 0 -1 0
  outer loop
    vertex 0 0 0
    vertex 20 0 0
    vertex 20 0 20
  endloop
endfacet
facet normal 0 -1 0
  outer loop
    vertex 0 0 0
    vertex 20 0 20
    vertex 0 0 20
  endloop
endfacet
facet normal 0 1 0
  outer loop
    vertex 0 20 0
    vertex 0 20 20
    vertex 20 20 20
  endloop
endfacet
facet normal 0 1 0
  outer loop
    vertex 0 20 0
    vertex 20 20 20
    vertex 20 20 0
  endloop
endfacet
facet normal -1 0 0
  outer loop
    vertex 0 0 0
    vertex 0 20 20
    vertex 0 20 0
  endloop
endfacet
facet normal -1 0 0
  outer loop
    vertex 0 0 0
    vertex 0 0 20
    vertex 0 20 20
  endloop
endfacet
facet normal 1 0 0
  outer loop
    vertex 20 0 0
    vertex 20 20 0
    vertex 20 20 20
  endloop
endfacet
facet normal 1 0 0
  outer loop
    vertex 20 0 0
    vertex 20 20 20
    vertex 20 0 20
  endloop
endfacet
endsolid cube
`;

describe("parseStlFile", () => {
  it("computes the real bounding box, volume, and surface area of an ASCII STL mesh", async () => {
    const file = new File([CUBE_STL], "cube.stl", { type: "model/stl" });
    const { geometry, volumeCm3, bboxMm, surfaceAreaMm2 } = await parseStlFile(file);

    expect(bboxMm[0]).toBeCloseTo(20, 5);
    expect(bboxMm[1]).toBeCloseTo(20, 5);
    expect(bboxMm[2]).toBeCloseTo(20, 5);
    // 20mm cube = 8000 mm^3 = 8 cm^3.
    expect(volumeCm3).toBeCloseTo(8, 5);
    // 6 faces * 20mm * 20mm.
    expect(surfaceAreaMm2).toBeCloseTo(2400, 5);
    expect(geometry.attributes.position.count).toBe(36); // 12 triangles, non-indexed
  });

  it("rejects a file with no triangles", async () => {
    const file = new File(["solid empty\nendsolid empty\n"], "empty.stl", { type: "model/stl" });
    await expect(parseStlFile(file)).rejects.toThrow();
  });
});
