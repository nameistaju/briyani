"use client";

import React from "react";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

interface StudioLightingProps {
  shadowY?: number;
  shadowOpacity?: number;
  envIntensity?: number;
  accentTone?: "burgundy" | "teal";
}

/**
 * Dark-mahogany & saffron Lightformer studio rig tuned for metallic hammered
 * copper (`metalness ~0.94`) and glossy spiced food materials without external HDRI fetches.
 */
export function StudioLighting({
  shadowY = -1.25,
  shadowOpacity = 0.58,
  envIntensity = 0.72,
  accentTone = "burgundy",
}: StudioLightingProps) {
  const coolBounce = accentTone === "teal" ? "#1e7c7d" : "#7c1824";

  return (
    <>
      <ambientLight intensity={0.28} color="#fff1dc" />

      {/* Warm culinary softbox key light */}
      <directionalLight
        position={[3.6, 5.2, 4.4]}
        intensity={2.45}
        color="#fff0d8"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.0004}
        shadow-camera-near={1}
        shadow-camera-far={16}
        shadow-camera-left={-3.5}
        shadow-camera-right={3.5}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-3.5}
      />

      {/* Turmeric rim light from behind-left */}
      <spotLight
        position={[-4.2, 3.8, -3.2]}
        angle={0.58}
        penumbra={0.85}
        intensity={42}
        color="#f4b41a"
      />

      {/* Atmospheric bounce fill */}
      <pointLight position={[2.8, -0.4, -3.0]} intensity={10} color={coolBounce} />
      <pointLight position={[-2.6, 0.8, 3.2]} intensity={8} color="#ffbe82" />

      <Environment resolution={128} frames={1} environmentIntensity={envIntensity}>
        {/* Deep dark enclosing dome so metallic copper never reflects flat white floors */}
        <mesh scale={40}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial color="#1a070b" side={2} />
        </mesh>

        {/* Overhead warm diffuser */}
        <Lightformer
          form="rect"
          intensity={3.4}
          color="#fff0d6"
          position={[0, 6, 1.5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[7, 5, 1]}
        />

        {/* Saffron metallic side kicker */}
        <Lightformer
          form="rect"
          intensity={2.6}
          color="#f7b74a"
          position={[-6, 2.2, 2.5]}
          rotation={[0, Math.PI / 2.2, 0]}
          scale={[4.5, 6, 1]}
        />

        {/* Subtle crimson/teal counter-fill */}
        <Lightformer
          form="rect"
          intensity={1.5}
          color={coolBounce}
          position={[6, 1.2, -1.5]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[5, 4, 1]}
        />

        {/* Lower warm copper floor bounce */}
        <Lightformer
          form="ring"
          intensity={0.9}
          color="#4b1710"
          position={[0, -5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
      </Environment>

      <ContactShadows
        position={[0, shadowY, 0]}
        opacity={shadowOpacity}
        scale={7.2}
        blur={2.2}
        far={4.2}
        frames={1}
        resolution={128}
        color="#1a0407"
      />
    </>
  );
}
