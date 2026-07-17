"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { JOURNEY_STOPS } from "@/lib/journey";
export type JourneyContextType = {
  started: boolean;
  currentIndex: number;

  beginJourney: () => void;

  next: () => void;

  previous: () => void;
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

  function beginJourney() {
    setStarted(true);
  }

  function next() {
    setCurrentIndex((i) => Math.min(i + 1, JOURNEY_STOPS.length - 1));
  }

  function previous() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <JourneyContext.Provider
      value={{
        started,
        currentIndex,
        beginJourney,
        next,
        previous,
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