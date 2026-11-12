"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { HERO_FLOATING_SPICES, HERO_MODELS } from "@/data/assets";
import { GLBModel, SceneErrorBoundary } from "@/components/three/GLBModel";
import { StudioLighting } from "@/components/three/StudioLighting";
import { SteamParticles } from "@/components/three/SteamParticles";
import { WebGLFallback } from "@/components/three/WebGLFallback";

interface HeroSceneContentProps {
  reducedMotion: boolean;
  isCompactViewport: boolean;
}

function HeroHandiRig({
  reducedMotion,
  isCompactViewport,
}: {
  reducedMotion: boolean;
  isCompactViewport: boolean;
}) {
  const rigRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);

  useFrame((state, delta) => {
    if (!rigRef.current || reducedMotion) return;
    elapsedRef.current += Math.min(delta, 0.1);
    const t = elapsedRef.current;
    const targetY = Math.sin(t * 0.45) * 0.22 + state.pointer.x * 0.24;
    const targetX = 0.14 - state.pointer.y * 0.08;
    rigRef.current.rotation.y = THREE.MathUtils.lerp(rigRef.current.rotation.y, targetY, 0.05);
    rigRef.current.rotation.x = THREE.MathUtils.lerp(rigRef.current.rotation.x, targetX, 0.05);
  });

  return (
    <group ref={rigRef} position={[0, -1.05, 0]} rotation={[0.14, 0.25, 0]}>
      {/* Metric assembly group matching calibrated copper-handi sockets */}
      <group scale={isCompactViewport ? 9.0 : 10.8}>
        <Suspense fallback={null}>
          <GLBModel
            name="hero-copper-handi"
            url={HERO_MODELS.copperHandi.url}
            position={HERO_MODELS.copperHandi.assembled.position}
          />
        </Suspense>
        <Suspense fallback={null}>
          <GLBModel
            name="hero-rice-mound"
            url={HERO_MODELS.biryaniRiceMound.url}
            position={HERO_MODELS.biryaniRiceMound.assembled.position}
            castShadow={false}
          />
        </Suspense>
        <Suspense fallback={null}>
          <GLBModel
            name="hero-chicken-drumstick"
            url={HERO_MODELS.chickenDrumstick.url}
            position={[0.008, 0.168, 0.016]}
            rotation={[0.20, -0.22, 0.34]}
            scale={HERO_MODELS.chickenDrumstick.assembled.scale}
          />
        </Suspense>
        <Suspense fallback={null}>
          <GLBModel
            name="hero-fried-onions"
            url={HERO_MODELS.friedOnions.url}
            position={HERO_MODELS.friedOnions.assembled.position}
            rotation={HERO_MODELS.friedOnions.assembled.rotation}
            scale={HERO_MODELS.friedOnions.assembled.scale}
          />
        </Suspense>
        <Suspense fallback={null}>
          <GLBModel
            name="hero-mint-leaves"
            url={HERO_MODELS.mintLeaves.url}
            position={HERO_MODELS.mintLeaves.assembled.position}
            rotation={HERO_MODELS.mintLeaves.assembled.rotation}
            scale={HERO_MODELS.mintLeaves.assembled.scale}
          />
        </Suspense>
      </group>

      <SteamParticles
        position={[0, 1.88, 0]}
        scale={0.92}
        baseOpacity={0.3}
        reducedMotion={reducedMotion}
      />
    </group>
  );
}

