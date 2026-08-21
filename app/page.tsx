"use client";

import { useCallback, useEffect, useState } from "react";
import WorldManager from "@/components/World/WorldManager";
import LoadingScreen from "@/components/scene/LoadingScreen";
import LoadingTracker from "@/components/scene/LoadingTracker";

const MIN_LOADING_TIME = 8000;

export default function Page() {
  const [progress, setProgress] = useState(0);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(false);

  const handleProgress = useCallback((value: number) => {
    setProgress(value);
  }, []);

  const handleAssetsLoaded = useCallback(() => {
    setAssetsLoaded(true);
  }, []);

  // Minimum loading time (10s)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTimeElapsed(true);
    }, MIN_LOADING_TIME);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  // BOTH conditions must be satisfied
  const loadingComplete = assetsLoaded && timeElapsed;

  return (
    <>
      <LoadingScreen
        progress={progress}
        visible={!loadingComplete}
        complete={loadingComplete}
      />

      <LoadingTracker
        onProgress={handleProgress}
        onLoaded={handleAssetsLoaded}
      />

      <WorldManager active={loadingComplete} />
    </>
  );
}