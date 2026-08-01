// components/effects/Comet.tsx
"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CometTrailMaterial } from "./CometMaterial";

const TRAIL_LENGTH = 60;
// Full cycle: traverse the path, fade out near the end, pause, then a new
// randomized orbit begins — this is what stops it feeling like a fixed
// decoration on a repeating loop.
const CYCLE_SECONDS = 22;
const FADE_FRACTION = 0.15; // fraction of the cycle spent fading in/out at each end

function randomOrbit() {
  return {
    semiMajor: 30 + Math.random() * 25,
    eccentricity: 0.55 + Math.random() * 0.3, // higher = more elongated, more speed variation
    tiltX: (Math.random() - 0.5) * Math.PI * 0.6,
    tiltZ: Math.random() * Math.PI * 2,
    yWobble: 3 + Math.random() * 6,
  };
}

// Position on an eccentric ellipse parameterized by true anomaly `t` (0..2π),
// with the Sun at one focus (0,0,0) — real comets move fastest near
// perihelion, slowest near aphelion, which is exactly what this produces
// once `t` is advanced by a speed that itself depends on distance (see below).
function ellipsePosition(t: number, orbit: ReturnType<typeof randomOrbit>) {
  const { semiMajor, eccentricity } = orbit;
  const r = (semiMajor * (1 - eccentricity * eccentricity)) / (1 + eccentricity * Math.cos(t));
  const x = Math.cos(t) * r;
  const z = Math.sin(t) * r;
  const y = Math.sin(t * 0.5) * orbit.yWobble;

  const v = new THREE.Vector3(x, y, z);
  v.applyAxisAngle(new THREE.Vector3(1, 0, 0), orbit.tiltX);
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit.tiltZ);
  return v;
}

export default function Comet() {
  const headRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const orbitRef = useRef(randomOrbit());
  const trueAnomalyRef = useRef(Math.random() * Math.PI * 2);
  const cycleElapsedRef = useRef(0);
  const history = useRef<THREE.Vector3[]>(
    Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3())
  );
  const historyFilled = useRef(0);

  const trailMaterial = useMemo(() => new CometTrailMaterial(), []);

  const { geometry, sizeAttr, alphaAttr, colorAttr } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(TRAIL_LENGTH * 3);
    const sizes = new Float32Array(TRAIL_LENGTH);
    const alphas = new Float32Array(TRAIL_LENGTH);
    const colors = new Float32Array(TRAIL_LENGTH * 3);

    const hot = new THREE.Color("#ffffff");
    const cool = new THREE.Color("#6fb8ff");
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const f = i / (TRAIL_LENGTH - 1); // 0 at head, 1 at tail end
      sizes[i] = THREE.MathUtils.lerp(2.2, 0.15, f);
      alphas[i] = Math.pow(1 - f, 2.2);
      const c = hot.clone().lerp(cool, f);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    return { geometry: g, sizeAttr: sizes, alphaAttr: alphas, colorAttr: colors };
  }, []);

  useFrame((_, delta) => {
    cycleElapsedRef.current += delta;
    let cycleT = cycleElapsedRef.current / CYCLE_SECONDS;

    if (cycleT >= 1) {
      // Start a brand new pass: fresh orbit shape, tilt, and eccentricity —
      // so consecutive passes genuinely look different, not a repeating loop.
      orbitRef.current = randomOrbit();
      trueAnomalyRef.current = Math.random() * Math.PI * 2;
      cycleElapsedRef.current = 0;
      cycleT = 0;
      historyFilled.current = 0;
    }

    // Fade envelope: in during the first FADE_FRACTION, out during the last.
    const fadeIn = Math.min(1, cycleT / FADE_FRACTION);
    const fadeOut = Math.min(1, (1 - cycleT) / FADE_FRACTION);
    const envelope = Math.min(fadeIn, fadeOut);

    const orbit = orbitRef.current;
    const pos = ellipsePosition(trueAnomalyRef.current, orbit);

    // Kepler-ish speed: angular rate scales with 1/r^2 (faster near the Sun,
    // the whole point of using true anomaly instead of constant-speed time).
    const dist = pos.length();
    const angularSpeed = THREE.MathUtils.clamp(35 / (dist * dist), 0.05, 1.4);
    trueAnomalyRef.current += angularSpeed * delta;

    if (headRef.current) headRef.current.position.copy(pos);
    if (glowRef.current) glowRef.current.position.copy(pos);

    // Shift trail history, insert newest at front.
    const hist = history.current;
    for (let i = hist.length - 1; i > 0; i--) hist[i].copy(hist[i - 1]);
    hist[0].copy(pos);
    historyFilled.current = Math.min(TRAIL_LENGTH, historyFilled.current + 1);

    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      posAttr.setXYZ(i, hist[i].x, hist[i].y, hist[i].z);
    }
    posAttr.needsUpdate = true;

    // Apply the fade envelope on top of the precomputed per-point alpha
    // falloff, and hide points beyond however much history actually exists
    // yet (prevents a trail snapping into existence at full length on the
    // very first frames of a new pass).
    const alphaLive = geometry.getAttribute("aAlpha") as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const base = alphaAttr[i];
      const visible = i < historyFilled.current ? 1 : 0;
      alphaLive.setX(i, base * envelope * visible);
    }
    alphaLive.needsUpdate = true;

    if (headRef.current) {
      const mat = headRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = envelope;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = envelope * 0.6;
    }
  });

  return (
    <group>
      {/* Bright core */}
      <mesh ref={headRef}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color="#eaf6ff" transparent opacity={1} />
      </mesh>
      {/* Soft halo around the head, larger + dimmer, additive */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial
          color="#bfe3ff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <points ref={trailRef} geometry={geometry}>
        <primitive object={trailMaterial} attach="material" />
      </points>
    </group>
  );
}