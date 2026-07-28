"use client";

import { useRef, useMemo } from "react";
import { InstancedMesh, Object3D, DoubleSide } from "three";
import { useFrame } from "@react-three/fiber";

interface AsteroidBeltProps {
  innerRadius?: number;
  outerRadius?: number;
  count?: number;
}

export default function AsteroidBelt({
  innerRadius = 13,
  outerRadius = 16,
  count = 400,
}: AsteroidBeltProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  const instances = useMemo(() => {
    const data: { speed: number; axis: [number, number, number] }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 1.5;
      const scale = 0.05 + Math.random() * 0.12;

      dummy.position.set(x, y, z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      data.push({
        speed: (Math.random() * 0.05 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
        axis: [Math.random(), Math.random(), Math.random()],
      });
    }
    return data;
  }, [count, innerRadius, outerRadius, dummy]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const inst = instances[i];
      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      dummy.rotation.x += inst.axis[0] * inst.speed * delta;
      dummy.rotation.y += inst.axis[1] * inst.speed * delta;
      dummy.rotation.z += inst.axis[2] * inst.speed * delta;
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#888888"
        roughness={0.95}
        metalness={0.15}
        side={DoubleSide}
      />
    </instancedMesh>
  );
}
