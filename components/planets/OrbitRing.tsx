// components/planets/OrbitRing.tsx
"use client";

import { useMemo } from "react";
import * as THREE from "three";

export default function OrbitRing({ radius, color = "#6a8fc9" }: { radius: number; color?: string }) {
  const line = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 256;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(geometry, material);
  }, [radius, color]);

  return <primitive object={line} />;
}