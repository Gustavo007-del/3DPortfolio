"use client";

import { useWorldState } from "@/components/World/WorldState";

export default function SpaceOverlay() {
  const { phase } = useWorldState();
  const inSpace = phase === "SPACE" || phase === "TRANSITION_TO_ISLAND" || phase === "TRANSITION_TO_SPACE";

  if (!inSpace) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-10"
      style={{
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
      }}
    >
      {/* Title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <h1
          className="text-4xl md:text-5xl font-bold tracking-wider"
          style={{
            color: "#ffffff",
            textShadow: "0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(100,150,255,0.2)",
            fontFamily: "var(--font-fraunces), Georgia, serif",
          }}
        >
          Solar System
        </h1>
        <p
          className="mt-2 text-sm md:text-base text-white/60 tracking-widest uppercase"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Interactive 3D Explorer
        </p>
      </div>

      {/* Bottom instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-white/40 tracking-wider uppercase">
            Scroll to travel · Drag to orbit
          </p>
          <div className="flex items-center gap-4 text-[10px] text-white/30 tracking-wider uppercase">
            <span>Mercury</span>
            <span>·</span>
            <span>Venus</span>
            <span>·</span>
            <span>Earth</span>
            <span>·</span>
            <span>Mars</span>
            <span>·</span>
            <span>Jupiter</span>
            <span>·</span>
            <span>Saturn</span>
          </div>
        </div>
      </div>

      {/* Top-right info */}
      <div className="absolute top-8 right-8 text-right hidden md:block">
        <p className="text-[10px] text-white/30 tracking-widest uppercase">Distance</p>
        <p className="text-sm text-white/60 font-mono">1 AU = 149.6M km</p>
      </div>

      {/* Left-side planet list */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2 hidden lg:flex flex-col gap-3">
        {[
          { name: "Sun", color: "#ffaa33" },
          { name: "Mercury", color: "#b0b0b0" },
          { name: "Venus", color: "#e6d7a3" },
          { name: "Earth", color: "#4a90d9" },
          { name: "Mars", color: "#c1440e" },
          { name: "Jupiter", color: "#d4a574" },
          { name: "Saturn", color: "#e8d5a3" },
        ].map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }}
            />
            <span className="text-[10px] text-white/40 tracking-wider uppercase">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
