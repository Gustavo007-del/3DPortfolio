"use client";

import { useEffect, useState } from "react";

export default function CameraDebugPanel() {
  const [debug, setDebug] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDebug((window as any).__cameraDebug);
    }, 100); // refresh 10x/sec, fine for reading numbers
    return () => clearInterval(interval);
  }, []);

  if (!debug) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: 20,
        zIndex: 1000,
        padding: "10px 14px",
        background: "rgba(0,0,0,0.75)",
        color: "#0f0",
        fontFamily: "monospace",
        fontSize: 12,
        borderRadius: 6,
        whiteSpace: "pre",
        pointerEvents: "none",
      }}
    >
      {`position: [${debug.px}, ${debug.py}, ${debug.pz}]
target:   [${debug.tx}, ${debug.ty}, ${debug.tz}]`}
    </div>
  );
}