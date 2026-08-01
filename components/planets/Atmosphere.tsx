// components/planets/Atmosphere.tsx
"use client";

import { useMemo } from "react";
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  uniform vec3 uColor;
  uniform float uIntensity;

  void main() {
    // Fresnel: view-facing normal ~ (0,0,1) in view space post-transform,
    // so a low dot-product (edge-on) means high glow — classic rim light.
    float rim = pow(1.0 - abs(vNormal.z), 3.0);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`;

export default function Atmosphere({
  radius,
  color = "#8fc6ff",
  intensity = 1.0,
  scale = 1.12,
}: {
  radius: number;
  color?: string;
  intensity?: number;
  scale?: number;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      }),
    [color, intensity]
  );

  return (
    <mesh scale={scale}>
      <sphereGeometry args={[radius, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}