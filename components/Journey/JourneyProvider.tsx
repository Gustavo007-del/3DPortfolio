"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { JOURNEY_STOPS,JourneyStop, } from "@/lib/journey";
import { CameraState } from "@/lib/JourneyTransition";
export type JourneyContextType = {
  cinematic: "idle" | "playing" | "complete";
  started: boolean;
  currentIndex: number;
  currentStop: JourneyStop;
  cameraState: CameraState;
  isTransitioning: boolean;
   totalStops: number;
  beginJourney: () => void;
  startCinematic: () => void;
  finishCinematic: () => void;
  stopCinematic: () => void;

  next: () => void;

  previous: () => void;
  beginTransition: () => void;
  finishTransition: () => void;
  setCameraState: (state: CameraState) => void;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
};

const JourneyContext =
  createContext<JourneyContextType | null>(null);

export function JourneyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [started, setStarted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cinematic, setCinematic] = useState<"idle" | "playing" | "complete">("idle");

  function beginJourney() {
    setStarted(true);
  }

  function next() {
    setCurrentIndex((i) => Math.min(i + 1, JOURNEY_STOPS.length - 1));
  }

  function previous() {
    setCinematic("idle");
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }
  function startCinematic() {
    setCinematic("playing");
  }
  function finishCinematic() {
    setCinematic("complete");
  }
  function stopCinematic() {
    setCinematic("complete");
  }
  function beginTransition() {
  setIsTransitioning(true);
}

function finishTransition() {
  setIsTransitioning(false);
}
const currentStop = JOURNEY_STOPS[currentIndex];
const totalStops = JOURNEY_STOPS.length;
  return (
    <JourneyContext.Provider
      value={{
        started,
        cinematic,
        currentIndex,
        currentStop,
        cameraState,
        isTransitioning,
        totalStops,
        beginJourney,
        startCinematic,
        finishCinematic,
        stopCinematic,
        next,
        previous,
        beginTransition,
        finishTransition,
        setCameraState,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const ctx = useContext(JourneyContext);

  if (!ctx) {
    throw new Error(
      "useJourney must be inside JourneyProvider"
    );
  }

  return ctx;
}

/**
 * Like useJourney but returns null when no provider is mounted — for
 * components that must work on any page (boat-ride controller).
 * Always a valid hook call.
 */
export function useJourneyOptional() {
  return useContext(JourneyContext);
}
