"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useControls } from "leva";
import type { CameraControls } from "@react-three/drei";
import { useWorldState } from "@/components/World/WorldState";
import {
  getWorldCameraState,
  smoothProgress,
  getIdleCloudDrift,
  ISLAND_ENDPOINT,
  SPACE_ENDPOINT,
  SPACE_ZOOM_ENDPOINT,
  ENTER_ISLAND_THRESHOLD,
  getIslandArrivalT,
} from "@/components/World/WorldTimeline";
import { useJourney } from "@/components/Journey/JourneyProvider";
import { useTransitionManager } from "@/components/World/Transition/TransitionManager";
import { computeLookAtQuaternion } from "@/components/Journey/cameraHelpers";

const ARRIVED_EPSILON = 0.001;
const PHASE_HYSTERESIS = 0.01;
const ISLAND_EXIT_DISTANCE = 40;

const DRAG_SENSITIVITY = 0.005;
const POLAR_CLAMP = 0.15;

// Lenis (WorldInput) already smooths the scroll. This is only a light follow to hide
// frame quantisation — the old 3.5 stacked a second ~0.3s smoothing layer on top of
// Lenis, which is what made scrolling feel mushy/laggy and slow to reverse.
const SCROLL_FOLLOW_SPEED = 18;

// Clamp frame delta so one slow frame (shader compile, GC) can't make the camera jump.
const MAX_DT = 0.05;

