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
      <group scale={isCompactViewport ? 8.2 : 9.8}>
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
            position={[0.008, 0.176, 0.016]}
            rotation={[0.22, -0.22, 0.34]}
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
 * continuous tumble drift, and cursor-based magnetic repulsion interaction that
 * smoothly pushes the ingredient away when the mouse approaches and returns via
 * damped spring physics.
 */
function SingleFloatingIngredient({
  spice,
  isCompactViewport,
  reducedMotion,
  isPointerInsideRef,
}: {
  spice: (typeof HERO_FLOATING_SPICES)[number];
  isCompactViewport: boolean;
  reducedMotion: boolean;
  isPointerInsideRef: React.MutableRefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const screenPosRef = useRef(new THREE.Vector3());

  // Second-order damped spring system for silky-smooth magnetic repulsion and recovery
  const springPos = useRef({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });
  const springRot = useRef({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });
  const tumbleRef = useRef({ y: 0, z: 0 });
  const parallaxPos = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Viewport-aware responsive boundaries: guaranteed safe margins from screen edges
    const currentVp = state.viewport.getCurrentViewport(state.camera, [0, 0, spice.position[2]]);
    const safeHalfW = currentVp.width * 0.44;
    const safeHalfH = currentVp.height * 0.42;

    // Normalized canonical position relative to reference grid
    const normX = spice.position[0] / 3.0;
    const normY = spice.position[1] / 1.8;
    const basePosX = THREE.MathUtils.clamp(normX * safeHalfW, -safeHalfW, safeHalfW);
    const basePosY = THREE.MathUtils.clamp(-0.15 + normY * safeHalfH, -0.15 - safeHalfH, -0.15 + safeHalfH);
    const basePosZ = spice.position[2];

    if (reducedMotion) {
      groupRef.current.position.set(basePosX, basePosY, basePosZ);
      return;
    }

    const dt = Math.min(delta * 60, 2.5);

    // 1. Continuous gentle tumble drift
    tumbleRef.current.y += delta * 0.12;
    tumbleRef.current.z += delta * 0.06;

    // 2. Subtle background mouse parallax
    const depth = (basePosZ + 2) * 0.16;
    const targetParallaxX = isPointerInsideRef.current ? state.pointer.x * depth : 0;
    const targetParallaxY = isPointerInsideRef.current ? state.pointer.y * depth * 0.75 : 0;
    parallaxPos.current.x = THREE.MathUtils.lerp(parallaxPos.current.x, targetParallaxX, 0.05);
    parallaxPos.current.y = THREE.MathUtils.lerp(parallaxPos.current.y, targetParallaxY, 0.05);

    // 3. Screen-space projection & magnetic repulsion calculation
    groupRef.current.getWorldPosition(worldPosRef.current);
    screenPosRef.current.copy(worldPosRef.current).project(state.camera);

    const screenX = (screenPosRef.current.x * 0.5 + 0.5) * state.size.width;
    const screenY = (-screenPosRef.current.y * 0.5 + 0.5) * state.size.height;

    const cursorX = (state.pointer.x * 0.5 + 0.5) * state.size.width;
    const cursorY = (-state.pointer.y * 0.5 + 0.5) * state.size.height;

    const dx = screenX - cursorX;
    const dy = screenY - cursorY;
    const pixelDist = Math.hypot(dx, dy);

    // 200px magnetic repulsion threshold: moves element away as mouse approaches
    const REPULSION_RADIUS = 200;
    let targetRepulseX = 0;
    let targetRepulseY = 0;
    let targetRepulseZ = 0;
    let targetRotPushX = 0;
    let targetRotPushY = 0;
    let targetRotPushZ = 0;

    if (isPointerInsideRef.current && pixelDist < REPULSION_RADIUS && pixelDist > 0.1) {
      const nx = dx / pixelDist;
      const ny = dy / pixelDist;

      // Smooth non-linear magnetic falloff (maximum at center, smoothly tapers to zero at 200px)
      const force = Math.pow(1 - pixelDist / REPULSION_RADIUS, 1.5);
      const maxPush = isCompactViewport ? 0.65 : 0.95;

      targetRepulseX = nx * maxPush * force;
      // Screen Y is down (+dy), corresponding to negative Y in Three.js world space
      targetRepulseY = -ny * maxPush * force;
      // Subtle 3D depth push away from cursor into the screen
      targetRepulseZ = -0.28 * force;

      // Subtle rotational torque induced during displacement
      targetRotPushZ = -nx * 0.42 * force;
      targetRotPushX = ny * 0.35 * force;
      targetRotPushY = (nx + ny) * 0.28 * force;
    }

    // 4. Spring-like damped motion physics
    const stiffness = 0.12 * dt;
    const damping = Math.pow(0.78, dt);

    // Position spring
    const ax = (targetRepulseX - springPos.current.x) * stiffness;
    const ay = (targetRepulseY - springPos.current.y) * stiffness;
    const az = (targetRepulseZ - springPos.current.z) * stiffness;

    springPos.current.vx = (springPos.current.vx + ax) * damping;
    springPos.current.vy = (springPos.current.vy + ay) * damping;
    springPos.current.vz = (springPos.current.vz + az) * damping;

    springPos.current.x += springPos.current.vx;
    springPos.current.y += springPos.current.vy;
    springPos.current.z += springPos.current.vz;

    // Prevent excessive displacement and keep ingredients inside visible hero bounds
    const maxDisplacement = isCompactViewport ? 0.75 : 1.15;
    const currentDisplacement = Math.hypot(springPos.current.x, springPos.current.y);
    if (currentDisplacement > maxDisplacement) {
      const scale = maxDisplacement / currentDisplacement;
      springPos.current.x *= scale;
      springPos.current.y *= scale;
      springPos.current.vx *= 0.5;
      springPos.current.vy *= 0.5;
    }

    // Rotation spring
    const rax = (targetRotPushX - springRot.current.x) * stiffness;
    const ray = (targetRotPushY - springRot.current.y) * stiffness;
    const raz = (targetRotPushZ - springRot.current.z) * stiffness;

    springRot.current.vx = (springRot.current.vx + rax) * damping;
    springRot.current.vy = (springRot.current.vy + ray) * damping;
    springRot.current.vz = (springRot.current.vz + raz) * damping;

    springRot.current.x += springRot.current.vx;
    springRot.current.y += springRot.current.vy;
    springRot.current.z += springRot.current.vz;

    // 5. Apply transforms smoothly with clamping to safe viewport bounds
    const rawTargetX = basePosX + parallaxPos.current.x + springPos.current.x;
    const rawTargetY = basePosY + parallaxPos.current.y + springPos.current.y;
    const targetX = THREE.MathUtils.clamp(rawTargetX, -safeHalfW, safeHalfW);
    const targetY = THREE.MathUtils.clamp(rawTargetY, -0.15 - safeHalfH, -0.15 + safeHalfH);
    const targetZ = basePosZ + springPos.current.z;

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.12);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.12);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.12);

    groupRef.current.rotation.x = spice.rotation[0] + springRot.current.x;
    groupRef.current.rotation.y = spice.rotation[1] + tumbleRef.current.y + springRot.current.y;
    groupRef.current.rotation.z = spice.rotation[2] + tumbleRef.current.z + springRot.current.z;
  });

  return (
    <group ref={groupRef} rotation={spice.rotation}>
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
  isPointerInsideRef,
}: {
  reducedMotion: boolean;
  isCompactViewport: boolean;
  isPointerInsideRef: React.MutableRefObject<boolean>;
}) {
  const spices = isCompactViewport ? HERO_FLOATING_SPICES.slice(0, 8) : HERO_FLOATING_SPICES;

  return (
    <group>
      {spices.map((spice) => (
        <SingleFloatingIngredient
          key={spice.id}
          spice={spice}
          isCompactViewport={isCompactViewport}
          reducedMotion={reducedMotion}
          isPointerInsideRef={isPointerInsideRef}
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
  isPointerInsideRef: React.MutableRefObject<boolean>;
}

function HeroSceneContent({
  reducedMotion,
  isCompactViewport,
  spinVelocityRef,
  isPointerInsideRef,
}: HeroSceneContentProps) {
  return (
    <>
      <CameraParallax reducedMotion={reducedMotion} />

      <StudioLighting shadowY={-1.18} shadowOpacity={0.62} envIntensity={0.78} />

      {/* Central Biryani Pot — rotates independently without cursor repulsion */}
      <Suspense fallback={null}>
        <HeroHandiRig
          reducedMotion={reducedMotion}
          isCompactViewport={isCompactViewport}
          spinVelocityRef={spinVelocityRef}
        />
      </Suspense>

      {/* Floating ingredients — magnetic repulsion within ~200px and damped spring return */}
      <Suspense fallback={null}>
        <FloatingIngredientsCluster
          reducedMotion={reducedMotion}
          isCompactViewport={isCompactViewport}
          isPointerInsideRef={isPointerInsideRef}
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
  const isPointerInsideRef = useRef(false);

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

  const handlePointerEnter = () => {
    isPointerInsideRef.current = true;
  };

  const handlePointerLeave = () => {
    isPointerInsideRef.current = false;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastPointerXRef.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    isPointerInsideRef.current = true;
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
        className="pointer-events-auto relative h-full w-full cursor-grab active:cursor-grabbing select-none touch-none"
        data-testid="hero-3d-canvas"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
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
            position: [0, 1.35, isCompactViewport ? 7.2 : 5.8],
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
            isPointerInsideRef={isPointerInsideRef}
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
