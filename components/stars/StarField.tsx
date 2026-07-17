"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export default function StarField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 5000;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => new Float32Array(count * 3), []);
  const speeds = useMemo(() => new Float32Array(count), []);
  const positions = useMemo(() => new Float32Array(count * 3), []);

  useMemo(() => {
    for (let i = 0; i < count; i++) {
      const radius = 50 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const c = new THREE.Color();
      c.setHSL(0.55 + Math.random() * 0.2, 0.3, 0.5 + Math.random() * 0.5);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      speeds[i] = 0.1 + Math.random() * 0.5;
    }
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      const twinkle = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * speeds[i] + i);
      const scale = 0.02 + twinkle * 0.08;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]));
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor!.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}