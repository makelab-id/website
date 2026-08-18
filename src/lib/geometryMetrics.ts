// Shared by every real-mesh parser (src/lib/stl.ts, src/lib/modelFile.ts):
// the {geometry, volume, bbox, surface area} shape the pricing calculator
// needs, and the per-triangle math to derive volume/area from any
// BufferGeometry — independent of which file format produced it.
import * as THREE from "three";

export interface ParsedModel {
  geometry: THREE.BufferGeometry;
  volumeCm3: number;
  bboxMm: [number, number, number];
  // Real outer-surface area — pricing.ts uses this (× an assumed shell
  // thickness) to estimate how much of the part prints solid regardless of
  // infill %, instead of assuming the whole volume scales with infill.
  surfaceAreaMm2: number;
}

// One pass over every triangle computing both:
//  - signed-tetrahedron-sum volume (divergence theorem: sum of the signed
//    volume each triangle forms with the origin) — exact for a closed,
//    consistently-wound mesh, a fine ballpark otherwise, same as slicers use.
//  - surface area (sum of triangle areas via the cross-product magnitude).
// Returns the absolute volume so callers summing multiple independent
// sub-meshes (glTF nodes, 3MF objects) don't need to worry about winding
// direction differing between them.
export function meshMetrics(geometry: THREE.BufferGeometry): { volumeMm3: number; surfaceAreaMm2: number } {
  const pos = geometry.attributes.position;
  const index = geometry.index;
  const triCount = index ? index.count / 3 : pos.count / 3;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();
  let volume = 0;
  let area = 0;

  for (let i = 0; i < triCount; i++) {
    const i0 = index ? index.getX(i * 3) : i * 3;
    const i1 = index ? index.getX(i * 3 + 1) : i * 3 + 1;
    const i2 = index ? index.getX(i * 3 + 2) : i * 3 + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);

    cross.crossVectors(b, c);
    volume += a.dot(cross) / 6;

    ab.subVectors(b, a);
    ac.subVectors(c, a);
    area += cross.crossVectors(ab, ac).length() / 2;
  }

  return { volumeMm3: Math.abs(volume), surfaceAreaMm2: area };
}
