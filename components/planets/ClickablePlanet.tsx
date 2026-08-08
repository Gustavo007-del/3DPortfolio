// components/planets/ClickablePlanet.tsx
"use client";
import { useRef, useState, ReactNode } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useClickPulse } from "@/hooks/useClickPulse";

export default function ClickablePlanet({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const groupRef = useRef<Group>(null);
  const { trigger, getScale } = useClickPulse(0.4, 3.5);
  const [showLabel, setShowLabel] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFrame(() => {
    if (groupRef.current) {
      const s = getScale();
      groupRef.current.scale.setScalar(s);
    }
  });

  function handleClick(e: any) {
    e.stopPropagation(); // don't let clicks fall through to whatever's behind
    trigger();
    setShowLabel(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowLabel(false), 1800);
  }

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      {children}
      {showLabel && (
        <Html center distanceFactor={12} style={{ pointerEvents: "none" }}>
          <div
            style={{
              color: "#fff",
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              textShadow: "0 0 8px rgba(120,220,255,0.8)",
              whiteSpace: "nowrap",
              animation: "popIn 0.25s ease",
            }}
          >
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}