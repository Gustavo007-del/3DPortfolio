"use client";

import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DEFAULT_CAMERA } from "@/lib/camera";
import { JourneyStop } from "@/lib/journey";
import { useJourney } from "./JourneyProvider";

export default function JourneyCamera() {
  const controls = useRef<CameraControls>(null);
  const transitionId = useRef(0);
  /** True while transitionToStop owns the isTransitioning flag. Critical to
   *  release on unmount: an awaited setLookAt on disposed controls never
   *  resolves, which left isTransitioning stuck true forever and silently
   *  blocked every boat-ride click (the §12 guard). */
  const pendingTrans = useRef(false);

  const {
    started,
    currentStop,
    beginTransition,
    finishTransition,
    setCameraState,
  } = useJourney();

  async function preMove() {
    if (!controls.current) return;

    const camera = controls.current.camera;
    const target = controls.current.getTarget(new THREE.Vector3());

    controls.current.smoothTime = 0.8;

    await controls.current.setLookAt(
      camera.position.x,
      camera.position.y + currentStop.transition.lift,
      camera.position.z,

      target.x,
      target.y,
      target.z,

      true
    );
  }

  async function fly() {
    if (!controls.current) return;

    controls.current.smoothTime =
      currentStop.transition.smoothTime;

    await controls.current.setLookAt(
      currentStop.camera.position[0],
      currentStop.camera.position[1],
      currentStop.camera.position[2],

      currentStop.camera.lookAt[0],
      currentStop.camera.lookAt[1],
      currentStop.camera.lookAt[2],

      true
    );
  }

  async function postMove() {
    // no-op for now
  }

  async function moveCamera() {
    await preMove();
    await fly();
    await postMove();
  }

  function resetCamera() {
    controls.current?.setLookAt(
      DEFAULT_CAMERA.position[0],
      DEFAULT_CAMERA.position[1],
      DEFAULT_CAMERA.position[2],

      DEFAULT_CAMERA.lookAt[0],
      DEFAULT_CAMERA.lookAt[1],
      DEFAULT_CAMERA.lookAt[2],

      false
    );
  }

  async function transitionToStop() {
    if (!controls.current) return;

    const id = ++transitionId.current;

    beginTransition();
    pendingTrans.current = true;
    setCameraState("moving");

    await preMove();

    if (id !== transitionId.current) return;

    await fly();

    if (id !== transitionId.current) return;

    await postMove();

    setCameraState("arriving");

    await new Promise((resolve) =>
      setTimeout(
        resolve,
        currentStop.transition.arrivalDelay * 1000
      )
    );

    if (id !== transitionId.current) return;

    setCameraState("idle");
    pendingTrans.current = false;
    finishTransition();
  }

  // Release the flag we started even if this camera unmounts mid-flight
  // (island phase change / ride hand-over) — otherwise it never clears.
  useEffect(() => {
    return () => {
      if (pendingTrans.current) {
        pendingTrans.current = false;
        finishTransition();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!controls.current) return;

    if (!started) {
      resetCamera();
      return;
    }

    void transitionToStop();
  }, [started, currentStop]);

  // Runs after the effect above: adopt the CURRENT camera pose as the
  // controls' target so a remount (e.g. after a boat ride restores the
  // previous view) never snaps to a stale/default target (PLAN §2.1/§9.1).
  const syncDir = useRef(new THREE.Vector3());
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const cam = c.camera;
    cam.getWorldDirection(syncDir.current);
    void c.setLookAt(
      cam.position.x,
      cam.position.y,
      cam.position.z,
      cam.position.x + syncDir.current.x,
      cam.position.y + syncDir.current.y,
      cam.position.z + syncDir.current.z,
      false
    );
  }, []);

  useFrame(({ camera }) => {
    const target = controls.current?.getTarget(new THREE.Vector3());

    (window as any).__cameraDebug = {
      px: camera.position.x.toFixed(3), py: camera.position.y.toFixed(3), pz: camera.position.z.toFixed(3),
      tx: target?.x.toFixed(3), ty: target?.y.toFixed(3), tz: target?.z.toFixed(3),
    };
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={1.4}
    />
  );
}