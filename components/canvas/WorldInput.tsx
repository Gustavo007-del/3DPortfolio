"use client";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { addEffect } from "@react-three/fiber";
import { useWorldState } from "@/components/World/WorldState";
import { getRidePhase } from "@/components/Island/boat-ride/boatRideStore";

const TEXT_SNAP_POINTS = [0, 0.12, 0.24, 0.36];
const SNAP_EPSILON = 0.01;
const SNAP_DURATION = 0.7; // seconds
const SNAP_COOLDOWN_MS = 900; // swallow wheel events (trackpad inertia) while a snap runs

// Headless. Renders an invisible scroll track purely to give Lenis room to smooth
// against — never visible, never focusable, never scrolled by native page scroll.
//
// Changes vs. the old version:
//  1. Lenis is created ONCE. Before, the effect depended on `phase`, so every phase
//     change (SPACE -> TRANSITION_TO_ISLAND etc.) destroyed and rebuilt Lenis in the
//     middle of the scroll, killing its inertia = a hitch exactly at the transition.
//  2. Lenis is ticked from R3F's frame loop (addEffect) instead of its own
//     requestAnimationFrame, so scroll and camera update in the same frame.
//  3. Snap steps no longer write targetProgressRef directly (the Lenis scroll event
//     overwrote it a frame later = jitter) and are cooled down so trackpad inertia
//     can't skip several text stages at once.
export default function WorldInput() {
  const { phase, cameraOwner, roaming, targetProgressRef } = useWorldState();
  const trackRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Latest gate values, readable from long-lived listeners without re-creating Lenis.
  const gate = useRef({ phase, cameraOwner, roaming });
  gate.current = { phase, cameraOwner, roaming };

  useEffect(() => {
    const wrapper = trackRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper,
      content,
      eventsTarget: window,
      orientation: "vertical",
      smoothWheel: true,
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", (l: Lenis) => {
      targetProgressRef.current = l.progress;
    });

    // Tick Lenis inside the R3F loop (runs right before each render).
    const removeEffect = addEffect((t: number) => {
      lenis.raf(t);
    });

    let snapLockedUntil = 0;

    function onWheel(event: WheelEvent) {
      // Ride-a-boat: freeze journey scroll (PLAN §2.4). Capture-phase +
      // stopPropagation so Lenis's own window wheel listener never sees it.
      if (getRidePhase() !== "idle") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const g = gate.current;
      if (g.phase !== "SPACE" || g.cameraOwner !== "world" || g.roaming) return;

      const now = performance.now();

      // A snap is running: swallow the wheel so Lenis doesn't add its own motion.
      if (now < snapLockedUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const current = targetProgressRef.current;
      const lastTextPoint = TEXT_SNAP_POINTS[TEXT_SNAP_POINTS.length - 1];

      // Once the last text has passed, return to continuous scrolling.
      if (current > lastTextPoint + SNAP_EPSILON) return;

      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = TEXT_SNAP_POINTS.findIndex((p) => p > current + SNAP_EPSILON);
      const previousIndex = TEXT_SNAP_POINTS.findLastIndex((p) => p < current - SNAP_EPSILON);
      const targetIndex = direction > 0 ? nextIndex : previousIndex;

      if (targetIndex < 0) return;

      event.preventDefault();
      event.stopPropagation();
      snapLockedUntil = now + SNAP_COOLDOWN_MS;
      lenis.scrollTo(TEXT_SNAP_POINTS[targetIndex] * lenis.limit, {
        duration: SNAP_DURATION,
        lock: true,
      });
    }

    // Capture phase so we run BEFORE Lenis's own wheel listener.
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });

    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true } as EventListenerOptions);
      removeEffect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [targetProgressRef]);

  // Journey owns input once active, and CameraControls owns it in roam mode —
  // freeze Lenis in both cases.
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
