"use client";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { useWorldState } from "@/components/World/WorldState";

// Headless. Renders an invisible scroll track purely to give Lenis room to smooth
// against — never visible, never focusable, never scrolled by native page scroll.
export default function WorldInput() {
  const { cameraOwner, targetProgressRef } = useWorldState();
  const trackRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!trackRef.current || !contentRef.current) return;

    const lenis = new Lenis({
      wrapper: trackRef.current,
      content: contentRef.current,
      eventsTarget: window,
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", (l: Lenis) => {
      targetProgressRef.current = l.progress;
    });

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [targetProgressRef]);

  // Journey owns input once active, and CameraControls owns it on Island —
  // freeze Lenis in both cases so wheel doesn't leak in or silently drift
  // progressRef in the background while the user is just zooming on Island.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    // The landing screen remains part of the world scroll. Only the explicit
    // portfolio journey takes ownership and freezes world progress.
    if (cameraOwner === "journey") lenis.stop();
    else lenis.start();
  }, [cameraOwner]);

  return (
    <div
      ref={trackRef}
      aria-hidden
      style={{ position: "fixed", inset: 0, opacity: 0, pointerEvents: "none", overflow: "auto", zIndex: -1 }}
    >
      <div ref={contentRef} style={{ height: "1100vh" }} />
    </div>
  );
}
