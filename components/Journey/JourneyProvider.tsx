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
  started: boolean;
  currentIndex: number;
  currentStop: JourneyStop;
  cameraState: CameraState;
  isTransitioning: boolean;
   totalStops: number;
  beginJourney: () => void;

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

  function beginJourney() {
    setStarted(true);
  }

  function next() {
    if (isTransitioning) return;
    setCurrentIndex((i) => Math.min(i + 1, JOURNEY_STOPS.length - 1));
  }

  function previous() {
    if (isTransitioning) return;
    setCurrentIndex((i) => Math.max(i - 1, 0));
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
        currentIndex,
        currentStop,
        cameraState,
        isTransitioning,
        totalStops,
        beginJourney,
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