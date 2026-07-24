// components/Audio/AudioController.tsx

"use client";

import { useEffect, useRef } from "react";
import { useJourney } from "@/components/Journey/JourneyProvider";
import { useAudioContext } from "./AudioProvider";

export default function AudioController() {
  const { started, currentIndex, isTransitioning } = useJourney();
  const { ready, unlock, fade } = useAudioContext();
  const hasUnlocked = useRef(false);
  const prevIndex = useRef(currentIndex);
  const prevTransitioning = useRef(isTransitioning);

  useEffect(() => {
    if (started && !hasUnlocked.current) { hasUnlocked.current = true; void unlock(); }
  }, [started, unlock]);

  useEffect(() => {
    if (!ready) return;
    if (isTransitioning && !prevTransitioning.current) fade("Ambient", 0.55, 400);
    if (!isTransitioning && prevTransitioning.current) fade("Ambient", 1, 600);
    prevTransitioning.current = isTransitioning;
  }, [isTransitioning, ready, fade]);

  useEffect(() => {
    if (!ready) return;
    if (currentIndex !== prevIndex.current) prevIndex.current = currentIndex;
  }, [currentIndex, ready]);

  return null;
}