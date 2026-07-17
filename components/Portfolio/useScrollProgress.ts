// components/Portfolio/useScrollProgress.ts
"use client";

import { useEffect, useRef, useState } from "react";

// Returns TWO things on purpose:
// - `progress` (React state) for the HTML overlay, which needs re-renders
// - `progressRef` (a plain ref) for the R3F camera rig, which reads it
//   every frame without waiting on React — keeps the camera buttery smooth
//   even if HTML re-renders lag behind.
export function useScrollProgress() {
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      progressRef.current = p;
      setProgress(p);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { progress, progressRef };
}