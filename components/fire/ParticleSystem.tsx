"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface ParticleSystemProps {
  count?: number;
  position?: [number, number, number];

  area?: [number, number, number];

  size?: number;

  color?: string;

  speed?: number;

  riseSpeed?: number;

  opacity?: number;

  flicker?: boolean;
}

export default function ParticleSystem({
  count = 120,
  position = [0, 0, 0],
  area = [1, 2, 1],
  size = 0.08,
  color = "#ffb347",
  speed = 1,
  riseSpeed = 0.6,
  opacity = 0.9,
  flicker = true,
}: ParticleSystemProps) {
  const points = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * area[0];

      arr[i * 3 + 1] = Math.random() * area[1];

      arr[i * 3 + 2] = (Math.random() - 0.5) * area[2];
    }

    return arr;
  }, [count, area]);

  useFrame((state, delta) => {
    const geometry = points.current.geometry;
    const attribute =
      geometry.attributes.position as THREE.BufferAttribute;

    const array = attribute.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const index = i * 3;

      array[index + 1] += riseSpeed * delta * speed;

      array[index] +=
        Math.sin(state.clock.elapsedTime * 2 + i) *
        0.002;

      array[index + 2] +=
        Math.cos(state.clock.elapsedTime * 2 + i) *
        0.002;

      if (array[index + 1] > area[1]) {
        array[index] =
          (Math.random() - 0.5) * area[0];

        array[index + 1] = 0;

        array[index + 2] =
          (Math.random() - 0.5) * area[2];
      }
    }

    attribute.needsUpdate = true;

    if (flicker) {
      const material =
        points.current.material as THREE.PointsMaterial;

      material.opacity =
        opacity *
        (0.75 +
          Math.sin(state.clock.elapsedTime * 18) *
            0.15);
    }
  });

  return (
    <group position={position}>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={positions}
            count={count}
            itemSize={3}
          />
        </bufferGeometry>

        <pointsMaterial
          color={color}
          size={size}
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
}