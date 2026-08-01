// components/stars/StarField.tsx
"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

const COUNT = 6000;

const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3 aColor;

  uniform float uTime;

  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;

    float t = uTime * aSpeed + aPhase;
    vTwinkle = 0.55 + 0.3 * sin(t) + 0.15 * sin(t * 2.7 + aPhase);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z) * vTwinkle;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float alpha = smoothstep(1.0, 0.0, d);
    alpha = pow(alpha, 1.8);

    gl_FragColor = vec4(vColor * vTwinkle, alpha);
  }
`;

// How far (radians) the field tilts at full cursor deflection — small on
// purpose, this should read as "distant parallax," not "the sky is spinning."
const PARALLAX_STRENGTH = 0.06;
// Higher = snappier follow, lower = more of a lazy drift-behind feel.
const PARALLAX_EASE = 2.2;

export default function StarField() {
  const pointsRef = useRef<THREE.Points>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const { positions, sizes, phases, speeds, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const radius = 60 + Math.random() * 220;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = Math.random() < 0.05 ? 3.5 + Math.random() * 2.5 : 0.8 + Math.random() * 1.6;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.15 + Math.random() * 0.6;

      const temp = Math.random();
      const c = new THREE.Color();
      if (temp < 0.12) c.setRGB(0.65, 0.75, 1.0);
      else if (temp < 0.85) c.setRGB(1.0, 0.98, 0.92);
      else c.setRGB(1.0, 0.85, 0.65);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    return { positions, sizes, phases, speeds, colors };
  }, []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, sizes, phases, speeds, colors]);

  // Current eased rotation values, tracked outside React state since this
  // updates every frame.
  const currentX = useRef(0);
  const currentY = useRef(0);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;

    if (!pointsRef.current) return;

    // state.pointer is already normalized -1..1 across the canvas by R3F —
    // no manual mouse-tracking listeners needed.
    const targetY = -state.pointer.x * PARALLAX_STRENGTH;
    const targetX = state.pointer.y * PARALLAX_STRENGTH;

    // Smoothly ease toward the cursor-driven target rather than snapping —
    // this is what makes it feel like parallax drift instead of a rigid
    // 1:1 mouse-follow. No base rotation added anywhere, so it's fully
    // stationary the instant the cursor stops moving/centers.
    const t = 1 - Math.exp(-PARALLAX_EASE * delta);
    currentX.current += (targetX - currentX.current) * t;
    currentY.current += (targetY - currentY.current) * t;

    pointsRef.current.rotation.x = currentX.current;
    pointsRef.current.rotation.y = currentY.current;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} attach="material" />
    </points>
  );
}