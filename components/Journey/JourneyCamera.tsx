"use client";

import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DEFAULT_CAMERA } from "@/lib/camera";
import { JourneyStop } from "@/lib/journey";
import { useJourney } from "./JourneyProvider";
import { consumeRideExitJourneyTransition } from "@/components/Island/boat-ride/boatRideStore";
import { createIslandTourCurve, getIslandTourFocus, getIslandTourFov, ISLAND_TOUR_END, ISLAND_TOUR_FOCUS, ISLAND_TOUR_SECONDS } from "@/lib/islandCinematic";

export default function JourneyCamera() {
  const controls = useRef<CameraControls>(null);
  const transitionId = useRef(0);
  const firstJourneyEffect = useRef(true);
  /** True while transitionToStop owns the isTransitioning flag. Critical to
   *  release on unmount: an awaited setLookAt on disposed controls never
   *  resolves, which left isTransitioning stuck true forever and silently
   *  blocked every boat-ride click (the §12 guard). */
  const pendingTrans = useRef(false);
  const tourRef = useRef<{ elapsed: number; curve: THREE.CatmullRomCurve3; startTarget: THREE.Vector3; startFov: number } | null>(null);

  const {
    started,
    currentStop,
    beginTransition,
    finishTransition,
    setCameraState,
    cinematic,
    finishCinematic,
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

    if (controls.current.camera instanceof THREE.PerspectiveCamera) {
      controls.current.camera.fov = 45;
      controls.current.camera.updateProjectionMatrix();
    }

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

    // BoatRideCamera owns the camera during a ride, so this component is
    // remounted after the exit tween. The island stop is already active then;
    // restore control without replaying its welcome/arrival overlay.
    if (firstJourneyEffect.current) {
      firstJourneyEffect.current = false;
      if (consumeRideExitJourneyTransition()) {
        setCameraState("idle");
        finishTransition();
        return;
      }
    }

    void transitionToStop();
  }, [started, currentStop]);

  // Contact unlocks a timed orbit. CameraControls owns the camera throughout;
  // the curve is sampled in the render loop for steady motion and exact timing.
  useEffect(() => {
    if (!started || cinematic !== "playing" || !controls.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishCinematic();
      return;
    }
    const cameraControls = controls.current;
    transitionId.current++;
    cameraControls.stop();
    tourRef.current = {
      elapsed: 0,
      curve: createIslandTourCurve(cameraControls.camera.position),
      startTarget: cameraControls.getTarget(new THREE.Vector3()),
      startFov: cameraControls.camera instanceof THREE.PerspectiveCamera ? cameraControls.camera.fov : 45,
    };

    beginTransition();
    pendingTrans.current = true;
    setCameraState("moving");
    return () => {
      tourRef.current = null;
      transitionId.current++;
      cameraControls.stop();
      if (pendingTrans.current) {
        pendingTrans.current = false;
        finishTransition();
      }
      setCameraState("idle");
    };
  }, [started, cinematic]);

  // Skipping and natural completion share the same wide final frame.
  useEffect(() => {
    if (cinematic !== "complete") return;
    void controls.current?.setLookAt(
      ISLAND_TOUR_END.x, ISLAND_TOUR_END.y, ISLAND_TOUR_END.z,
      ISLAND_TOUR_FOCUS.x, ISLAND_TOUR_FOCUS.y, ISLAND_TOUR_FOCUS.z,
      false
    );
    if (controls.current?.camera instanceof THREE.PerspectiveCamera) {
      controls.current.camera.fov = 50;
      controls.current.camera.updateProjectionMatrix();
    }
  }, [cinematic]);

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

  useFrame(({ camera }, delta) => {
    const tour = tourRef.current;
    if (tour && controls.current) {
      tour.elapsed = Math.min(ISLAND_TOUR_SECONDS, tour.elapsed + Math.min(delta, 0.05));
      const t = tour.elapsed / ISLAND_TOUR_SECONDS;
      const position = tour.curve.getPointAt(t);
      const focus = getIslandTourFocus(t, tour.startTarget);
      void controls.current.setLookAt(position.x, position.y, position.z, focus.x, focus.y, focus.z, false);
      if (camera instanceof THREE.PerspectiveCamera) {
        const fov = getIslandTourFov(t, tour.startFov);
        if (Math.abs(camera.fov - fov) > 0.01) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
      }
      if (t >= 1) {
        tourRef.current = null;
        pendingTrans.current = false;
        finishTransition();
        setCameraState("idle");
        finishCinematic();
      }
    }
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
