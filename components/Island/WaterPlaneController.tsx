"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useControls } from "leva";
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const WAVE_LAYERS = [
  { dirX: 1.0, dirY: 0.25, wavelength: 140, amplitude: 0.55, steepness: 0.55, speed: 0.9 },
  { dirX: 0.55, dirY: -0.85, wavelength: 65, amplitude: 0.28, steepness: 0.45, speed: 1.35 },
  { dirX: -0.4, dirY: 0.9, wavelength: 32, amplitude: 0.13, steepness: 0.35, speed: 1.9 },
  { dirX: 0.15, dirY: -0.55, wavelength: 16, amplitude: 0.06, steepness: 0.25, speed: 2.6 },
].map((w) => {
  const len = Math.hypot(w.dirX, w.dirY) || 1;
  return {
    ...w,
    dirX: w.dirX / len,
    dirY: w.dirY / len,
    k: (2 * Math.PI) / w.wavelength,
  };
});

export default function WaterPlaneController() {
  const geoRef = useRef<THREE.PlaneGeometry>(null!);
  const basePositions = useRef<Float32Array | null>(null);

  const {
    posY,
    mirror,
    resolution,

    blurX,
    blurY,
    mixBlur,
    mixStrength,

    roughness,
    metalness,

    depthScale,
    minDepthThreshold,
    maxDepthThreshold,

    waterColor,
    opacity,
  } = useControls("Water", {
    posY: { value: 2.3, min: -10, max: 20, step: 0.1 },

    mirror: { value: 0.9, min: 0, max: 1, step: 0.01 },

    resolution: {
      value: 512,
      options: [512, 1024, 2048, 4096],
    },

    blurX: { value: 45, min: 0, max: 1000, step: 5 },
    blurY: { value: 25, min: 0, max: 1000, step: 5 },

    mixBlur: {
      value: 2.25,
      min: 0,
      max: 5,
      step: 0.05,
    },

    mixStrength: {
      value: 2.3,
      min: 0,
      max: 10,
      step: 0.1,
    },

    roughness: {
      value: 0.05,
      min: 0,
      max: 1,
      step: 0.01,
    },

    metalness: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
    },

    depthScale: {
      value: 5,
      min: 0,
      max: 5,
      step: 0.05,
    },

    minDepthThreshold: {
      value: 0.65,
      min: 0,
      max: 2,
      step: 0.05,
    },

    maxDepthThreshold: {
      value: 2,
      min: 0,
      max: 2,
      step: 0.05,
    },

    waterColor: "#2d78c4",

    opacity: {
      value: 0.95,
      min: 0,
      max: 1,
      step: 0.01,
    },
  });

  const {
    waveEnabled,
    patternEnabled,

    waveHeightScale,
    waveChoppiness,
    waveSpeedScale,

    waveSegments,
    recomputeNormals,
  } = useControls("Water Waves", {
    waveEnabled: true,

    // NEW
    patternEnabled: true,

    waveHeightScale: {
      value: 1,
      min: 0,
      max: 3,
      step: 0.05,
    },

    waveChoppiness: {
      value: 0.9,
      min: 0,
      max: 2,
      step: 0.05,
    },

    waveSpeedScale: {
      value: 0.6,
      min: 0,
      max: 3,
      step: 0.02,
    },

    waveSegments: {
      value: 128,
      options: [32, 64, 128, 256],
    },

    recomputeNormals: true,
  });

  useEffect(() => {
    if (!geoRef.current) return;

    basePositions.current =
      geoRef.current.attributes.position.array.slice() as Float32Array;
  }, [waveSegments]);

  useFrame(({ clock }) => {
    if (
      !waveEnabled ||
      !geoRef.current ||
      !basePositions.current
    )
      return;

    const pos =
      geoRef.current.attributes.position as THREE.BufferAttribute;

    const base = basePositions.current;

    const t = clock.getElapsedTime() * waveSpeedScale;

    for (let i = 0; i < pos.count; i++) {
      const x0 = base[i * 3];
      const y0 = base[i * 3 + 1];

      let dx = 0;
      let dy = 0;
      let dz = 0;

      for (const w of WAVE_LAYERS) {
        const phase =
          w.k * (w.dirX * x0 + w.dirY * y0) +
          w.speed * t;

        const cosP = Math.cos(phase);
        const sinP = Math.sin(phase);

        const amp = w.amplitude * waveHeightScale;
        const q = w.steepness * waveChoppiness;

        dx += q * amp * w.dirX * cosP;
        dy += q * amp * w.dirY * cosP;
        dz += amp * sinP;
      }

      pos.setXYZ(
        i,
        x0 + dx,
        y0 + dy,
        dz
      );
    }

    pos.needsUpdate = true;

    if (recomputeNormals) {
      geoRef.current.computeVertexNormals();
    }
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, posY, 0]}
      receiveShadow
    >
      <planeGeometry
        ref={geoRef}
        args={[
          1000,
          1000,
          waveSegments,
          waveSegments,
        ]}
      />

      <MeshReflectorMaterial
        transparent
        opacity={opacity}

        color={waterColor}

        resolution={resolution}

        mirror={
          patternEnabled
            ? mirror
            : 1
        }

        blur={
          patternEnabled
            ? [blurX, blurY]
            : [0, 0]
        }

        mixBlur={
          patternEnabled
            ? mixBlur
            : 0
        }

        mixStrength={
          patternEnabled
            ? mixStrength
            : 0
        }

        roughness={
          patternEnabled
            ? roughness
            : 0.03
        }

        metalness={
          patternEnabled
            ? metalness
            : 0
        }

        depthScale={
          patternEnabled
            ? depthScale
            : 0
        }

        minDepthThreshold={minDepthThreshold}

        maxDepthThreshold={maxDepthThreshold}
      />
    </mesh>
  );
}