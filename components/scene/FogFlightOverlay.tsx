"use client";

import { useEffect, useRef, useState } from "react";
import { useWorldState } from "@/components/World/WorldState";

const FOG_START = 0.7;

/**
 * A separate, DOM-based navigation layer for the bright cloud crossing.
 * It deliberately does not share the SpaceOverlay content system: this is a
 * visual landmark which remains legible over the CloudVeil's white shader.
 */
export default function FogFlightOverlay() {
  const { phase, progressRef } = useWorldState();
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      setProgress(progressRef.current);
      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [progressRef]);

  const visible = progress >= FOG_START && progress < 1 && phase !== "ISLAND";
  if (!visible) return null;

  const flightProgress = Math.min(1, Math.max(0, (progress - FOG_START) / (1 - FOG_START)));
  const x = 10 + flightProgress * 80;
  const y = 68 - Math.sin(flightProgress * Math.PI) * 32;
  const rotation = -17 + Math.cos(flightProgress * Math.PI) * 9;
  const distance = Math.round(flightProgress * 100);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes fog-route-drift {
          to { stroke-dashoffset: -26; }
        }
        @keyframes fog-beacon-pulse {
          0%, 100% { transform: scale(0.85); opacity: 0.35; }
          50% { transform: scale(1.25); opacity: 1; }
        }
        @keyframes fog-aircraft-bob {
          0%, 100% { margin-top: -3px; }
          50% { margin-top: 3px; }
        }
      `}</style>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fog-route" x1="0" x2="1">
            <stop offset="0%" stopColor="#14233d" stopOpacity="0.16" />
            <stop offset="45%" stopColor="#265a82" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d69b5c" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path
          d="M 10 68 C 34 71, 61 26, 90 36"
          fill="none"
          stroke="url(#fog-route)"
          strokeWidth="0.36"
          strokeDasharray="1.4 1.4"
          style={{ animation: "fog-route-drift 1.8s linear infinite" }}
        />
        <circle cx="10" cy="68" r="0.9" fill="#1d476a" opacity="0.8" />
        <circle cx="90" cy="36" r="0.9" fill="#d69b5c" opacity="0.9" />
      </svg>

      <div
        className="absolute h-10 w-10"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          filter: "drop-shadow(0 5px 6px rgba(7, 18, 33, 0.48))",
          animation: "fog-aircraft-bob 1.8s ease-in-out infinite",
        }}
      >
        <span
          className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4a88b3]/45"
          style={{ animation: "fog-beacon-pulse 1.8s ease-in-out infinite" }}
        />
        <svg viewBox="0 0 64 64" className="relative h-full w-full" fill="none">
          <path
            d="M55 31 36 27 25 8c-1.4-2.6-5.2-1.6-5.2 1.3V27L8 31c-4 1.3-4 4.9 0 6.1l11.8 4v17.6c0 3 3.8 3.9 5.2 1.3L36 41l19-4c3.9-1.2 3.9-4.8 0-6Z"
            fill="#11263c"
            stroke="#e0a464"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M20 31h24" stroke="#91d7ef" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 rounded-full px-5 py-3 text-center font-mono shadow-lg md:bottom-10"
        style={{
          background: "rgba(8, 23, 40, 0.82)",
          border: "1px solid rgba(38, 90, 130, 0.66)",
          boxShadow: "0 10px 30px rgba(7, 18, 33, 0.28)",
          backdropFilter: "blur(10px)",
        }}
      >
        <p className="text-[10px] font-semibold tracking-[0.24em] text-[#dbeeff] md:text-xs">
          CLOUD CROSSING · KEEP SCROLLING
        </p>
        <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-white/15 md:w-60">
          <div
            className="h-full rounded-full"
            style={{
              width: `${distance}%`,
              background: "linear-gradient(90deg, #397ea8, #91d7ef, #e0a464)",
              boxShadow: "0 0 10px rgba(145, 215, 239, 0.8)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
