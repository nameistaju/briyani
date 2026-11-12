"use client";

import React, { Component, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import type { Material, Mesh, Object3D } from "three";

interface GLBModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
  name?: string;
}

function optimizeMaterialRuntime(material: Material | null | undefined) {
  if (!material || material.userData.__dumbaazOptimized) return;
  material.userData.__dumbaazOptimized = true;

  const phys = material as Material & {
    transmission?: number;
    thickness?: number;
    clearcoat?: number;
    roughness?: number;
    envMapIntensity?: number;
  };

  // Transmission > 0 forces Three.js to render the entire opaque scene a second
  // time per frame into a blurred FBO; convert dew/translucency to light physical sheen.
  if (typeof phys.transmission === "number" && phys.transmission > 0) {
    const prev = phys.transmission;
    phys.transmission = 0;
    if (typeof phys.thickness === "number") phys.thickness = 0;
    if (typeof phys.clearcoat === "number") phys.clearcoat = Math.max(phys.clearcoat, 1);
    if (typeof phys.roughness === "number") phys.roughness = Math.min(phys.roughness, 0.08);
    if (typeof phys.envMapIntensity === "number") {
      phys.envMapIntensity = Math.max(phys.envMapIntensity, 1.5);
    }
    if (prev > 0.5) {
      material.transparent = true;
      material.opacity = 0.72;
    }
    material.needsUpdate = true;
  }
}

/**
 * Clones cached `useGLTF` scene graphs safely so each instance can animate
 * transforms independently without mutating shared module-level caches.
 */
export function GLBModel({
  url,
  position,
  rotation,
  scale,
  castShadow = true,
  receiveShadow = true,
  name,
}: GLBModelProps) {
  const gltf = useGLTF(url, "/draco/");

  const clonedScene = useMemo(() => {
    const clone: Object3D = gltf.scene.clone(true);
    clone.traverse((child) => {
      if ("isMesh" in child && child.isMesh) {
        const mesh = child as Mesh;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(optimizeMaterialRuntime);
        } else {
          optimizeMaterialRuntime(mesh.material);
        }
      }
    });
    return clone;
  }, [gltf.scene, castShadow, receiveShadow]);

  return (
    <primitive
      name={name}
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class SceneErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
