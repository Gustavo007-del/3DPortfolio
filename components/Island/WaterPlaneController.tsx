"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useControls } from "leva";
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useIsActive } from "@/components/each-frame/WorldLOD";

// WAVE_LAYERS lives in waterSampler.ts so boat idle motion can sample the
// same wave field on the CPU (PLAN.md §6.1).
import { WAVE_LAYERS, setWaterConfig } from "./waterSampler";

void WAVE_LAYERS;

export default function WaterPlaneController() {
  const geoRef = useRef<THREE.PlaneGeometry>(null!);
  const basePositions = useRef<Float32Array | null>(null);
  const frameCount = useRef(0);

  // A hidden LODGroup still runs useFrame — without this gate the ~16k-vertex wave
  // displacement + normal recompute ran every frame during the whole Space phase.
  const active = useIsActive();

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

    patternEnabled: true,

    waveHeightScale: {
      value: 0.2,
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
      value: 0.78,
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
    // Keep the CPU sampler in sync with the leva-driven wave params.
    setWaterConfig({
      posY,
      waveEnabled,
      waveHeightScale,
      waveChoppiness,
      waveSpeedScale,
    });
  }, [posY, waveEnabled, waveHeightScale, waveChoppiness, waveSpeedScale]);

  useEffect(() => {
    if (!geoRef.current) return;

    basePositions.current =
      geoRef.current.attributes.position.array.slice() as Float32Array;
  }, [waveSegments]);

  useFrame((state) => {
    if (
      !active ||
      !waveEnabled ||
      !geoRef.current ||
      !basePositions.current
    )
      return;

    const pos = geoRef.current.attributes.position as THREE.BufferAttribute;

    const base = basePositions.current;

    // IMPORTANT: use state.clock.elapsedTime, NOT clock.getElapsedTime().
    // getElapsedTime() internally calls getDelta(), which resets the clock's
    // oldTime mid-frame — so the NEXT frame's `delta` (given to every useFrame in
    // the app, including the camera damping) comes out short and jittery.
    const t = state.clock.elapsedTime * waveSpeedScale;

    for (let i = 0; i < pos.count; i++) {
      const x0 = base[i * 3];
      const y0 = base[i * 3 + 1];

      let dx = 0;
      let dy = 0;
      let dz = 0;

      for (let k = 0; k < WAVE_LAYERS.length; k++) {
        const w = WAVE_LAYERS[k];
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

    // Normals every other frame — waves are slow, nobody can see the difference.
    if (recomputeNormals && (frameCount.current++ & 1) === 0) {
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