function FloatingSpicesCluster({
  reducedMotion,
  isCompactViewport,
  visibleCount,
}: {
  reducedMotion: boolean;
  isCompactViewport: boolean;
  visibleCount: number;
}) {
  const spices = (
    isCompactViewport ? HERO_FLOATING_SPICES.slice(0, 4) : HERO_FLOATING_SPICES
  ).slice(0, visibleCount);

  return (
    <group>
      {spices.map((spice) => {
        const pos: [number, number, number] = isCompactViewport
          ? [spice.position[0] * 0.52, spice.position[1] * 0.82, spice.position[2]]
          : spice.position;

        return (
          <Float
            key={spice.id}
            speed={reducedMotion ? 0 : spice.floatSpeed}
            rotationIntensity={reducedMotion ? 0 : spice.rotationIntensity}
            floatIntensity={reducedMotion ? 0 : spice.floatIntensity}
            floatingRange={[-0.14, 0.14]}
          >
            <GLBModel
              name={`hero-spice-${spice.id}`}
              url={spice.glbPath}
              position={pos}
              rotation={spice.rotation}
              scale={isCompactViewport ? spice.scale * 0.72 : spice.scale}
              castShadow={false}
              receiveShadow={false}
            />
          </Float>
        );
      })}
    </group>
  );
}

function HeroSceneContent({ reducedMotion, isCompactViewport }: HeroSceneContentProps) {
  const totalSpices = isCompactViewport ? 4 : HERO_FLOATING_SPICES.length;
  const [visibleSpiceCount, setVisibleSpiceCount] = useState(0);

  // Stagger secondary floating spice GLBs in small batches after initial hero paint
  // so main-thread Draco decoding & WebGL texture uploads never spike all at once.
  useEffect(() => {
    let intervalId: number | undefined;
    const startTimer = window.setTimeout(() => {
      setVisibleSpiceCount(2);
      intervalId = window.setInterval(() => {
        setVisibleSpiceCount((prev) => {
          if (prev >= totalSpices) {
            if (intervalId !== undefined) window.clearInterval(intervalId);
            return prev;
          }
          return Math.min(totalSpices, prev + 2);
        });
      }, 220);
    }, 350);

    return () => {
      window.clearTimeout(startTimer);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [totalSpices]);

  return (
    <>
      <StudioLighting shadowY={-1.18} shadowOpacity={0.62} envIntensity={0.78} />

      <Suspense fallback={null}>
        <HeroHandiRig
          reducedMotion={reducedMotion}
          isCompactViewport={isCompactViewport}
        />
      </Suspense>

      {visibleSpiceCount > 0 && (
        <Suspense fallback={null}>
          <FloatingSpicesCluster
            reducedMotion={reducedMotion}
            isCompactViewport={isCompactViewport}
            visibleCount={visibleSpiceCount}
          />
        </Suspense>
      )}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI * 0.34}
        maxPolarAngle={Math.PI * 0.56}
        rotateSpeed={0.55}
        dampingFactor={0.07}
        enableDamping
      />
    </>
  );
}

interface HeroScene3DProps {
  webglSupported: boolean | null;
  reducedMotion: boolean;
  isCompactViewport: boolean;
}

export function HeroScene3D({
  webglSupported,
  reducedMotion,
  isCompactViewport,
}: HeroScene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const fallback = (
    <WebGLFallback
      imageSrc="/3d-assets/previews/steaming-biryani-handi-hero.png"
      alt="DUMBAAZ hammered copper chicken biryani handi"
    />
  );

  if (webglSupported === false) {
    return fallback;
  }

  return (
    <SceneErrorBoundary fallback={fallback}>
      <div ref={containerRef} className="relative h-full w-full" data-testid="hero-3d-canvas">
        <Canvas
          shadows="percentage"
          frameloop={inView ? "always" : "demand"}
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.35, isCompactViewport ? 6.9 : 5.45], fov: 37 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
          }}
        >
          <HeroSceneContent
            reducedMotion={reducedMotion}
            isCompactViewport={isCompactViewport}
          />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  );
}

// Preload core hero vessel and mound cleanly on client bundle evaluation
if (typeof window !== "undefined") {
  useGLTF.setDecoderPath("/draco/");
  useGLTF.preload(HERO_MODELS.copperHandi.url, "/draco/");
  useGLTF.preload(HERO_MODELS.biryaniRiceMound.url, "/draco/");
  useGLTF.preload(HERO_MODELS.chickenDrumstick.url, "/draco/");
  useGLTF.preload(HERO_MODELS.friedOnions.url, "/draco/");
  useGLTF.preload(HERO_MODELS.mintLeaves.url, "/draco/");
}
