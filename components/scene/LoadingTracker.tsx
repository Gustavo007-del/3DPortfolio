"use client";

import { useProgress } from "@react-three/drei";
import { useEffect } from "react";

interface LoadingTrackerProps {
  onProgress?: (progress: number) => void;
  onLoaded: () => void;
}

export default function LoadingTracker({ onProgress, onLoaded }: LoadingTrackerProps) {
  const { active, progress } = useProgress();

  useEffect(() => {
    onProgress?.(progress);
  }, [progress, onProgress]);

  useEffect(() => {
    if (!active && progress === 100) {
      const timer = setTimeout(() => {
        onLoaded();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [active, progress, onLoaded]);

  return null;
}
