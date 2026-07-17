// components/Island/GradientSkyController.tsx
"use client";

import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useControls } from "leva";

const vertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vWorldPosition;
  uniform vec3 colorTop;
  uniform vec3 colorMid;
  uniform vec3 colorHorizon;
  uniform float midStop;
  uniform float horizonStop;
  uniform float blurAmount;
  uniform float offset;
  uniform float exponent;

  void main() {
    float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
    float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
    t = pow(t, exponent);

    float b = blurAmount;
    vec3 col = mix(colorHorizon, colorMid, smoothstep(horizonStop - b, horizonStop + b, t));
    col = mix(col, colorTop, smoothstep(midStop - b, midStop + b, t));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function GradientSkyController() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const { colorTop, colorMid, colorHorizon, midStop, horizonStop, blurAmount, offset, exponent } =
    useControls("Sky Gradient", {
      colorTop: "#3d4a35",
      colorMid: "#d9c48a",
      colorHorizon: "#f5b942",
      midStop: { value: 0.68, min: 0, max: 1, step: 0.01 },
      horizonStop: { value: 0.42, min: 0, max: 1, step: 0.01 },
      blurAmount: { value: 0.22, min: 0, max: 0.5, step: 0.01 },
      offset: { value: 0, min: -500, max: 500, step: 1 },
      exponent: { value: 1, min: 0.1, max: 3, step: 0.05 },
    });

  const uniforms = useMemo(
    () => ({
      colorTop: { value: new THREE.Color(colorTop) },
      colorMid: { value: new THREE.Color(colorMid) },
      colorHorizon: { value: new THREE.Color(colorHorizon) },
      midStop: { value: midStop },
      horizonStop: { value: horizonStop },
      blurAmount: { value: blurAmount },
      offset: { value: offset },
      exponent: { value: exponent },
    }),
    []
  );

  useEffect(() => {
    uniforms.colorTop.value.set(colorTop);
    uniforms.colorMid.value.set(colorMid);
    uniforms.colorHorizon.value.set(colorHorizon);
    uniforms.midStop.value = midStop;
    uniforms.horizonStop.value = horizonStop;
    uniforms.blurAmount.value = blurAmount;
    uniforms.offset.value = offset;
    uniforms.exponent.value = exponent;
  }, [colorTop, colorMid, colorHorizon, midStop, horizonStop, blurAmount, offset, exponent, uniforms]);

  return (
    <mesh>
      <sphereGeometry args={[4500, 32, 15]} />
      <shaderMaterial
        ref={materialRef}
        side={THREE.BackSide}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  );
}