export default function WorldCamera() {
  const { phase, cameraOwner, roaming, setPhase, setCameraOwner, progressRef, targetProgressRef } = useWorldState();
  const { corridorRef, insideCloudsRef, assetsReady, config } = useTransitionManager();
  const controls = useThree((s) => s.controls) as CameraControls | null;
  const gl = useThree((s) => s.gl);
  const hasSyncedIslandEntry = useRef(false);
  const { started, isTransitioning } = useJourney();

  const baseSpherical = useRef(
    new THREE.Spherical().setFromVector3(new THREE.Vector3(...SPACE_ENDPOINT.position))
  );
  const zoomRadius = useRef(new THREE.Vector3(...SPACE_ZOOM_ENDPOINT.position).length());
  const dragTheta = useRef(0);
  const dragPhi = useRef(0);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const holdElapsedRef = useRef(0);
  const debugClock = useRef(0);

  // Scratch objects — nothing allocated per frame in the hot path.
  const scratch = useRef({
    spherical: new THREE.Spherical(),
    spacePos: new THREE.Vector3(),
    zoomPos: new THREE.Vector3(),
    finalPos: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
  }).current;

  const [, setDebug] = useControls(
    "World Phase Debug",
    () => ({
      phase: { value: "SPACE", editable: false },
      progress: { value: 0, editable: false },
      targetProgress: { value: 0, editable: false },
      arrivalT: { value: 0, editable: false },
    }),
    { collapsed: true }
  );

  useEffect(() => {
    setCameraOwner(started ? "journey" : "world");
  }, [started, setCameraOwner]);

  useEffect(() => {
    if (!controls) return;
    controls.enabled = roaming || (phase === "ISLAND" && started && !isTransitioning);
  }, [controls, phase, started, isTransitioning, roaming]);

  useEffect(() => {
    if (phase === "ISLAND" && controls && !hasSyncedIslandEntry.current) {
      controls.setLookAt(
        ISLAND_ENDPOINT.position[0], ISLAND_ENDPOINT.position[1], ISLAND_ENDPOINT.position[2],
        ISLAND_ENDPOINT.lookAt[0], ISLAND_ENDPOINT.lookAt[1], ISLAND_ENDPOINT.lookAt[2],
        false
      );
      hasSyncedIslandEntry.current = true;
    }
    if (phase !== "ISLAND") hasSyncedIslandEntry.current = false;
  }, [phase, controls]);

  useEffect(() => {
    const el = gl.domElement;
    function onPointerDown(e: PointerEvent) {
      if (phaseRef.current !== "SPACE") return;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
    function onPointerMove(e: PointerEvent) {
      if (!isDragging.current || phaseRef.current !== "SPACE") return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      dragTheta.current -= dx * DRAG_SENSITIVITY;
      dragPhi.current = Math.max(
        POLAR_CLAMP - baseSpherical.current.phi,
        Math.min(Math.PI - POLAR_CLAMP - baseSpherical.current.phi, dragPhi.current - dy * DRAG_SENSITIVITY)
      );
    }
    function onPointerUp() {
      isDragging.current = false;
    }
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [gl]);

  useFrame((state, delta) => {
    if (roaming) return;
    if (cameraOwner === "journey") return;

    if (phase === "ISLAND") {
      if (!started && targetProgressRef.current + ARRIVED_EPSILON < progressRef.current) {
        setPhase("TRANSITION_TO_SPACE");
        return;
      }

      if (!controls) return;
      const dist = controls.distance;
      const scrollingOut = targetProgressRef.current < progressRef.current;
      if (dist >= ISLAND_EXIT_DISTANCE && scrollingOut) setPhase("TRANSITION_TO_SPACE");
      return;
    }

    const dt = Math.min(delta, MAX_DT);

    const theta = baseSpherical.current.theta + dragTheta.current;
    const phi = baseSpherical.current.phi + dragPhi.current;
    scratch.spherical.set(baseSpherical.current.radius, phi, theta);
    scratch.spacePos.setFromSpherical(scratch.spherical);
    scratch.spherical.set(zoomRadius.current, phi, theta);
    scratch.zoomPos.setFromSpherical(scratch.spherical);

    progressRef.current = smoothProgress(progressRef.current, targetProgressRef.current, dt, SCROLL_FOLLOW_SPEED);
    const p = progressRef.current;
    const arrivalT = getIslandArrivalT(p, config.islandArrivalSpan);

    // The corridor ref starts as [0,0,0]. On the first frame(s) of a transition the
    // corridor hasn't been sampled yet, so using it would put the camera INSIDE the Sun.
    const c = corridorRef.current;
    const corridorReady =
      c.position[0] * c.position[0] + c.position[1] * c.position[1] + c.position[2] * c.position[2] > 1e-6;

    if (insideCloudsRef.current && corridorReady) {
      const { position, lookAt, fov, bank } = c;

      const holding = !assetsReady;
      holdElapsedRef.current = holding ? holdElapsedRef.current + dt : 0;
      const drift = holding ? getIdleCloudDrift(holdElapsedRef.current) : ([0, 0, 0] as [number, number, number]);

      scratch.finalPos.set(position[0] + drift[0], position[1] + drift[1], position[2] + drift[2]);
      scratch.lookAt.set(lookAt[0], lookAt[1], lookAt[2]);

      state.camera.position.copy(scratch.finalPos);
      if (Math.abs(bank) > 0.0005) {
        state.camera.quaternion.copy(computeLookAtQuaternion(scratch.finalPos, scratch.lookAt, bank));
      } else {
        state.camera.lookAt(scratch.lookAt);
      }
      if ("fov" in state.camera) {
        (state.camera as any).fov = fov;
        (state.camera as any).updateProjectionMatrix();
      }
    } else {
      const { position, lookAt, fov } = getWorldCameraState(
        p,
        [scratch.spacePos.x, scratch.spacePos.y, scratch.spacePos.z],
        [scratch.zoomPos.x, scratch.zoomPos.y, scratch.zoomPos.z]
      );
      state.camera.position.set(position[0], position[1], position[2]);
      state.camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
      if ("fov" in state.camera) {
        (state.camera as any).fov = fov;
        (state.camera as any).updateProjectionMatrix();
      }
    }

    if (phase === "SPACE" && p >= ENTER_ISLAND_THRESHOLD) {
      setPhase("TRANSITION_TO_ISLAND");
    }

    if (phase === "TRANSITION_TO_ISLAND") {
      if (p < ENTER_ISLAND_THRESHOLD - PHASE_HYSTERESIS) {
        setPhase("SPACE");
      } else if (arrivalT >= 1 - ARRIVED_EPSILON && assetsReady) {
        setPhase("ISLAND");
      }
    }

    if (phase === "TRANSITION_TO_SPACE") {
      if (p < ENTER_ISLAND_THRESHOLD - PHASE_HYSTERESIS) {
        setPhase("SPACE");
      } else if (arrivalT >= 1 - ARRIVED_EPSILON && assetsReady) {
        setPhase("ISLAND");
      }
    }

    // Leva store writes trigger React work — was every frame, now 4x/second.
    debugClock.current += delta;
    if (debugClock.current >= 0.25) {
      debugClock.current = 0;
      setDebug({
        phase,
        progress: Number(p.toFixed(4)),
        targetProgress: Number(targetProgressRef.current.toFixed(4)),
        arrivalT: Number(arrivalT.toFixed(4)),
      });
    }
  });

  return null;
}
