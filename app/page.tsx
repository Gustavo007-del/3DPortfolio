// app/page.tsx
"use client";

import { useState, useCallback } from "react";
import WorldManager from "@/components/World/WorldManager";
import LoadingScreen from "@/components/scene/LoadingScreen";
import LoadingTracker from "@/components/scene/LoadingTracker"; // adjust path to wherever this actually lives
import { Leva } from "leva";

export default function Page() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const handleAssetsLoaded = useCallback(() => {
    setAssetsLoaded(true);
  }, []);

  return (
    <>
      <LoadingScreen progress={progress} visible={!assetsLoaded} />
      <LoadingTracker onProgress={handleProgress} onLoaded={handleAssetsLoaded} />
      <WorldManager />
      {/* <Leva /> */}
    </>
  );
}