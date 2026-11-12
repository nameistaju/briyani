"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SteamParticlesProps {
  /** Shared reactive ref populated by GSAP ScrollTrigger (`0` hidden .. `1` full steam) */
  intensityRef?: React.MutableRefObject<number>;
  baseOpacity?: number;
  position?: [number, number, number];
  scale?: number;
  reducedMotion?: boolean;
}

interface PuffSeed {
  angle: number;
  radius: number;
  phase: number;
  speed: number;
  baseScale: number;
  wobbleAmp: number;
}

function createSoftSteamTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.5,
      size * 0.05,
      size * 0.5,
      size * 0.5,
      size * 0.5
    );
    grad.addColorStop(0, "rgba(255, 248, 232, 0.72)");
    grad.addColorStop(0.42, "rgba(247, 240, 222, 0.34)");
    grad.addColorStop(0.75, "rgba(247, 240, 222, 0.08)");
    grad.addColorStop(1, "rgba(247, 240, 222, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const PUFF_COUNT = 16;

export function SteamParticles({
  intensityRef,
  baseOpacity = 0.36,
  position = [0, 0.95, 0],
  scale = 1,
  reducedMotion = false,
}: SteamParticlesProps) {
  const spriteRefs = useRef<(THREE.Sprite | null)[]>([]);
  const elapsedRef = useRef(0);

  const steamTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    return createSoftSteamTexture();
  }, []);

  const seeds = useMemo<PuffSeed[]>(() => {
    return Array.from({ length: PUFF_COUNT }, (_, i) => {
      const ratio = i / PUFF_COUNT;
      return {
        angle: ratio * Math.PI * 2 + (i % 3) * 0.65,
        radius: 0.08 + ((i * 37) % 100) / 380,
        phase: ratio,
        speed: 0.16 + ((i * 19) % 10) * 0.011,
        baseScale: 0.36 + ((i * 13) % 7) * 0.08,
        wobbleAmp: 0.08 + ((i * 7) % 5) * 0.02,
      };
    });
  }, []);

  useFrame((_, delta) => {
    const intensity = Math.max(0, Math.min(1, intensityRef ? intensityRef.current : 1));
    if (!reducedMotion) {
      elapsedRef.current += Math.min(delta, 0.1);
    }
    const t = reducedMotion ? 0.35 : elapsedRef.current;

    if (intensity <= 0.005) {
      for (let i = 0; i < PUFF_COUNT; i++) {
        const sprite = spriteRefs.current[i];
        if (sprite && sprite.material.opacity !== 0) {
          sprite.material.opacity = 0;
        }
      }
      return;
    }

    for (let i = 0; i < PUFF_COUNT; i++) {
      const sprite = spriteRefs.current[i];
      if (!sprite) continue;
      const seed = seeds[i];
      const life = (seed.phase + t * seed.speed) % 1;
      const alphaCurve = Math.sin(life * Math.PI) * (1 - life * 0.45);

      sprite.position.set(
        Math.cos(seed.angle + t * 0.3) * seed.radius +
          Math.sin(t * 1.1 + i) * seed.wobbleAmp * life,
        life * 0.78,
        Math.sin(seed.angle + t * 0.28) * seed.radius +
          Math.cos(t * 0.9 + i) * seed.wobbleAmp * life
      );

      const s = seed.baseScale * (0.55 + life * 0.85);
      sprite.scale.set(s, s * 1.15, 1);
      sprite.material.opacity = intensity * baseOpacity * alphaCurve;
    }
  });

  if (!steamTexture) return null;

  return (
    <group position={position} scale={scale}>
      {seeds.map((_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            spriteRefs.current[i] = el;
          }}
        >
          <spriteMaterial
            map={steamTexture}
            transparent
            depthWrite={false}
            opacity={0}
          />
        </sprite>
      ))}
    </group>
  );
}
