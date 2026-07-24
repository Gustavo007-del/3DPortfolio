"use client";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { useWorldState } from "./WorldState";

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
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ({ progress }: { progress: number }) => {
      targetProgressRef.current = progress;
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

  // Journey owns input once active — freeze Lenis so wheel can't leak into Previous/Next.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (cameraOwner === "journey") lenis.stop();
    else lenis.start();
  }, [cameraOwner]);

  return (
    <div
      ref={trackRef}
      aria-hidden
      style={{ position: "fixed", inset: 0, opacity: 0, pointerEvents: "none", overflow: "hidden", zIndex: -1 }}
    >
      <div ref={contentRef} style={{ height: "400vh" }} />
    </div>
  );
}