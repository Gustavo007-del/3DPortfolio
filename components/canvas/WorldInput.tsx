"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { addEffect } from "@react-three/fiber";
import { useWorldState } from "@/components/World/WorldState";
import { getRidePhase } from "@/components/Island/boat-ride/boatRideStore";

// The hidden track gives Lenis a real scroll distance while the WebGL scene
// remains fixed. Wheel and touch both update the same progress value.
export default function WorldInput() {
  const { phase, cameraOwner, roaming, targetProgressRef } = useWorldState();
  const trackRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
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
      lerp: 0.09,
      wheelMultiplier: 1,
    });
    lenisRef.current = lenis;
    lenis.on("scroll", (scroll: Lenis) => {
      targetProgressRef.current = scroll.progress;
    });
    const removeEffect = addEffect((time: number) => lenis.raf(time));

    // The boat takes over wheel input while it is being ridden.
    function onWheel(event: WheelEvent) {
      if (getRidePhase() !== "idle") {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    let touch: { startX: number; startY: number; lastY: number; targetScroll: number; traveling: boolean } | null = null;
    function onTouchStart(event: TouchEvent) {
      const state = gate.current;
      if (event.touches.length !== 1 || state.phase === "ISLAND" || state.cameraOwner !== "world" || state.roaming || getRidePhase() !== "idle") return;
      if ((event.target as Element)?.closest?.("a, button, input, textarea, select, [role=button]")) return;
      const finger = event.touches[0];
      touch = { startX: finger.clientX, startY: finger.clientY, lastY: finger.clientY, targetScroll: lenis.targetScroll, traveling: false };
    }

    function onTouchMove(event: TouchEvent) {
      if (!touch || event.touches.length !== 1) return;
      const state = gate.current;
      if (state.phase === "ISLAND" || state.cameraOwner !== "world" || state.roaming || getRidePhase() !== "idle") { touch = null; return; }
      const finger = event.touches[0];
      if (!touch.traveling) {
        const distanceY = Math.abs(touch.startY - finger.clientY);
        const distanceX = Math.abs(touch.startX - finger.clientX);
        if (distanceY < 10 || distanceY < distanceX * 1.2) return;
        touch.traveling = true;
      }
      if (event.cancelable) event.preventDefault();
      const delta = touch.lastY - finger.clientY;
      touch.targetScroll = Math.max(0, Math.min(lenis.limit, touch.targetScroll + delta * 1.6));
      lenis.scrollTo(touch.targetScroll, { lerp: 0.09 });
      touch.lastY = finger.clientY;
    }

    function onTouchEnd() { touch = null; }

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", onTouchEnd, { capture: true });
    window.addEventListener("touchcancel", onTouchEnd, { capture: true });

    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchstart", onTouchStart, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchmove", onTouchMove, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchend", onTouchEnd, { capture: true } as EventListenerOptions);
      window.removeEventListener("touchcancel", onTouchEnd, { capture: true } as EventListenerOptions);
      removeEffect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [targetProgressRef]);

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
