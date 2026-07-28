// components/World/Transition/CloudVeil.tsx
"use client";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useTransitionManager } from "@/components/World/Transition/TransitionManager";
import { useWorldState } from "@/components/World/WorldState";
import { CloudVeilMaterial } from "./CloudVeilMaterial";

const VEIL_DISTANCE = 15;
// Baseline drift multiplier so the Leva `cloudDrift` slider produces roughly
// the same idle speed as before, when it wasn't wired to anything.
const AMBIENT_SPEED = 0.05;

export default function CloudVeil() {
  const { camera } = useThree();
  const { densityRef, config } = useTransitionManager();
  const { progressRef } = useWorldState();
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => new CloudVeilMaterial(), []);

  // Replaces raw elapsed time as the shader's "clock". Advances on its own
  // each frame (ambient idle drift, unchanged feel) AND gets an extra push
  // proportional to how much progress actually moved that frame — so a fast
  // scroll visibly pushes the cloud noise faster, and a paused scroll settles
  // back to the same slow ambient drift as before.
  const flowRef = useRef(0);
  const prevProgressRef = useRef(progressRef.current);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const density = densityRef.current;
    mesh.visible = density > 0.001;

    const scrollDelta = Math.abs(progressRef.current - prevProgressRef.current);
    prevProgressRef.current = progressRef.current;
    flowRef.current += delta * config.cloudDrift * AMBIENT_SPEED + scrollDelta * config.cloudScrollCoupling;

    if (!mesh.visible) return;

    camera.getWorldDirection(dir);
    mesh.position.copy(camera.position).addScaledVector(dir, VEIL_DISTANCE);
    mesh.quaternion.copy(camera.quaternion);

    const cam = camera as THREE.PerspectiveCamera;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const height = 2 * Math.tan(vFov / 2) * VEIL_DISTANCE * 1.15;
    const width = height * cam.aspect * 1.15;
    mesh.scale.set(width, height, 1);

    material.update(flowRef.current, density);
  });

  return (
    <mesh ref={meshRef} renderOrder={999}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}