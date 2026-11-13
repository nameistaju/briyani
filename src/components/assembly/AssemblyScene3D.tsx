"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_MODELS } from "@/data/assets";
import { GLBModel, SceneErrorBoundary } from "@/components/three/GLBModel";
import { StudioLighting } from "@/components/three/StudioLighting";
import { SteamParticles } from "@/components/three/SteamParticles";
import { WebGLFallback } from "@/components/three/WebGLFallback";

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
}: {
  motionRef: React.MutableRefObject<AssemblyMotionState>;
  reducedMotion: boolean;
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
      riceRef.current.visible = p > 0.015;
      const target = HERO_MODELS.biryaniRiceMound.assembled;
      riceRef.current.position.set(
        target.position[0],
        THREE.MathUtils.lerp(0.26, target.position[1], p),
        target.position[2]
      );
      riceRef.current.rotation.set(0, (1 - p) * -0.75, 0);
      const scale = p < 0.08 ? p / 0.08 : 1;
      riceRef.current.scale.setScalar(scale * target.scale);
    }

    if (drumstickRef.current) {
      const p = s.drumstickProgress;
      drumstickRef.current.visible = p > 0.015;
      const target = HERO_MODELS.chickenDrumstick.assembled;
      drumstickRef.current.position.set(
        THREE.MathUtils.lerp(0.09, 0.008, p),
        THREE.MathUtils.lerp(0.28, 0.168, p),
        THREE.MathUtils.lerp(0.05, 0.016, p)
      );
      drumstickRef.current.rotation.set(
        THREE.MathUtils.lerp(-0.25, 0.20, p),
        THREE.MathUtils.lerp(0.85, -0.22, p),
        THREE.MathUtils.lerp(1.15, 0.34, p)
      );
      const scale = p < 0.08 ? p / 0.08 : 1;
      drumstickRef.current.scale.setScalar(scale * target.scale);
    }

    if (onionsRef.current) {
      const p = s.onionsProgress;
      onionsRef.current.visible = p > 0.015;
      const target = HERO_MODELS.friedOnions.assembled;
      onionsRef.current.position.set(
        THREE.MathUtils.lerp(-0.05, target.position[0], p),
        THREE.MathUtils.lerp(0.31, target.position[1], p),
        THREE.MathUtils.lerp(-0.03, target.position[2], p)
      );
      onionsRef.current.rotation.set(
        THREE.MathUtils.lerp(0.45, target.rotation[0], p),
        THREE.MathUtils.lerp(-1.3, target.rotation[1], p),
        THREE.MathUtils.lerp(0.3, target.rotation[2], p)
      );
      const scale = p < 0.1 ? p / 0.1 : 1;
      onionsRef.current.scale.setScalar(scale * target.scale);
    }

    if (mintRef.current) {
      const p = s.mintProgress;
      mintRef.current.visible = p > 0.015;
      const target = HERO_MODELS.mintLeaves.assembled;
      mintRef.current.position.set(
        THREE.MathUtils.lerp(0.03, target.position[0], p),
        THREE.MathUtils.lerp(0.32, target.position[1], p),
        THREE.MathUtils.lerp(0.04, target.position[2], p)
      );
      mintRef.current.rotation.set(
        THREE.MathUtils.lerp(-0.35, target.rotation[0], p),
        THREE.MathUtils.lerp(1.1, target.rotation[1], p),
        THREE.MathUtils.lerp(-0.28, target.rotation[2], p)
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
        </group>

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
              <AssemblyRig motionRef={motionRef} reducedMotion={reducedMotion} />
            </Suspense>
          </Canvas>
        ) : (
          fallback
        )}
      </div>
    </SceneErrorBoundary>
  );
}
