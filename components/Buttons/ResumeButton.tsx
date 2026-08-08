"use client";

import { useWorldState } from "@/components/World/WorldState";

export default function ResumeButton() {
  const { phase } = useWorldState();

  if (phase === "ISLAND" || phase === "TRANSITION_TO_ISLAND") return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
      }}
    >
      <a
        href="/resume.pdf"
        download
        className="resume-btn"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 18px",
          background: "rgba(140,220,255,0.06)",
          border: "1px solid rgba(140,220,255,0.35)",
          color: "rgba(200,230,255,0.85)",
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          textDecoration: "none",
          backdropFilter: "blur(2px)",
        }}
      >
        <span style={{ width: 6, height: 1, background: "rgba(140,220,255,0.6)" }} />
        Download Resume
        <span style={{ width: 6, height: 1, background: "rgba(140,220,255,0.6)" }} />
      </a>
    </div>
  );
}
