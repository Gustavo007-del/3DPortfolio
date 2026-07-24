// components/Audio/AudioController.tsx

"use client";

import { useEffect, useRef } from "react";
import { useJourney } from "@/components/Journey/JourneyProvider";
import { useAudioContext } from "./AudioProvider";

const BELL_POSITION: [number, number, number] = [-3.093, 13.642, -15.119];

export default function AudioController() {
  const { started, currentIndex, isTransitioning } = useJourney();
  const { ready, unlock, fade, play } = useAudioContext();
  const hasUnlocked = useRef(false);
  const prevTransitioning = useRef(isTransitioning);

  useEffect(() => {
    if (started && !hasUnlocked.current) { hasUnlocked.current = true; void unlock(); }
  }, [started, unlock]);

  useEffect(() => {
    if (!ready) return;

    if (isTransitioning && !prevTransitioning.current) {
      fade("Ambient", 0.55, 400);
    }

    if (!isTransitioning && prevTransitioning.current) {
      fade("Ambient", 1, 600);
      if (currentIndex === 3) play("bell", { bus: "Environment", position: BELL_POSITION });
    }

    prevTransitioning.current = isTransitioning;
  }, [isTransitioning, currentIndex, ready, fade, play]);

  return null;
}