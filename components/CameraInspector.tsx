// CameraInspector.tsx
"use client";

export default function CameraInspector() {
  return (
    <button
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 999,
        padding: "10px 20px",
      }}
      onClick={() => {
        const dbg = (window as any).__cameraDebug;

        dbg.controls.setLookAt(
          -44.334,
          35.054,
          24.049,
          -4.088,
          5.949,
          -1.996,
          true
        );
      }}
    >
      Go To End
    </button>
  );
}