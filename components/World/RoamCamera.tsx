// components/World/RoamCamera.tsx
"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import * as THREE from "three";
import { useWorldState } from "@/components/World/WorldState";

const MOVE_SPEED = 14;
const DAMPING = 8;
const ROAM_START_POSITION = [23, 40, 30] as const;
const ROAM_START_LOOK_AT = [36, 50, 0] as const;

export default function RoamCamera() {
  const { roaming } = useWorldState();
  const { camera } = useThree();
  const controls = useRef<CameraControls>(null);

  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const didInitializeRoam = useRef(false);
  const savedState = useRef<{ position: THREE.Vector3; quaternion: THREE.Quaternion } | null>(null);

  // Snapshot camera pose the moment roaming starts, restore it the moment
  // roaming ends — so returning to scroll mode doesn't leave the camera
  // stranded wherever the user wandered off to.
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
  }, [roaming, camera]);

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
      // Apply the configured pose directly before enabling controls. This
      // prevents the previous CameraControls state from winning for a frame.
      camera.position.set(...ROAM_START_POSITION);
      camera.lookAt(...ROAM_START_LOOK_AT);
      control.setLookAt(
        ROAM_START_POSITION[0],
        ROAM_START_POSITION[1],
        ROAM_START_POSITION[2],
        ROAM_START_LOOK_AT[0],
        ROAM_START_LOOK_AT[1],
        ROAM_START_LOOK_AT[2],
        false
      );
      const actualLookAt = control.getTarget(new THREE.Vector3());
      console.log("[RoamCamera] current roam view", {
        position: camera.position.toArray(),
        lookAt: actualLookAt.toArray(),
      });
      control.minDistance = 2;
      control.maxDistance = 300;
      control.maxPolarAngle = Math.PI - 0.05;
      control.minPolarAngle = 0.05;
    }
  }, [roaming, camera]);

  
  useFrame((_, delta) => {
    if (!roaming) {
      didInitializeRoam.current = false;
      return;
    }

    if (!didInitializeRoam.current) {
      const control = controls.current;
      camera.position.set(...ROAM_START_POSITION);
      camera.lookAt(...ROAM_START_LOOK_AT);
      if (control) {
        control.setLookAt(
          ROAM_START_POSITION[0], ROAM_START_POSITION[1], ROAM_START_POSITION[2],
          ROAM_START_LOOK_AT[0], ROAM_START_LOOK_AT[1], ROAM_START_LOOK_AT[2],
          false
        );
      }
      didInitializeRoam.current = true;
    }

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

    const wish = new THREE.Vector3();
    if (keys.current["KeyW"] || keys.current["ArrowUp"]) wish.add(forward);
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) wish.sub(forward);
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) wish.add(right);
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) wish.sub(right);
    if (keys.current["Space"]) wish.y += 1;
    if (keys.current["ShiftLeft"] || keys.current["ControlLeft"]) wish.y -= 1;

    if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(MOVE_SPEED);

    const t = 1 - Math.exp(-DAMPING * delta);
    velocity.current.lerp(wish, t);
    camera.position.addScaledVector(velocity.current, delta);
  });

  return <CameraControls ref={controls} makeDefault enabled={false} smoothTime={0.15} />;
}
