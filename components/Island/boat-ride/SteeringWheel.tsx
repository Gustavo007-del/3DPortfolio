// components/Island/boat-ride/SteeringWheel.tsx
//
// On-screen steering wheel (PLAN.md §8.3): drag to rotate by the angle
// around the wheel centre, clamp ±140° ⇒ uiWheel ∈ [−1, 1], spring back to
// centre on release, works with mouse/touch/pen, never blocks simultaneous
// pedal presses (per-pointer capture), touch-action: none.

"use client";

import { useRef, type PointerEvent } from "react";
import { rideInput } from "./boatRideInput";

const MAX_DEG = 140;
const norm = (d: number) => ((d + 540) % 360) - 180;

export function SteeringWheel() {
  const el = useRef<HTMLDivElement>(null);
  const st = useRef({ id: -1, start: 0, base: 0, rot: 0, raf: 0 });

  const apply = (deg: number) => {
    const r = Math.max(-MAX_DEG, Math.min(MAX_DEG, deg));
    st.current.rot = r;
    if (el.current) el.current.style.transform = `rotate(${r}deg)`;
    rideInput.uiWheel = r / MAX_DEG;
  };

  const angle = (e: PointerEvent) => {
    const b = el.current!.getBoundingClientRect();
    return (
      (Math.atan2(
        e.clientY - (b.top + b.height / 2),
        e.clientX - (b.left + b.width / 2)
      ) *
        180) /
      Math.PI
    );
  };

  const spring = () => {
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      const next = st.current.rot * Math.exp(-10 * dt);
      if (Math.abs(next) < 0.4) {
        apply(0);
        return;
      }
      apply(next);
      st.current.raf = requestAnimationFrame(tick);
    };
    st.current.raf = requestAnimationFrame(tick);
  };

  const down = (e: PointerEvent) => {
    cancelAnimationFrame(st.current.raf);
    st.current.id = e.pointerId;
    st.current.start = angle(e);
    st.current.base = st.current.rot;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (e.pointerId !== st.current.id) return;
    apply(st.current.base + norm(angle(e) - st.current.start));
  };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== st.current.id) return;
    st.current.id = -1;
    spring();
  };

  return (
    <div
      ref={el}
      role="slider"
      aria-label="Steering wheel"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={0}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      className="h-[140px] w-[140px] cursor-grab select-none active:cursor-grabbing sm:h-[170px] sm:w-[170px]"
      style={{ touchAction: "none", userSelect: "none" }}
    >
      {/* Rim, 3 spokes, hub, and a 12-o'clock marker so rotation reads. */}
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle
          cx="50" cy="50" r="45"
          fill="rgba(15,23,42,0.45)"
          stroke="rgba(140,220,255,0.55)"
          strokeWidth="6"
        />
        <g stroke="rgba(200,230,255,0.75)" strokeWidth="4" strokeLinecap="round">
          <line x1="50" y1="50" x2="50" y2="16" />
          <line x1="50" y1="50" x2="21" y2="66" />
          <line x1="50" y1="50" x2="79" y2="66" />
        </g>
        {/* 12 o'clock marker (required so rotation is visible, §8.3) */}
        <circle cx="50" cy="8.5" r="5" fill="#67e8f9" />
        <circle cx="50" cy="50" r="10" fill="rgba(103,232,249,0.25)" stroke="rgba(140,220,255,0.8)" strokeWidth="2" />
      </svg>
    </div>
  );
}
