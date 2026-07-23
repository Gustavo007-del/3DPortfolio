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
  // if (!controls.current) return;

  // const camera = controls.current.camera;

  // const target =
  //   controls.current.getTarget(new THREE.Vector3());

  // await controls.current.setLookAt(
  //   camera.position.x,

  //   camera.position.y + 0.15,

  //   camera.position.z,

  //   target.x,
  //   target.y,
  //   target.z,

  //   true
  // );
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
  finishTransition();
}
  useEffect(() => {
    if (!controls.current) return;

    if (!started) {
      resetCamera();
      return;
    }

    void transitionToStop();
  }, [started, currentStop]);

  const frameCount = useRef(0);

useFrame(({ camera }) => {
  frameCount.current++;
  // if (frameCount.current % 60 === 0) {
  //   console.log('[JourneyCamera:heartbeat]', frameCount.current, camera.position.toArray());
  // }

  const target = controls.current?.getTarget(new THREE.Vector3());

  const posBad = !Number.isFinite(camera.position.x) || !Number.isFinite(camera.position.y) || !Number.isFinite(camera.position.z);
  const quatBad = !Number.isFinite(camera.quaternion.x) || !Number.isFinite(camera.quaternion.y) || !Number.isFinite(camera.quaternion.z) || !Number.isFinite(camera.quaternion.w);

  if (posBad || quatBad) {
    console.warn('[JourneyCamera:BAD_CAMERA]', { posBad, quatBad, pos: camera.position.toArray(), quat: camera.quaternion.toArray() });
  }

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