// Ported from the original part-stage.js custom element: a lightweight,
// rotating placeholder preview of a printed part (a generic mounting
// bracket, or a torus knot for variety), colored by the selected filament.
// Uses the `three` npm package bundled by Vite instead of the source's
// runtime esm.sh CDN import, for offline/production reliability.
import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface PartStageProps {
  color: string;
  shape?: "bracket" | "knot";
  spin?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function PartStage({ color, shape = "bracket", spin = true, className, style }: PartStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Read inside the render loop instead of restarting the whole scene on
  // every color change — the original custom element couldn't react to
  // attribute changes at all (no observedAttributes), so this also fixes
  // a live-preview gap the source had.
  const colorRef = useRef(color);
  colorRef.current = color;
  const spinRef = useRef(spin);
  spinRef.current = spin;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block;cursor:grab;touch-action:none";
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(3.2, 2.2, 4.2);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.HemisphereLight(0xfff4e2, 0x6b6250, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(4, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffd9b0, 0.6);
    rim.position.set(-5, 1, -4);
    scene.add(rim);

    const material = new THREE.MeshStandardMaterial({
      color: colorRef.current,
      roughness: 0.62,
      metalness: 0.05,
      flatShading: true,
    });
    const group = new THREE.Group();
    if (shape === "knot") {
      group.add(new THREE.Mesh(new THREE.TorusKnotGeometry(1.05, 0.34, 120, 12), material));
    } else {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.34, 1.6), material);
      group.add(plate);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.5, 1.6), material);
      wall.position.set(-1.08, 0.75, 0);
      group.add(wall);
      const gusset = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.5, 3), material);
      gusset.rotation.set(Math.PI / 2, 0, Math.PI / 4);
      gusset.position.set(-0.5, 0.42, 0);
      group.add(gusset);
      for (const [x, z] of [
        [0.75, 0.45],
        [0.75, -0.45],
      ] as const) {
        const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 24), material);
        boss.position.set(x, 0.16, z);
        group.add(boss);
      }
      group.position.y = -0.3;
    }
    scene.add(group);

    let drag: { x: number; y: number } | null = null;
    let spinX = 0.28;
    let spinY = 0;

    const onPointerDown = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onPointerUp = () => {
      drag = null;
      canvas.style.cursor = "grab";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag) return;
      spinY += (e.clientX - drag.x) * 0.01;
      spinX += (e.clientY - drag.y) * 0.008;
      spinX = Math.max(-1.1, Math.min(1.3, spinX));
      drag = { x: e.clientX, y: e.clientY };
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointermove", onPointerMove);

    const resize = () => {
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    let raf = 0;
    let t = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.006;
      material.color.set(colorRef.current);
      if (spinRef.current && !drag) spinY += 0.006;
      group.rotation.y = spinY;
      group.rotation.x = spinX * 0.35 + Math.sin(t) * 0.03;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointermove", onPointerMove);
      renderer.dispose();
      material.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
      container.removeChild(canvas);
    };
    // Only shape changes require rebuilding the scene; color/spin are read
    // live from refs every frame instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", ...style }}
    />
  );
}
