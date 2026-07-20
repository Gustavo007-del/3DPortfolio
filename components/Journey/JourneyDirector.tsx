"use client";

import { useEffect } from "react";
import { useJourney } from "./JourneyProvider";

export default function JourneyDirector() {
  const {
    cameraState,
    currentStop,
  } = useJourney();

  useEffect(() => {
    console.log(
      "[Journey]",
      cameraState,
      currentStop.id
    );
  }, [cameraState, currentStop]);

  return null;
}