// components/World/RoamCamera.tsx
"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import * as THREE from "three";
import { useWorldState } from "@/components/World/WorldState";

const MOVE_SPEED = 14;
const DAMPING = 8;

export default function RoamCamera() {
  const { roaming, phase, cameraOwner } = useWorldState();
  const { camera } = useThree();
  const controls = useRef<CameraControls>(null);

  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const savedState = useRef<{ position: THREE.Vector3; quaternion: THREE.Quaternion } | null>(null);
  const scratchForward = useRef(new THREE.Vector3());
  const scratchTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (roaming) {
      savedState.current = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
      };
    } else if (savedState.current) {
      camera.position.copy(savedState.current.position);
      camera.quaternion.copy(savedState.current.quaternion);
      savedState.current = null;
      velocity.current.set(0, 0, 0);
    }
  }, [roaming, camera, phase, cameraOwner]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { keys.current[e.code] = true; }
    function onKeyUp(e: KeyboardEvent) { keys.current[e.code] = false; }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const control = controls.current;
    if (!control) return;

    control.enabled = roaming;

    if (roaming) {
      control.minDistance = 2;
      control.maxDistance = 300;
      control.maxPolarAngle = Math.PI - 0.05;
      control.minPolarAngle = 0.05;
    }
  }, [roaming, camera]);

  useFrame((_, delta) => {
    const control = controls.current;
    if (!control) return;

    if (!roaming) {
      camera.getWorldDirection(scratchForward.current);
      scratchTarget.current
        .copy(camera.position)
        .addScaledVector(scratchForward.current, 10);
      control.setPosition(camera.position.x, camera.position.y, camera.position.z, false);
      control.setTarget(scratchTarget.current.x, scratchTarget.current.y, scratchTarget.current.z, false);
      return;
    }

    const wish = new THREE.Vector3();
    if (keys.current["KeyW"] || keys.current["ArrowUp"]) wish.z += 1;
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) wish.z -= 1;
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) wish.x += 1;
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) wish.x -= 1;
    if (keys.current["Space"]) wish.y += 1;
    if (keys.current["ShiftLeft"] || keys.current["ControlLeft"]) wish.y -= 1;

    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(MOVE_SPEED);

    const t = 1 - Math.exp(-DAMPING * delta);
    velocity.current.lerp(wish, t);

    control.forward(velocity.current.z * delta, false);
    control.truck(velocity.current.x * delta, velocity.current.y * delta, false);
  });

  return <CameraControls ref={controls} makeDefault enabled={false} smoothTime={0.15} />;
}