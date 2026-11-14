import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AssemblyMotionState } from "./AssemblyScene3D";

const rng = (s: number) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

interface Props {
  motionRef: React.MutableRefObject<AssemblyMotionState>;
  progressKey: keyof AssemblyMotionState;
  children: React.ReactNode;
  count?: number;
  radius?: number;
  startY?: number;
  landY?: number;
  landJitter?: number;
  delaySpread?: number;
  dur?: number;
  fadeFrom?: number;
  spin?: number;
  flutter?: number;
  seed?: number;
  palette?: string[];
}

export function FallingBits({
  motionRef,
  progressKey,
  children,
  count = 900,
  radius = 0.1,
  startY = 0.5,
  landY = 0.085,
  landJitter = 0.012,
  delaySpread = 0.55,
  dur = 0.35,
  fadeFrom = 0.88,
  spin = 10,
  flutter = 0.01,
  seed = 1,
  palette,
}: Props) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lastP = useRef(-1);

  useEffect(() => {
    const m = ref.current;
    if (!m || !palette || palette.length === 0) return;
    const r = rng(seed * 7331);
    const colors = palette.map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      const col = colors[Math.floor(r() * colors.length)];
      m.setColorAt(i, col);
    }
    if (m.instanceColor) {
      m.instanceColor.needsUpdate = true;
    }
  }, [count, palette, seed]);

  const d = useMemo(() => {
    const r = rng(seed * 9973);
    return Array.from({ length: count }, () => {
      const a = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * radius;
      return {
        lx: Math.cos(a) * rad,
        lz: Math.sin(a) * rad,
        dx: (r() - 0.5) * 0.05,
        dz: (r() - 0.5) * 0.05,
        sy: startY + r() * 0.15,
        ly: landY + r() * landJitter,
        delay: Math.pow(r(), 0.8) * delaySpread,
        r0: [r() * 6, r() * 6, r() * 6],
        w: [(r() - 0.5) * spin, (r() - 0.5) * spin, (r() - 0.5) * spin],
        ph: r() * 6.28,
        bounce: 0.006 + r() * 0.01,
      };
    });
  }, [count, radius, startY, landY, landJitter, delaySpread, spin, seed]);

  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const p = motionRef.current[progressKey] as number;
    if (Math.abs(p - lastP.current) < 1e-4) return;
    lastP.current = p;
    const fade = 1 - smooth(fadeFrom, 1, p);

    for (let i = 0; i < count; i++) {
      const g = d[i];
      const tt = (p - g.delay) / dur;
      if (tt <= 0 || fade <= 0) {
        dummy.scale.setScalar(0);
      } else {
        const u = Math.min(tt, 1);
        const fall = u * u;
        const sway = Math.sin(u * 14 + g.ph) * flutter * (1 - u);
        let y = g.sy + (g.ly - g.sy) * fall;
        if (tt > 1) {
          const b = Math.min((tt - 1) / 0.3, 1);
          y += g.bounce * Math.sin(Math.PI * b) * (1 - b);
        }
        dummy.position.set(
          g.lx + g.dx * (1 - fall) + sway,
          y,
          g.lz + g.dz * (1 - fall) - sway * 0.6
        );
        const s = u * (1 - 0.6 * u);
        dummy.rotation.set(
          g.r0[0] + g.w[0] * s,
          g.r0[1] + g.w[1] * s,
          g.r0[2] + g.w[2] * s
        );
        dummy.scale.setScalar(fade);
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, count]}
      frustumCulled={false}
      castShadow
    >
      {children}
    </instancedMesh>
  );
}
