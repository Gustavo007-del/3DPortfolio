"use client";

import { Html } from "@react-three/drei";

interface PlanetLabelProps {
  text: string;
  color?: string;
  fontSize?: string;
}

export default function PlanetLabel({ text, color = "#ffffff", fontSize = "14px" }: PlanetLabelProps) {
  return (
    <Html
      center
      distanceFactor={15}
      style={{
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          color,
          fontSize,
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          textShadow: "0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.7)",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {text}
      </div>
    </Html>
  );
}
