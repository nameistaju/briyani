"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_MODELS } from "@/data/assets";
import { GLBModel, SceneErrorBoundary } from "@/components/three/GLBModel";
import { StudioLighting } from "@/components/three/StudioLighting";
import { SteamParticles } from "@/components/three/SteamParticles";
import { WebGLFallback } from "@/components/three/WebGLFallback";
import { RimDetail } from "./RimDetail";
import { FallingBits } from "./FallingBits";

export interface AssemblyMotionState {
  handiY: number;
  handiRotY: number;
  handiRotZ: number;
  handiScale: number;
  riceProgress: number;
  drumstickProgress: number;
  onionsProgress: number;
  mintProgress: number;
  steamIntensity: number;
  turntableY: number;
}

export const INITIAL_ASSEMBLY_STATE: AssemblyMotionState = {
  handiY: 0.28,
  handiRotY: -0.55,
  handiRotZ: -0.14,
  handiScale: 0.86,
  riceProgress: 0,
  drumstickProgress: 0,
  onionsProgress: 0,
  mintProgress: 0,
  steamIntensity: 0,
  turntableY: 0.12,
};

export const COMPLETED_ASSEMBLY_STATE: AssemblyMotionState = {
  handiY: 0,
  handiRotY: 0,
  handiRotZ: 0,
  handiScale: 1,
  riceProgress: 1,
  drumstickProgress: 1,
  onionsProgress: 1,
  mintProgress: 1,
  steamIntensity: 1,
  turntableY: 0.42,
};

