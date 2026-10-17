// components/Island/boat-ride/BoatRideHUD.tsx
//
// DOM overlay for the ride (PLAN.md §10). Renders nothing while idle;
// otherwise: wheel bottom-left, pedals bottom-right (car order), Exit
// top-right (also Esc), speed + boat name top-left (rAF text writes, not
// React state), desktop key hints that fade after 6 s, polite live region.
// Everything respects safe areas and prefers-reduced-motion (CSS only).

"use client";

import { useEffect, useRef, useState } from "react";
import { useRide, requestRideExit, ridePose } from "./boatRideStore";
import { SteeringWheel } from "./SteeringWheel";
import { Pedal } from "./Pedal";

export default function BoatRideHUD() {
  const ride = useRide();
  const [hints, setHints] = useState(false);
  const speedRef = useRef<HTMLSpanElement>(null);

  // Desktop key hints: show on ride start, fade after ~6 s (§10).
  useEffect(() => {
    if (ride.phase === "idle" || !ride.boatId) return;
    setHints(true);
    const t = window.setTimeout(() => setHints(false), 6000);
    return () => window.clearTimeout(t);
  }, [ride.phase, ride.boatId]);

  // Speed readout via rAF text writes — never React state per frame (§10).
  useEffect(() => {
    if (ride.phase === "idle") return;
    let raf = 0;
    const tick = () => {
      const el = speedRef.current;
      if (el) el.textContent = ridePose.speed.toFixed(1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ride.phase]);

  if (ride.phase === "idle") return null;

  const exiting = ride.phase === "exiting";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[120]"
      style={{
        opacity: exiting ? 0 : 1,
        transition: "opacity 300ms ease",
        paddingTop: "env(safe-area-inset-top)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
      }}
      aria-hidden={exiting}
    >
      {/* Top-left: speed + boat name (§10) */}
      <div
        className="absolute left-4 top-4 rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 font-mono text-xs text-cyan-200 backdrop-blur-md"
        style={{ letterSpacing: "0.12em" }}
      >
        <span ref={speedRef}>0.0</span> m/s
        <span className="mx-2 text-white/40">·</span>
        <span className="text-white/85">{ride.boatId}</span>
      </div>

      {/* Top-right: Exit (also Esc) */}
      <button
        type="button"
        onClick={(e) => {
          e.currentTarget.blur(); // Space must not re-trigger it
          requestRideExit();
        }}
        className="pointer-events-auto absolute right-4 top-4 rounded-full border border-white/25 bg-slate-900/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md transition hover:border-cyan-300/60 hover:brightness-110 motion-reduce:transition-none"
      >
        ✕ Exit boat
        <span className="ml-2 hidden rounded border border-white/25 px-1.5 py-0.5 font-mono text-[10px] text-white/70 md:inline">
          Esc
        </span>
      </button>

      {/* Bottom-left: steering wheel */}
      <div className="absolute bottom-4 left-4">
        <SteeringWheel />
      </div>

      {/* Bottom-right: brake, then accelerator (car order) */}
      <div className="absolute bottom-4 right-4 flex items-end gap-3">
        <Pedal kind="brake" label="Brake" />
        <Pedal kind="throttle" label="Go" />
      </div>

      {/* Bottom-centre: key hints, desktop only, fade after 6 s */}
      <div
        className={`absolute bottom-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-slate-900/60 px-4 py-2 font-mono text-[11px] tracking-[0.14em] text-white/75 backdrop-blur-md transition-opacity duration-700 motion-reduce:transition-none md:block ${
          hints ? "opacity-100" : "opacity-0"
        }`}
      >
        ↑ accelerate · ↓ brake · ← → steer · Esc exit
      </div>

      {/* Polite announcement (§10 a11y) */}
      <p aria-live="polite" className="sr-only">
        Riding {ride.boatId}
      </p>
    </div>
  );
}
