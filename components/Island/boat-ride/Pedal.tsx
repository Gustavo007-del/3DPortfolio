// components/Island/boat-ride/Pedal.tsx
//
// On-screen pedal (PLAN.md §8.4): press-and-hold accelerator or brake.
// Pointer-captured so a finger sliding off still releases; one local
// re-render per press; multi-touch safe (wheel + pedal at once).

"use client";

import { useState, type PointerEvent } from "react";
import { rideInput } from "./boatRideInput";

export function Pedal({
  kind,
  label,
}: {
  kind: "throttle" | "brake";
  label: string;
}) {
  const [pressed, setPressed] = useState(false);
  const key = kind === "throttle" ? "uiThrottle" : "uiBrake";
  const set = (v: 0 | 1) => {
    rideInput[key] = v;
    setPressed(v === 1);
  };

  const accent =
    kind === "throttle"
      ? {
          background: "rgba(52,211,153,0.16)",
          border: "1px solid rgba(52,211,153,0.65)",
          color: "rgba(167,243,208,0.95)",
          boxShadow: pressed ? "0 0 18px rgba(52,211,153,0.45)" : "none",
        }
      : {
          background: "rgba(248,113,113,0.14)",
          border: "1px solid rgba(248,113,113,0.6)",
          color: "rgba(254,205,205,0.95)",
          boxShadow: pressed ? "0 0 18px rgba(248,113,113,0.4)" : "none",
        };

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e: PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        set(1);
      }}
      onPointerUp={() => set(0)}
      onPointerCancel={() => set(0)}
      onLostPointerCapture={() => set(0)}
      onContextMenu={(e) => e.preventDefault()}
      className={`pointer-events-auto flex select-none items-center justify-center rounded-2xl text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md transition-transform ${
        kind === "throttle" ? "h-[110px] w-[76px]" : "h-[96px] w-[68px]"
      }`}
      style={{
        ...accent,
        touchAction: "none",
        userSelect: "none",
        transform: pressed ? "translateY(4px) scale(0.98)" : "none",
      }}
    >
      {label}
    </button>
  );
}
