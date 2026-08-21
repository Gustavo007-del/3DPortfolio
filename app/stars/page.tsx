"use client";

import { useEffect, useRef } from "react";
import { ParticlesSwarm } from "@/components/stars/OriginalStars";

export default function StarsPage() {
  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) return;

    const swarm =
      new ParticlesSwarm(
        container,
        {
          count: 20000,
          speed: 0.4,
          chaos: 20,
          coreSize: 10,
        }
      );

    return () => {
      swarm.destroy();
    };
  }, []);

  return (
    <main className="fixed inset-0 bg-black overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full"
      />
    </main>
  );
}