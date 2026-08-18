// Parses uploaded .glb/.gltf and .3mf files into the same {geometry,
// volumeCm3, bboxMm, surfaceAreaMm2} shape src/lib/stl.ts produces for
// .stl. Both formats can contain a whole scene graph (multiple meshes,
// each with its own transform) rather than one flat mesh, so this walks
// every mesh, bakes its world transform into a copy of its geometry, and
// accumulates volume/area across all of them.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { type ParsedModel, meshMetrics } from "./geometryMetrics";

const gltfLoader = new GLTFLoader();
const threeMfLoader = new ThreeMFLoader();

function collectFromScene(root: THREE.Object3D): ParsedModel {
  root.updateMatrixWorld(true);

  // Meshes from a loaded scene can carry mismatched attribute sets (uv,
  // color, tangents, skin weights...), which mergeGeometries() rejects —
  // strip each one down to just position + normal, which is all the flat-
  // shaded, single-color preview material (see PartStage) actually uses.
  const displayGeometries: THREE.BufferGeometry[] = [];
  let volumeMm3 = 0;
  let surfaceAreaMm2 = 0;

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const src = obj.geometry;
    if (!src.attributes.position || src.attributes.position.count === 0) return;

    const world = src.clone();
    world.applyMatrix4(obj.matrixWorld);
    world.computeVertexNormals();

    const metrics = meshMetrics(world);
    volumeMm3 += metrics.volumeMm3;
    surfaceAreaMm2 += metrics.surfaceAreaMm2;

    // mergeGeometries() requires every input to be indexed or none of them
    // to be — normalize to non-indexed here so mixed-index scenes (some
    // meshes indexed, some not) still merge, and so dropping the index
    // below can't scramble indexed geometry into the wrong triangles.
    const displaySource = world.index ? world.toNonIndexed() : world;
    const display = new THREE.BufferGeometry();
    display.setAttribute("position", displaySource.getAttribute("position"));
    display.setAttribute("normal", displaySource.getAttribute("normal"));
    displayGeometries.push(display);
  });

  if (displayGeometries.length === 0 || volumeMm3 === 0) {
    throw new Error("Model tidak berisi geometri yang bisa dibaca.");
  }

  const geometry = displayGeometries.length === 1 ? displayGeometries[0] : mergeGeometries(displayGeometries, false);
  if (!geometry) {
    throw new Error("Gagal menggabungkan geometri model.");
  }
  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox!.getSize(size);

  return {
    geometry,
    volumeCm3: Math.max(0.05, volumeMm3 / 1000),
    bboxMm: [size.x, size.y, size.z],
    surfaceAreaMm2,
  };
}

// GLTFLoader.parse() auto-detects binary (.glb) vs JSON (.gltf) from the
// buffer's magic bytes — one call handles both. A .gltf that references
// external .bin/texture files by relative path won't resolve them (we only
// have the one uploaded file), but self-contained/embedded .gltf and any
// .glb work fully offline.
export async function parseGltfFile(file: File): Promise<ParsedModel> {
  const buffer = await file.arrayBuffer();
  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    gltfLoader.parse(buffer, "", resolve, reject);
  });
  return collectFromScene(gltf.scene);
}

// 3MF's default/near-universal unit is millimeter (three.js's own loader
// reads the model's declared <model unit="..."> but never actually applies
// it as a scale), so — like the .stl path — we treat its coordinates as mm
// without conversion.
export async function parse3mfFile(file: File): Promise<ParsedModel> {
  const buffer = await file.arrayBuffer();
  const object = threeMfLoader.parse(buffer);
  return collectFromScene(object);
}
