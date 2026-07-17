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
          -35.104,
          21.394,
          24.717,
          -0.954,
          5.248,
          -10.579,
          true
        );
      }}
    >
      Go To End
    </button>
  );
}