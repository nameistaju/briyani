"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { HERO_FLOATING_SPICES, HERO_MODELS } from "@/data/assets";
import { GLBModel, SceneErrorBoundary } from "@/components/three/GLBModel";
import { StudioLighting } from "@/components/three/StudioLighting";
import { SteamParticles } from "@/components/three/SteamParticles";
import { WebGLFallback } from "@/components/three/WebGLFallback";

interface HeroHandiRigProps {
  reducedMotion: boolean;
  isCompactViewport: boolean;
  spinVelocityRef: React.MutableRefObject<number>;
}

/**
 * The Biryani Pot — completely independent object that rotates on its own
 * vertical axis with continuous slow turntable rotation and interactive
 * drag-spin momentum. It is NOT connected to the floating ingredients.
 */
function HeroHandiRig({
  reducedMotion,
  isCompactViewport,
  spinVelocityRef,
}: HeroHandiRigProps) {
  const rigRef = useRef<THREE.Group>(null);
  const potAngleY = useRef(0.25);

  useFrame((state, delta) => {
    if (!rigRef.current) return;

    if (!reducedMotion) {
      // Continuous slow appetizing turntable rotation
      potAngleY.current += delta * 0.28;

      // Add user drag-spin momentum with smooth inertia decay
      potAngleY.current += spinVelocityRef.current;
      spinVelocityRef.current *= 0.92;

      // Apply independent pot rotation
      rigRef.current.rotation.y = potAngleY.current;

      // Subtle vertical tilt responding to pointer
      const targetX = 0.14 - state.pointer.y * 0.08;
      rigRef.current.rotation.x = THREE.MathUtils.lerp(
        rigRef.current.rotation.x,
        targetX,
        0.05
      );
    }
  });

  return (
    <group ref={rigRef} position={[0, -1.05, 0]} rotation={[0.14, 0.25, 0]}>
      {/* Metric assembly group containing ONLY the pot and its contents */}
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
            rotation={[0.2, -0.22, 0.34]}
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

/**
 * Individual Floating Ingredient with its own independent floating oscillation,
 * mouse parallax tracking, and rotation wobble.
 */
function SingleFloatingIngredient({
  spice,
  isCompactViewport,
  reducedMotion,
}: {
  spice: (typeof HERO_FLOATING_SPICES)[number];
  isCompactViewport: boolean;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const basePos = isCompactViewport
    ? ([spice.position[0] * 0.68, spice.position[1] * 0.88, spice.position[2]] as [
        number,
        number,
        number
      ])
    : spice.position;

  useFrame((state, delta) => {
    if (!groupRef.current || reducedMotion) return;

    // Independent depth-based parallax responding to mouse pointer
    const depth = (basePos[2] + 2) * 0.16;
    const targetX = basePos[0] + state.pointer.x * depth;
    const targetY = basePos[1] + state.pointer.y * depth * 0.75;

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      0.05
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.05
    );

    // Subtle individual tumble/rotation drift
    groupRef.current.rotation.y += delta * 0.12;
    groupRef.current.rotation.z += delta * 0.06;
  });

  return (
    <group ref={groupRef} position={basePos} rotation={spice.rotation}>
      <Float
        speed={reducedMotion ? 0 : spice.floatSpeed}
        rotationIntensity={reducedMotion ? 0 : spice.rotationIntensity}
        floatIntensity={reducedMotion ? 0 : spice.floatIntensity}
        floatingRange={[-0.14, 0.14]}
      >
        <GLBModel
          name={`hero-ingredient-${spice.id}`}
          url={spice.glbPath}
          scale={isCompactViewport ? spice.scale * 0.78 : spice.scale}
          castShadow={false}
          receiveShadow={false}
        />
      </Float>
    </group>
  );
}

function FloatingIngredientsCluster({
  reducedMotion,
  isCompactViewport,
  visibleCount,
}: {
  reducedMotion: boolean;
  isCompactViewport: boolean;
  visibleCount: number;
}) {
  const spices = (
    isCompactViewport ? HERO_FLOATING_SPICES.slice(0, 6) : HERO_FLOATING_SPICES
  ).slice(0, visibleCount);

  return (
    <group>
      {spices.map((spice) => (
        <SingleFloatingIngredient
          key={spice.id}
          spice={spice}
          isCompactViewport={isCompactViewport}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}

/**
 * Camera controller that applies subtle mouse parallax across the whole scene.
 */
function CameraParallax({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame((state) => {
    if (reducedMotion) return;
    const targetX = state.pointer.x * 0.32;
    const targetY = 1.35 + state.pointer.y * 0.22;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.04);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.04);
    state.camera.lookAt(0, -0.15, 0);
  });

  return null;
}

interface HeroSceneContentProps {
  reducedMotion: boolean;
  isCompactViewport: boolean;
  spinVelocityRef: React.MutableRefObject<number>;
}

function HeroSceneContent({
  reducedMotion,
  isCompactViewport,
  spinVelocityRef,
}: HeroSceneContentProps) {
  const totalSpices = isCompactViewport ? 6 : HERO_FLOATING_SPICES.length;

  return (
    <>
      <CameraParallax reducedMotion={reducedMotion} />

      <StudioLighting shadowY={-1.18} shadowOpacity={0.62} envIntensity={0.78} />

      {/* Central Biryani Pot — rotates independently */}
      <Suspense fallback={null}>
        <HeroHandiRig
          reducedMotion={reducedMotion}
          isCompactViewport={isCompactViewport}
          spinVelocityRef={spinVelocityRef}
        />
      </Suspense>

      {/* Floating ingredients — move and float independently around the pot */}
      <Suspense fallback={null}>
        <FloatingIngredientsCluster
          reducedMotion={reducedMotion}
          isCompactViewport={isCompactViewport}
          visibleCount={totalSpices}
        />
      </Suspense>
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

  // Interactive spin gesture state
  const spinVelocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastPointerXRef = useRef(0);

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

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastPointerXRef.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastPointerXRef.current;
    lastPointerXRef.current = e.clientX;
    spinVelocityRef.current += deltaX * 0.007;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

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
      <div
        ref={containerRef}
        className="relative h-full w-full cursor-grab active:cursor-grabbing select-none touch-none"
        data-testid="hero-3d-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <Canvas
          shadows="percentage"
          frameloop={inView ? "always" : "demand"}
          dpr={[1, 1.5]}
          camera={{
            position: [0, 1.35, isCompactViewport ? 6.9 : 5.45],
            fov: 37,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
          }}
          onCreated={({ gl, scene, camera }) => {
            try {
              gl.compile(scene, camera);
            } catch {
              // ignore
            }
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("dumbaaz:hero-ready"));
            }
          }}
        >
          <HeroSceneContent
            reducedMotion={reducedMotion}
            isCompactViewport={isCompactViewport}
            spinVelocityRef={spinVelocityRef}
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
