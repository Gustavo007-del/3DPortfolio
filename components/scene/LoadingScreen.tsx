// components/LoadingScreen.tsx
"use client";

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  progress: number;
  visible: boolean;
}

const BOOT_LINES = [
  "INIT :: RENDER_CORE",
  "COMPILING SHADERS...",
  "BUILDING SCENE GRAPH",
  "CALIBRATING ORBITS",
  "LINKING AUDIO BUS",
  "SYNCING CAMERA RIG",
  "READY",
];

function useBootLog(active: boolean) {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setLines(BOOT_LINES.slice(0, i));
      if (i >= BOOT_LINES.length) clearInterval(id);
    }, 380);
    return () => clearInterval(id);
  }, [active]);
  return lines;
}

export default function LoadingScreen({ progress, visible }: LoadingScreenProps) {
  const lines = useBootLog(visible);
  if (!visible) return null;

  const segments = 24;
  const filledSegments = Math.round((progress / 100) * segments);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#040404",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: "monospace",
        animation: "fadeOut 0.8s ease forwards",
        animationDelay: progress >= 100 ? "0s" : "9999s",
        opacity: 1,
      }}
    >
      {/* Animated grid backdrop */}
      <div
        style={{
          position: "absolute",
          inset: "-50%",
          backgroundImage:
            "linear-gradient(rgba(140,220,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(140,220,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          animation: "gridDrift 18s linear infinite",
          transform: "perspective(600px) rotateX(55deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 20%, #040404 78%)",
        }}
      />

      {/* Corner HUD brackets */}
      {[
        { top: 24, left: 24, borderTop: "1px solid", borderLeft: "1px solid" },
        { top: 24, right: 24, borderTop: "1px solid", borderRight: "1px solid" },
        { bottom: 24, left: 24, borderBottom: "1px solid", borderLeft: "1px solid" },
        { bottom: 24, right: 24, borderBottom: "1px solid", borderRight: "1px solid" },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 28,
            height: 28,
            borderColor: "rgba(140,220,255,0.4)",
            ...pos,
          }}
        />
      ))}

      {/* Rotating multi-ring emblem */}
      <div style={{ position: "relative", width: 130, height: 130, marginBottom: 36 }}>
        <svg width="130" height="130" viewBox="0 0 130 130" style={{ position: "absolute", inset: 0 }}>
          <circle
            cx="65" cy="65" r="58" fill="none" stroke="rgba(140,220,255,0.15)" strokeWidth="1"
          />
          <circle
            cx="65" cy="65" r="58" fill="none" stroke="#8fe0ff" strokeWidth="1.5"
            strokeDasharray="30 260" strokeLinecap="round"
            style={{ transformOrigin: "65px 65px", animation: "ringSpin 3.4s linear infinite" }}
          />
          <circle
            cx="65" cy="65" r="42" fill="none" stroke="rgba(255,170,68,0.18)" strokeWidth="1"
          />
          <circle
            cx="65" cy="65" r="42" fill="none" stroke="#ffaa44" strokeWidth="1.5"
            strokeDasharray="18 240" strokeLinecap="round"
            style={{ transformOrigin: "65px 65px", animation: "ringSpin 2.1s linear infinite reverse" }}
          />
          <circle
            cx="65" cy="65" r="26" fill="none" stroke="rgba(140,220,255,0.25)" strokeWidth="1"
            strokeDasharray="4 8"
            style={{ transformOrigin: "65px 65px", animation: "ringSpin 6s linear infinite" }}
          />
        </svg>
        {/* Pulsing core */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#ffffff",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 16px 4px rgba(255,255,255,0.7), 0 0 40px 12px rgba(140,220,255,0.3)",
            animation: "corePulse 1.6s ease-in-out infinite",
          }}
        />
      </div>

      {/* Glitch-reveal name */}
      <h1
        style={{
          color: "#f4fbff",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 3,
          marginBottom: 8,
          position: "relative",
          textShadow: "0 0 20px rgba(140,220,255,0.4)",
        }}
      >
        <span style={{ animation: "glitchIn 0.9s ease forwards" }}>ASA SHIJIL</span>
      </h1>

      <p
        style={{
          color: "rgba(140,220,255,0.6)",
          fontSize: 15,
          letterSpacing: 7,
          textTransform: "uppercase",
          marginBottom: 40,
          opacity: 0,
          animation: "textIn 0.6s ease forwards 0.5s",
        }}
      >
        Full Stack Developer &nbsp;·&nbsp; Creative Technologist
      </p>

      {/* Boot log */}
      <div
        style={{
          width: 260,
          height: 90,
          marginBottom: 28,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 3,
        }}
      >
        {lines.map((line, i) => (
          <p
            key={line}
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: i === lines.length - 1 ? "rgba(166,232,255,0.95)" : "rgba(140,220,255,0.3)",
              margin: 0,
              animation: "logLineIn 0.25s ease",
            }}
          >
            <span style={{ color: "rgba(140,220,255,0.4)" }}>[{String(i).padStart(2, "0")}]</span> {line}
          </p>
        ))}
      </div>

      {/* Segmented progress bar */}
      <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 14,
              background: i < filledSegments ? "linear-gradient(180deg, #8fe0ff, #4a90d9)" : "rgba(255,255,255,0.08)",
              boxShadow: i < filledSegments ? "0 0 6px rgba(140,220,255,0.6)" : "none",
              transition: "background 0.2s ease",
            }}
          />
        ))}
      </div>

      <p
        style={{
          color: "rgba(166,232,255,0.7)",
          fontSize: 12,
          letterSpacing: 3,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {Math.round(progress)}% &nbsp;//&nbsp; SYSTEM READY IN T-MINUS
      </p>

      <style>{`
        @keyframes ringSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes corePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.6); opacity: 0.6; }
        }
        @keyframes gridDrift {
          from { background-position: 0 0, 0 0; }
          to { background-position: 0 480px, 480px 0; }
        }
        @keyframes glitchIn {
          0% { opacity: 0; transform: translateX(-6px); filter: blur(4px); }
          20% { opacity: 1; transform: translateX(3px); filter: blur(0); }
          35% { transform: translateX(-2px); }
          50% { transform: translateX(1px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes textIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes logLineIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; pointer-events: none; }
        }
      `}</style>
    </div>
  );
}