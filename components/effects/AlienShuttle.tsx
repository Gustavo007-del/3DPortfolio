// components/effects/AlienShuttle.tsx
"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CometTrailMaterial } from "./CometMaterial"; // reused for the engine trail glow

const TRAIL_LENGTH = 40;
const CYCLE_SECONDS = 24;
const FADE_FRACTION = 0.15;

function randomOrbit() {
  return {
    semiMajor: 30 + Math.random() * 25,
    eccentricity: 0.5 + Math.random() * 0.25,
    tiltX: (Math.random() - 0.5) * Math.PI * 0.6,
    tiltZ: Math.random() * Math.PI * 2,
    yWobble: 3 + Math.random() * 6,
  };
}

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

export default function AlienShuttle() {
  const shipRef = useRef<THREE.Group>(null);
  const hullRef = useRef<THREE.Mesh>(null);
  const domeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const lightsRef = useRef<THREE.PointLight[]>([]);
  const trailMaterial = useMemo(() => new CometTrailMaterial(), []);

  const orbitRef = useRef(randomOrbit());
  const trueAnomalyRef = useRef(Math.random() * Math.PI * 2);
  const prevPosRef = useRef<THREE.Vector3 | null>(null);
  const cycleElapsedRef = useRef(0);
  const history = useRef<THREE.Vector3[]>(
    Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3())
  );
  const historyFilled = useRef(0);

  const { geometry, alphaAttr } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(TRAIL_LENGTH * 3);
    const sizes = new Float32Array(TRAIL_LENGTH);
    const alphas = new Float32Array(TRAIL_LENGTH);
    const colors = new Float32Array(TRAIL_LENGTH * 3);

    const hot = new THREE.Color("#9dffb0"); // engine-glow green, not comet white
    const cool = new THREE.Color("#3a7bff");
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const f = i / (TRAIL_LENGTH - 1);
      sizes[i] = THREE.MathUtils.lerp(1.4, 0.1, f);
      alphas[i] = Math.pow(1 - f, 2.4);
      const c = hot.clone().lerp(cool, f);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    return { geometry: g, alphaAttr: alphas };
  }, []);

  useFrame((state, delta) => {
    cycleElapsedRef.current += delta;
    let cycleT = cycleElapsedRef.current / CYCLE_SECONDS;

    if (cycleT >= 1) {
      orbitRef.current = randomOrbit();
      trueAnomalyRef.current = Math.random() * Math.PI * 2;
      cycleElapsedRef.current = 0;
      cycleT = 0;
      historyFilled.current = 0;
      prevPosRef.current = null;
    }

    const fadeIn = Math.min(1, cycleT / FADE_FRACTION);
    const fadeOut = Math.min(1, (1 - cycleT) / FADE_FRACTION);
    const envelope = Math.min(fadeIn, fadeOut);

    const orbit = orbitRef.current;
    const pos = ellipsePosition(trueAnomalyRef.current, orbit);
    const dist = pos.length();
    const angularSpeed = THREE.MathUtils.clamp(30 / (dist * dist), 0.05, 1.2);
    trueAnomalyRef.current += angularSpeed * delta;

    if (shipRef.current) {
      shipRef.current.position.copy(pos);

      // Orient the ship along its direction of travel instead of leaving it
      // static — this alone sells "piloted craft" over "floating rock."
      if (prevPosRef.current) {
        const dir = pos.clone().sub(prevPosRef.current);
        if (dir.lengthSq() > 0.0001) {
          const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir.normalize(), new THREE.Vector3(0, 1, 0));
          const targetQuat = new THREE.Quaternion().setFromRotationMatrix(m);
          shipRef.current.quaternion.slerp(targetQuat, 0.15);
        }
      }
      prevPosRef.current = pos.clone();

      // Gentle idle bob + tiny roll wobble, like a hovering craft rather
      // than a rigid dead object being dragged along a rail.
      const t = state.clock.elapsedTime;
      shipRef.current.position.y += Math.sin(t * 1.6) * 0.08;
      shipRef.current.rotation.z += Math.sin(t * 0.9) * 0.0015;
    }

    // Spinning outer/inner rings — classic saucer detail.
    if (ring1Ref.current) ring1Ref.current.rotation.y += delta * 0.8;
    if (ring2Ref.current) ring2Ref.current.rotation.y -= delta * 1.3;

    // Pulsing dome material + blinking hull lights.
    if (domeMatRef.current) {
      domeMatRef.current.emissiveIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 2.5) * 0.4;
    }
    lightsRef.current.forEach((light, i) => {
      if (!light) return;
      const blink = Math.sin(state.clock.elapsedTime * 4 + i * Math.PI) > 0.5 ? 1 : 0.15;
      light.intensity = blink * 1.5 * envelope;
    });

    // Engine trail history — two-point emitter offset behind the ship along
    // its facing direction so it reads as thruster wake, not a centered tail.
    const hist = history.current;
    for (let i = hist.length - 1; i > 0; i--) hist[i].copy(hist[i - 1]);
    hist[0].copy(pos);
    historyFilled.current = Math.min(TRAIL_LENGTH, historyFilled.current + 1);

    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL_LENGTH; i++) posAttr.setXYZ(i, hist[i].x, hist[i].y, hist[i].z);
    posAttr.needsUpdate = true;

    const alphaLive = geometry.getAttribute("aAlpha") as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const visible = i < historyFilled.current ? 1 : 0;
      alphaLive.setX(i, alphaAttr[i] * envelope * visible);
    }
    alphaLive.needsUpdate = true;

    if (hullRef.current) {
      const mat = hullRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = envelope;
    }
  });

  return (
    <group>
      <group ref={shipRef}>
        {/* Saucer hull */}
        <mesh ref={hullRef} scale={[1, 0.32, 1]}>
          <sphereGeometry args={[0.9, 24, 16]} />
          <meshStandardMaterial
            color="#6b7280"
            metalness={0.85}
            roughness={0.25}
            transparent
          />
        </mesh>

        {/* Glass dome on top */}
        <mesh position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.42, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            ref={domeMatRef}
            color="#9dffb0"
            emissive="#4fff7a"
            emissiveIntensity={1.2}
            transparent
            opacity={0.75}
            roughness={0.1}
            metalness={0.1}
          />
        </mesh>

        {/* Outer rotating ring */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.05, 0.05, 8, 32]} />
          <meshStandardMaterial color="#3a3f4a" metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Inner counter-rotating ring, glowing */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.03, 8, 32]} />
          <meshBasicMaterial color="#4fff7a" />
        </mesh>

        {/* Blinking hull lights, mounted around the ring's circumference */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <pointLight
              key={i}
              ref={(el) => {
                if (el) lightsRef.current[i] = el;
              }}
              position={[Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0]}
              color="#4fff7a"
              intensity={1}
              distance={2}
            />
          );
        })}
      </group>

      <points geometry={geometry}>
        <primitive object={trailMaterial} attach="material" />
      </points>
    </group>
  );
}