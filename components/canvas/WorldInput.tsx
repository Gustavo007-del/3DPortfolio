"use client";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { useWorldState } from "@/components/World/WorldState";

const TEXT_SNAP_POINTS = [0, 0.12, 0.24, 0.36];
const SNAP_EPSILON = 0.01;

// Headless. Renders an invisible scroll track purely to give Lenis room to smooth
// against — never visible, never focusable, never scrolled by native page scroll.
export default function WorldInput() {
  const { phase, cameraOwner, roaming, targetProgressRef } = useWorldState();
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

    function onWheel(event: WheelEvent) {
      if (phase !== "SPACE" || cameraOwner !== "world" || roaming) return;

      const current = targetProgressRef.current;
      const lastTextPoint = TEXT_SNAP_POINTS[TEXT_SNAP_POINTS.length - 1];

      // Once the last text has passed, return to continuous scrolling.
      if (current > lastTextPoint + SNAP_EPSILON) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = TEXT_SNAP_POINTS.findIndex(
        (point) => point > current + SNAP_EPSILON
      );
      const previousIndex = TEXT_SNAP_POINTS.findLastIndex(
        (point) => point < current - SNAP_EPSILON
      );
      const targetIndex = direction > 0 ? nextIndex : previousIndex;

      if (targetIndex < 0) return;

      event.preventDefault();
      const maxScroll = trackRef.current!.scrollHeight - trackRef.current!.clientHeight;
      const target = TEXT_SNAP_POINTS[targetIndex];
      targetProgressRef.current = target;
      lenis.scrollTo(target * maxScroll, { duration: 0.7, lock: true });
    }

    window.addEventListener("wheel", onWheel, { passive: false });

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("wheel", onWheel);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [cameraOwner, phase, roaming, targetProgressRef]);

  // Journey owns input once active, and CameraControls owns it on Island —
  // freeze Lenis in both cases so wheel doesn't leak in or silently drift
  // progressRef in the background while the user is just zooming on Island.
  useEffect(() => {
  const lenis = lenisRef.current;
  if (!lenis) return;
  if (cameraOwner === "journey" || roaming) lenis.stop();
  else lenis.start();
}, [cameraOwner, roaming]);

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
