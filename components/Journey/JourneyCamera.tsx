"use client";

import { CameraControls, Line } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";
import { DEFAULT_CAMERA } from "@/lib/camera";
import { useJourney } from "./JourneyProvider";
import {
  createBezier,
  buildArcLengthTable,
  tForArcLength,
  getBankAngle,
  computeLookAtQuaternion,
  lerpVectorLinear,
  easeInOut,
  ArcLengthTable,
} from "@/components/Journey/cameraHelpers";

interface Flight {
  id: number;
  curve: THREE.CubicBezierCurve3;
  arcTable: ArcLengthTable;
  startLookAt: THREE.Vector3;
  endLookAt: THREE.Vector3;
  startTime: number;
  duration: number;
  maxBankDeg: number;
}

export default function JourneyCamera() {
  const controls = useRef<CameraControls>(null);
  const { camera } = useThree();

  const transitionId = useRef(0);
  const flightRef = useRef<Flight | null>(null);
  const bankRef = useRef(0);

  // Always kept current — "where the camera is looking right now" — so
  // that if a flight is ever interrupted, the next one starts from
  // reality instead of jumping to a stale target.
  const currentLookAtRef = useRef(
    new THREE.Vector3(...DEFAULT_CAMERA.lookAt)
  );

  const [debugCurve, setDebugCurve] = useState<THREE.Vector3[] | null>(null);

  const {
    started,
    currentStop,
    beginTransition,
    finishTransition,
    setCameraState,
  } = useJourney();

  const { maxBankDeg, bankSmoothing, arcSamples, showDebugPath } =
    useControls("Bezier Flight", {
      maxBankDeg: { value: 8, min: 0, max: 30, step: 1 },
      bankSmoothing: { value: 6, min: 0, max: 20, step: 0.5 },
      arcSamples: { value: 200, min: 20, max: 400, step: 10 },
      showDebugPath: false,
    });

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

    currentLookAtRef.current.set(...DEFAULT_CAMERA.lookAt);
    flightRef.current = null;
    setDebugCurve(null);
  }

  function startFlight() {
    if (!controls.current) return;

    const id = ++transitionId.current;

    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(...currentStop.camera.position);
    const endLookAt = new THREE.Vector3(...currentStop.camera.lookAt);

    const curve = createBezier(startPos, endPos, currentStop.transition.lift);
    const arcTable = buildArcLengthTable(curve, arcSamples);

    flightRef.current = {
      id,
      curve,
      arcTable,
      startLookAt: currentLookAtRef.current.clone(),
      endLookAt,
      startTime: performance.now(),
      duration: Math.max(currentStop.transition.duration, 0.1) * 1000,
      maxBankDeg,
    };

    if (showDebugPath) {
      setDebugCurve(curve.getPoints(50));
    } else {
      setDebugCurve(null);
    }

    // Hand the camera fully over to the manual flight loop — CameraControls
    // must not fight it for the position/target every frame.
    controls.current.enabled = false;

    beginTransition();
    setCameraState("moving");
  }

  function finishFlight(id: number) {
    if (!controls.current) return;
    if (id !== transitionId.current) return;

    const endPos = new THREE.Vector3(...currentStop.camera.position);
    const endLookAt = new THREE.Vector3(...currentStop.camera.lookAt);

    // Snap CameraControls' internal state to match exactly where the
    // manual flight left the camera, so idle orbiting doesn't jump the
    // instant control is handed back.
    controls.current.setLookAt(
      endPos.x, endPos.y, endPos.z,
      endLookAt.x, endLookAt.y, endLookAt.z,
      false
    );
    controls.current.enabled = true;

    currentLookAtRef.current.copy(endLookAt);
    flightRef.current = null;
    setDebugCurve(null);
    bankRef.current = 0;

    setCameraState("arriving");

    setTimeout(() => {
      if (id !== transitionId.current) return;
      setCameraState("idle");
      finishTransition();
    }, currentStop.transition.arrivalDelay * 1000);
  }

  useEffect(() => {
    if (!controls.current) return;

    if (!started) {
      resetCamera();
      return;
    }

    startFlight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, currentStop]);

  useFrame((_, delta) => {
    const flight = flightRef.current;

    // A stale flight (superseded by a newer transitionId) is ignored —
    // this is what makes interruption safe.
    if (flight && flight.id === transitionId.current) {
      const elapsed = performance.now() - flight.startTime;
      const rawProgress = THREE.MathUtils.clamp(elapsed / flight.duration, 0, 1);
      const progress = easeInOut(rawProgress);

      const t = tForArcLength(flight.arcTable, progress);
      const position = flight.curve.getPoint(t);

      const lookAtTarget = lerpVectorLinear(
        flight.startLookAt,
        flight.endLookAt,
        progress
      );

      const targetBank = getBankAngle(flight.curve, t, flight.maxBankDeg);
      bankRef.current = THREE.MathUtils.damp(
        bankRef.current,
        targetBank,
        bankSmoothing,
        delta
      );

      const quaternion = computeLookAtQuaternion(
        position,
        lookAtTarget,
        bankRef.current
      );

      camera.position.copy(position);
      camera.quaternion.copy(quaternion);

      currentLookAtRef.current.copy(lookAtTarget);

      (window as any).__cameraDebug = {
        px: position.x.toFixed(3),
        py: position.y.toFixed(3),
        pz: position.z.toFixed(3),

        tx: lookAtTarget.x.toFixed(3),
        ty: lookAtTarget.y.toFixed(3),
        tz: lookAtTarget.z.toFixed(3),
      };

      if (rawProgress >= 1) {
        finishFlight(flight.id);
      }

      return;
    }

    // Idle — CameraControls owns the camera. Just mirror its state into
    // the debug overlay and keep currentLookAtRef fresh for next flight.
    const target = controls.current?.getTarget(new THREE.Vector3());
    if (target) currentLookAtRef.current.copy(target);

    (window as any).__cameraDebug = {
      px: camera.position.x.toFixed(3),
      py: camera.position.y.toFixed(3),
      pz: camera.position.z.toFixed(3),

      tx: target ? target.x.toFixed(3) : "0.000",
      ty: target ? target.y.toFixed(3) : "0.000",
      tz: target ? target.z.toFixed(3) : "0.000",
    };
  });

  return (
    <>
      <CameraControls ref={controls} makeDefault smoothTime={1.4} />
      {showDebugPath && debugCurve && (
        <Line points={debugCurve} color="#d4af37" lineWidth={2} />
      )}
    </>
  );
}