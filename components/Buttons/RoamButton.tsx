"use client";
import { useWorldState } from "@/components/World/WorldState";

export default function RoamButton() {
  const { phase, roaming, setRoaming } = useWorldState();

  if (phase !== "SPACE") return null;

  function handleClick() {
    const next = !roaming;
    setRoaming(next);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 20,
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px",
        background: roaming ? "rgba(255,120,80,0.15)" : "rgba(140,220,255,0.06)",
        border: roaming ? "1px solid rgba(255,150,100,0.7)" : "1px solid rgba(140,220,255,0.35)",
        color: roaming ? "rgba(255,200,180,0.95)" : "rgba(200,230,255,0.85)",
        fontSize: 10,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        fontFamily: "monospace",
        cursor: "pointer",
        backdropFilter: "blur(2px)",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      {roaming ? "◼ Exit Roam" : "▶ Roam Space"}
    </button>
  );
}
