"use client";

import { useEffect, useState } from "react";
import { useJourney } from "./JourneyProvider";

type CameraState = {
  px: string;
  py: string;
  pz: string;

  tx: string;
  ty: string;
  tz: string;
};

export default function CameraDebug() {
  const { currentStop } = useJourney();

  const [camera, setCamera] = useState<CameraState | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const dbg = (window as any).__cameraDebug;

      if (!dbg) return;

      setCamera({
        px: dbg.px,
        py: dbg.py,
        pz: dbg.pz,

        tx: dbg.tx,
        ty: dbg.ty,
        tz: dbg.tz,
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!camera) return null;

  const copyCamera = async () => {
    const text = `camera: {
  position: [${camera.px}, ${camera.py}, ${camera.pz}],
  lookAt: [${camera.tx}, ${camera.ty}, ${camera.tz}],
  duration: 4,
  lift: 5,
}`;

    await navigator.clipboard.writeText(text);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: 20,
        zIndex: 9999,

        width: 280,

        background: "rgba(15,15,15,.92)",

        color: "#ffffff",

        border: "1px solid #444",

        borderRadius: 12,

        padding: 16,

        fontFamily: "monospace",

        fontSize: 13,
      }}
    >
      <div
        style={{
          marginBottom: 12,
          fontWeight: 700,
        }}
      >
        Camera Debug
      </div>

      <div
        style={{
          color: "#8ab4ff",
          marginBottom: 16,
        }}
      >
        {currentStop.title}
      </div>

      <div>Position</div>

      <pre>
{`[${camera.px},
 ${camera.py},
 ${camera.pz}]`}
      </pre>

      <div style={{ marginTop: 12 }}>
        Look At
      </div>

      <pre>
{`[${camera.tx},
 ${camera.ty},
 ${camera.tz}]`}
      </pre>

      <button
        onClick={copyCamera}
        style={{
          marginTop: 16,

          width: "100%",

          padding: "10px",

          cursor: "pointer",

          borderRadius: 8,

          border: "none",

          background: "#d4af37",

          color: "#111",

          fontWeight: 700,
        }}
      >
        Copy Camera
      </button>
    </div>
  );
}