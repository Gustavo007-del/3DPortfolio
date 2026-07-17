"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ShibaModel() {
  const { scene, animations } = useGLTF("/models/shiba.glb");
  const { actions, names } = useAnimations(animations, scene);
  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const targetRef = useRef(new THREE.Vector3());
  const lastPointerYRef = useRef(0);
  const jumpImpulseRef = useRef(0);
  const hopTimeRef = useRef(0);
  const currentClipRef = useRef<string | null>(null);
  const { pointer, viewport } = useThree();

  const findClip = (keywords: string[]) =>
    names.find((name) =>
      keywords.some((keyword) => name.toLowerCase().includes(keyword))
    );

  const idleClip = findClip(["idle", "stand", "wait"]) ?? names[0];
  const runClip = findClip(["run", "walk", "hop", "jump"]) ?? idleClip;
  const jumpClip = findClip(["jump", "hop", "leap"]) ?? runClip;

  const playClip = (clipName: string | undefined, loop = true) => {
    if (!clipName || currentClipRef.current === clipName || !actions[clipName]) {
      return;
    }

    const nextAction = actions[clipName];
    const currentAction = currentClipRef.current
      ? actions[currentClipRef.current]
      : undefined;

    currentAction?.fadeOut(0.15);
    nextAction
      ?.reset()
      .setEffectiveTimeScale(1)
      .setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity)
      .fadeIn(0.15)
      .play();

    currentClipRef.current = clipName;
  };

  useEffect(() => {
    playClip(idleClip);
  }, [idleClip]);

  useFrame((_, delta) => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    targetRef.current.set(
      pointer.x * viewport.width * 0.38,
      0,
      -pointer.y * viewport.height * 0.22
    );

    const pointerRise = pointer.y - lastPointerYRef.current;
    lastPointerYRef.current = pointer.y;

    if (pointerRise > 0.035) {
      jumpImpulseRef.current = Math.min(jumpImpulseRef.current + pointerRise * 5, 1);
      playClip(jumpClip, false);
    }

    const toTarget = targetRef.current.clone().sub(group.position);
    toTarget.y = 0;
    const distance = toTarget.length();
    const isMoving = distance > 0.03;
    const hasRiggedAnimations = names.length > 0;

    if (isMoving) {
      toTarget.normalize();
      velocityRef.current.lerp(toTarget.multiplyScalar(Math.min(distance * 6, 4)), 0.08);
      group.position.addScaledVector(velocityRef.current, delta);

      const targetRotation = Math.atan2(velocityRef.current.x, velocityRef.current.z);
      group.rotation.y = THREE.MathUtils.lerp(
        group.rotation.y,
        targetRotation,
        1 - Math.pow(0.001, delta)
      );

      if (jumpImpulseRef.current <= 0.1) {
        playClip(runClip);
      }
    } else {
      velocityRef.current.multiplyScalar(0.86);

      if (jumpImpulseRef.current <= 0.1) {
        playClip(idleClip);
      }
    }

    hopTimeRef.current += delta * (isMoving ? 10 : 3);
    jumpImpulseRef.current = Math.max(0, jumpImpulseRef.current - delta * 2.4);

    const travelHop = isMoving && !hasRiggedAnimations
      ? Math.abs(Math.sin(hopTimeRef.current)) * 0.22
      : 0;
    const cursorJump = Math.sin(jumpImpulseRef.current * Math.PI) * 0.42;
    group.position.y = travelHop + cursorJump;
    group.rotation.z = hasRiggedAnimations
      ? 0
      : Math.sin(hopTimeRef.current) * (isMoving ? 0.08 : 0.025);
    group.rotation.x = hasRiggedAnimations
      ? 0
      : Math.cos(hopTimeRef.current * 1.4) * (isMoving ? 0.06 : 0.02);
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        scale={1}
        position={[0, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload("/models/shiba.glb");