function AssemblyRig({
  motionRef,
  reducedMotion,
  isCompactViewport,
}: {
  motionRef: React.MutableRefObject<AssemblyMotionState>;
  reducedMotion: boolean;
  isCompactViewport: boolean;
}) {
  const turntableRef = useRef<THREE.Group>(null);
  const handiRef = useRef<THREE.Group>(null);
  const riceRef = useRef<THREE.Group>(null);
  const drumstickRef = useRef<THREE.Group>(null);
  const onionsRef = useRef<THREE.Group>(null);
  const mintRef = useRef<THREE.Group>(null);
  const steamLevelRef = useRef(0);

  useFrame(() => {
    const s = motionRef.current;

    if (turntableRef.current) {
      turntableRef.current.rotation.y = s.turntableY;
    }

    if (handiRef.current) {
      handiRef.current.position.set(0, s.handiY, 0);
      handiRef.current.rotation.set(0, s.handiRotY, s.handiRotZ);
      handiRef.current.scale.setScalar(s.handiScale);
    }

    if (riceRef.current) {
      const p = s.riceProgress;
      const m = THREE.MathUtils.smoothstep(p, 0.55, 1);
      const target = HERO_MODELS.biryaniRiceMound.assembled;
      riceRef.current.visible = m > 0.01;
      riceRef.current.position.set(
        target.position[0],
        THREE.MathUtils.lerp(target.position[1] - 0.03, target.position[1], m),
        target.position[2]
      );
      riceRef.current.rotation.set(0, (1 - m) * -0.4, 0);
      riceRef.current.scale.setScalar(target.scale * (0.75 + 0.25 * m) * Math.min(1, m * 6));
    }

    if (drumstickRef.current) {
      const p = s.drumstickProgress;
      const drop = Math.min(p / 0.7, 1);
      const fall = drop * drop;
      const settle = p > 0.7 ? Math.sin(((p - 0.7) / 0.3) * Math.PI) * 0.012 : 0;
      const rock =
        p > 0.7
          ? Math.sin(((p - 0.7) / 0.3) * Math.PI * 2) * 0.05 * (1 - (p - 0.7) / 0.3)
          : 0;
      drumstickRef.current.visible = p > 0.015;
      drumstickRef.current.position.set(
        THREE.MathUtils.lerp(0.06, 0.014, drop),
        THREE.MathUtils.lerp(0.46, 0.208, fall) + settle,
        THREE.MathUtils.lerp(0.04, 0.024, drop)
      );
      drumstickRef.current.rotation.set(
        THREE.MathUtils.lerp(-0.25, 0.30, drop) + rock,
        THREE.MathUtils.lerp(0.85, -0.16, drop),
        THREE.MathUtils.lerp(1.15, 0.26, drop)
      );
      const scale = p < 0.08 ? p / 0.08 : 1;
      drumstickRef.current.scale.setScalar(scale * 1.14);
    }

    if (onionsRef.current) {
      const p = s.onionsProgress;
      const m = THREE.MathUtils.smoothstep(p, 0.55, 1);
      onionsRef.current.visible = m > 0.01;
      onionsRef.current.position.set(
        -0.012,
        THREE.MathUtils.lerp(0.18, 0.204, m),
        0.008
      );
      onionsRef.current.rotation.set(
        0.12,
        0.35 + (1 - m) * -0.2,
        -0.08
      );
      const scale = p < 0.1 ? p / 0.1 : 1;
      onionsRef.current.scale.setScalar(scale * 0.85);
    }

    if (mintRef.current) {
      const p = s.mintProgress;
      mintRef.current.visible = p > 0.015;
      const target = HERO_MODELS.mintLeaves.assembled;
      mintRef.current.position.set(
        THREE.MathUtils.lerp(0.02, -0.035, p),
        THREE.MathUtils.lerp(0.36, 0.218, p),
        THREE.MathUtils.lerp(0.03, 0.002, p)
      );
      mintRef.current.rotation.set(
        THREE.MathUtils.lerp(-0.35, -0.25, p),
        THREE.MathUtils.lerp(1.1, 0.95, p),
        THREE.MathUtils.lerp(-0.28, -0.22, p)
      );
      const scale = p < 0.1 ? p / 0.1 : 1;
      mintRef.current.scale.setScalar(scale * target.scale);
    }

    steamLevelRef.current = s.steamIntensity;
  });

  return (
    <group ref={turntableRef} position={[0, -1.24, 0]} rotation={[0.16, 0.12, 0]}>
      <group scale={10.4}>
        <group ref={handiRef}>
          <GLBModel
            name="assembly-copper-handi"
            url={HERO_MODELS.copperHandi.url}
          />
          <RimDetail />
        </group>

        {/* Instanced falling grains & saffron bits */}
        <FallingBits
          motionRef={motionRef}
          progressKey="riceProgress"
          count={isCompactViewport ? 450 : 900}
          radius={0.1}
          startY={0.55}
          landY={0.085}
          seed={1}
        >
          <capsuleGeometry args={[0.0014, 0.007, 3, 6]} />
          <meshStandardMaterial color="#f3e6c4" roughness={0.6} />
        </FallingBits>

        <FallingBits
          motionRef={motionRef}
          progressKey="riceProgress"
          count={isCompactViewport ? 35 : 70}
          radius={0.09}
          startY={0.6}
          landY={0.09}
          delaySpread={0.7}
          seed={2}
        >
          <capsuleGeometry args={[0.0016, 0.009, 3, 6]} />
          <meshStandardMaterial color="#e8731a" roughness={0.5} />
        </FallingBits>

        {/* Instanced falling fried onion ribbons (curly caramelized birista) */}
        <FallingBits
          motionRef={motionRef}
          progressKey="onionsProgress"
          count={isCompactViewport ? 175 : 350}
          radius={0.095}
          startY={0.52}
          landY={0.198}
          landJitter={0.024}
          flutter={0.028}
          spin={15}
          seed={3}
          palette={["#f0a430", "#d67c1c", "#a84f0f", "#782e07", "#4a1903"]}
        >
          <torusGeometry args={[0.007, 0.0009, 5, 12, Math.PI * 0.8]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.34}
            metalness={0.06}
            envMapIntensity={1.2}
          />
        </FallingBits>

        <group ref={riceRef} visible={false}>
          <GLBModel
            name="assembly-rice-mound"
            url={HERO_MODELS.biryaniRiceMound.url}
            castShadow={false}
          />
        </group>

        <group ref={drumstickRef} visible={false}>
          <GLBModel
            name="assembly-chicken-drumstick"
            url={HERO_MODELS.chickenDrumstick.url}
          />
        </group>

        <group ref={onionsRef} visible={false}>
          <GLBModel
            name="assembly-fried-onions"
            url={HERO_MODELS.friedOnions.url}
          />
        </group>

        <group ref={mintRef} visible={false}>
          <GLBModel
            name="assembly-mint-leaves"
            url={HERO_MODELS.mintLeaves.url}
          />
        </group>
      </group>

      <SteamParticles
        intensityRef={steamLevelRef}
        position={[0, 2.08, 0]}
        scale={1.15}
        baseOpacity={0.44}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}

interface AssemblyScene3DProps {
  motionRef: React.MutableRefObject<AssemblyMotionState>;
  webglSupported: boolean | null;
  reducedMotion: boolean;
  isCompactViewport: boolean;
}

export function AssemblyScene3D({
  motionRef,
  webglSupported,
  reducedMotion,
  isCompactViewport,
}: AssemblyScene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [nearView, setNearView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNearView(true);
      setInView(true);
      return;
    }

    const viewObserver = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.01 }
    );
    viewObserver.observe(el);

    // Defer creating the second WebGL2 context, Environment PMREM, and shader compiles
    // until the user scrolls near the assembly section so initial load stays crisp.
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearView(true);
          nearObserver.disconnect();
        }
      },
      { rootMargin: "350px 0px" }
    );
    nearObserver.observe(el);

    return () => {
      viewObserver.disconnect();
      nearObserver.disconnect();
    };
  }, []);

  const fallback = (
    <WebGLFallback
      imageSrc="/3d-assets/previews/steaming-biryani-handi-hero.png"
      alt="Layered DUMBAAZ dum biryani assembly"
    />
  );

  if (webglSupported === false) {
    return fallback;
  }

  return (
    <SceneErrorBoundary fallback={fallback}>
      <div ref={containerRef} className="relative h-full w-full" data-testid="assembly-3d-canvas">
        {nearView ? (
          <Canvas
            shadows="percentage"
            frameloop={inView ? "always" : "demand"}
            dpr={[1, 1.5]}
            camera={{ position: [0, 1.38, isCompactViewport ? 7.6 : 6.1], fov: 38 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.08,
            }}
          >
            <StudioLighting
              shadowY={-1.18}
              shadowOpacity={0.6}
              envIntensity={0.76}
              accentTone="teal"
            />
            <Suspense fallback={null}>
              <AssemblyRig
                motionRef={motionRef}
                reducedMotion={reducedMotion}
                isCompactViewport={isCompactViewport}
              />
            </Suspense>
          </Canvas>
        ) : (
          fallback
        )}
      </div>
    </SceneErrorBoundary>
  );
}
