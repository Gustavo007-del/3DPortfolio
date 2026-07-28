"use client";

import { useState, useCallback } from "react";
import WorldManager from "@/components/World/WorldManager";
import LoadingScreen from "@/components/scene/LoadingScreen";
import { Leva } from "leva";

export default function Page() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const handleLoaded = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <>
      <LoadingScreen progress={progress} visible={!loaded} />
      <WorldManager onProgress={handleProgress} onLoaded={handleLoaded} />
      <Leva />
    </>
  );
}
