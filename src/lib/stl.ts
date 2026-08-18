// Parses a user-uploaded .stl file into real Three.js geometry, plus the
// bounding box and volume the pricing calculator needs — replacing the
// byte-size heuristic in pricing.ts's fileFrom() for the formats we can
// actually read client-side (see also src/lib/modelFile.ts for .glb/.gltf/.3mf).
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { type ParsedModel, meshMetrics } from "./geometryMetrics";

export type { ParsedModel } from "./geometryMetrics";

const loader = new STLLoader();

export async function parseStlFile(file: File): Promise<ParsedModel> {
  const buffer = await file.arrayBuffer();
  const geometry = loader.parse(buffer);

  if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
    throw new Error("File STL kosong atau tidak berisi geometri.");
  }

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  const size = new THREE.Vector3();
  geometry.boundingBox!.getSize(size);

  const { volumeMm3, surfaceAreaMm2 } = meshMetrics(geometry);

  return {
    geometry,
    volumeCm3: Math.max(0.05, volumeMm3 / 1000),
    bboxMm: [size.x, size.y, size.z],
    surfaceAreaMm2,
  };
}
