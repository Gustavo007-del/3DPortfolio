"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type FirefliesProps = {
  count?: number;
  radius?: number;
  height?: number;
};

export default function Fireflies({
  count = 200,
  radius = 180,
  height = 45,
}: FirefliesProps) {
  const points = useRef<THREE.Points>(null!);

  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.random() * height + 2;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      offsets[i] = Math.random() * 100;
    }

    return { positions, offsets };
  }, [count, radius, height]);

  useFrame((state) => {
    const pos =
      points.current.geometry.attributes.position as THREE.BufferAttribute;

    const arr = pos.array as Float32Array;

    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      arr[idx + 1] +=
        Math.sin(t * 0.8 + data.offsets[i]) * 0.003;

      arr[idx] +=
        Math.cos(t * 0.4 + data.offsets[i]) * 0.002;

      arr[idx + 2] +=
        Math.sin(t * 0.5 + data.offsets[i]) * 0.002;
    }

    pos.needsUpdate = true;

    const mat = points.current.material as THREE.PointsMaterial;

    mat.opacity =
      0.75 +
      Math.sin(t * 2) * 0.15;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={data.positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#fff6aa"
        size={0.18}
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  );
}