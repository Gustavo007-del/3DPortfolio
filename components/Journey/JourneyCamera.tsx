"use client";

import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { JOURNEY_STOPS } from "@/lib/journey";
import { useJourney } from "./JourneyProvider";

export default function JourneyCamera() {
  const controls = useRef<CameraControls>(null);

  const {
    started,
    currentIndex,
  } = useJourney();

  const stop = JOURNEY_STOPS[currentIndex];

  useEffect(() => {
    if (!controls.current) return;

    if (!started) {
      controls.current.setLookAt(
        11.873,
        10.369,
        2.485,

        0,
        5,
        0,

        false
      );

      return;
    }

    controls.current.setLookAt(
      stop.camera.position[0],
      stop.camera.position[1],
      stop.camera.position[2],

      stop.camera.lookAt[0],
      stop.camera.lookAt[1],
      stop.camera.lookAt[2],

      true
    );

  }, [started, stop]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={1.4}
    />
  );
}