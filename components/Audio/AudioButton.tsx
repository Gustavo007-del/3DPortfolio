
// components/Audio/AudioButton.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useAudio } from "./AudioProvider";

export default function AudioButton() {
  const { isMuted, toggleMute, __ensureInitialized } = useAudio();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimer = useRef<NodeJS.Timeout | null>(null);

  const handleInteraction = () => {
    __ensureInitialized();
    toggleMute();
  }

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setShowTooltip(true), 400);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }
    setShowTooltip(false);
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);

  useEffect(() => {
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    };
  }, []);

  const icon = isMuted ? "🔇" : "🔊";
  const tooltipText = isMuted ? "Enable Ambient Sound" : "Disable Ambient Sound";

  return (
    <div style={styles.container}>
      <button
        onClick={handleInteraction}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{
          ...styles.button,
          transform: isPressed ? "scale(0.92)" : isHovered ? "scale(1.05)" : "scale(1)",
          boxShadow: isHovered
            ? "0 8px 32px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.15)"
            : "0 4px 16px rgba(0,0,0,0.2)",
          background: isHovered
            ? "rgba(255,255,255,0.18)"
            : "rgba(255,255,255,0.10)",
        }}
        aria-label="Toggle ambient sound"
      >
        <span
          style={{
            ...styles.icon,
            opacity: isMuted ? 0.6 : 1,
            transform: isMuted ? "scale(0.85)" : "scale(1)",
          }}
        >
          {icon}
        </span>
      </button>

      {showTooltip && (
        <div style={styles.tooltip}>
          {tooltipText}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    bottom: 32,
    left: 32,
    zIndex: 200,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    pointerEvents: "none",
  },
  button: {
    pointerEvents: "auto",
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.15)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    backgroundColor: "rgba(255,255,255,0.10)",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.15s ease, background 0.3s ease, box-shadow 0.3s ease",
    outline: "none",
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
    userSelect: "none",
  },
  icon: {
    fontSize: 24,
    lineHeight: 1,
    transition: "opacity 0.3s ease, transform 0.3s ease",
  },
  tooltip: {
    pointerEvents: "none",
    background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "white",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: "0.75rem",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    animation: "fadeInTooltip 0.2s ease",
  },
};

// Add keyframe animation
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes fadeInTooltip {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(styleSheet);
}