// components/SpaceOverlay.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useWorldState } from "@/components/World/WorldState";

type Anchor = "left" | "right";
type StageContent = { id: string; eyebrow: string; heading: string; body: string; anchor: Anchor; vertical: "top" | "mid" };

const STAGES: { at: number; content: StageContent }[] = [
  {
    at: 0,
    content: {
      id: "identity",
      eyebrow: "IDENTITY.SYS // 01",
      heading: "ASA SHIJIL",
      body: "I TURN IDEAS INTO INTERFACES, SYSTEMS, AND WORLDS.",
      anchor: "left",
      vertical: "top",
    },
  },
  {
    at: 0.12,
    content: {
      id: "build",
      eyebrow: "PAYLOAD.LOG // 02",
      heading: "FULL STACK. MOBILE. 3D.",
      body: "ONE STACK. EVERY SCREEN. NO ORDINARY BUILDS.",
      anchor: "right",
      vertical: "top",
    },
  },
  {
    at: 0.24,
    content: {
      id: "render",
      eyebrow: "RENDER.PIPE // 03",
      heading: "ENGINEERING THE EXPERIENCE",
      body: "FROM REACT TO REDIS. FROM CODE TO IMMERSION.",
      anchor: "left",
      vertical: "top",
    },
  },
  {
    at: 0.36,
    content: {
      id: "approach",
      eyebrow: "NAV.APPROACH // 04",
      heading: "BUILD. OPTIMIZE. SHIP.",
      body: "BUILT TO FEEL EFFORTLESS. ENGINEERED TO LAST.",
      anchor: "right",
      vertical: "top",
    },
  },
  {
    // The final message finishes at 45% of the trajectory.
    at: 0.5,
    content: {
      id: "empty",
      eyebrow: "",
      heading: "",
      body: "",
      anchor: "left",
      vertical: "top",
    },
  },
];

const SKILLS = ["DJANGO", "R3F","KUBERNETES", "REDIS","WEBSOCKETS"];

function useTypewriter(text: string, speed = 22, delay = 0) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    if (!text) return;
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, delay);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, delay]);
  return out;
}

// Maps each stage's anchor/vertical combo to actual position classes+styles.
// Kept as a lookup rather than inline ternaries so adding a 5th/6th stage
// position later is a one-line addition here, not a scattered edit.
function getPositionStyle(anchor: Anchor, vertical: "top" | "mid"): React.CSSProperties {
  const base: React.CSSProperties = { position: "absolute", maxWidth: "28rem" };
  if (vertical === "top") {
    base.top = "6rem"; // raised from the old ~38% center — sits higher, under the HUD readouts
  } else {
    base.top = "50%";
    base.transform = "translateY(-50%)";
  }
  if (anchor === "left") {
    base.left = "2rem";
  } else {
    base.right = "2rem";
    base.textAlign = "right";
  }
  return base;
}

export default function SpaceOverlay() {
  const { phase, progressRef } = useWorldState();
  const [stageIndex, setStageIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  const stageIndexRef = useRef(0);
  const publishedProgressRef = useRef(0);
  const lastPublishRef = useRef(0);

  useEffect(() => {
    if (phase !== "SPACE") return;

    function tick() {
      const p = progressRef.current;
      // The 3D camera consumes the ref every frame. HUD numbers and the small
      // meter only need a few updates per second; re-rendering the entire
      // overlay at display refresh competes with the WebGL scene.
      const now = performance.now();
      if (Math.abs(p - publishedProgressRef.current) >= 0.001 && now - lastPublishRef.current >= 80) {
        publishedProgressRef.current = p;
        lastPublishRef.current = now;
        setLiveProgress(p);
      }

      let next = 0;
      for (let i = STAGES.length - 1; i >= 0; i--) {
        if (p >= STAGES[i].at) { next = i; break; }
      }
      if (next !== stageIndexRef.current) {
        stageIndexRef.current = next;
        setFading(true);
        setTimeout(() => {
          setStageIndex(next);
          setFading(false);
        }, 180);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, progressRef]);

  const { content } = STAGES[stageIndex];
  const heading = useTypewriter(fading ? "" : content.heading, 28);
  const body = useTypewriter(
    fading ? "" : content.body,
    13,
    content.heading.length * 28 + 100
  );
  const scanPct = Math.round(liveProgress * 100);
  const positionStyle = getPositionStyle(content.anchor, content.vertical);

  if (phase !== "SPACE") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden font-mono">
      <style>{`
        @keyframes hud-flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.4; }
          94% { opacity: 1; }
        }
        @keyframes hud-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes hud-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes hud-in {
          from { opacity: 0; letter-spacing: 0.15em; }
          to { opacity: 1; letter-spacing: 0.08em; }
        }
        @keyframes travel-wheel {
          0%, 100% { transform: translateY(-5px); opacity: 0.35; }
          50% { transform: translateY(5px); opacity: 1; }
        }
        @keyframes travel-chevron {
          0%, 100% { transform: translateY(-3px); opacity: 0.2; }
          50% { transform: translateY(4px); opacity: 1; }
        }
        @keyframes travel-sweep {
          from { transform: translateX(-110%); }
          to { transform: translateX(220%); }
        }
        .hud-fade-in { animation: hud-in 400ms ease forwards; }
        
      `}</style>

      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)" }}
      />

      <div
        className="absolute left-0 right-0 h-24"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(120,220,255,0.06), transparent)",
          animation: "hud-scan 6s linear infinite",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, rgba(150,220,255,0.6) 0px, transparent 1px, transparent 3px)",
        }}
      />

      {[
        { top: "1.5rem", left: "1.5rem", borderTop: "1px solid", borderLeft: "1px solid" },
        { top: "1.5rem", right: "1.5rem", borderTop: "1px solid", borderRight: "1px solid" },
        { bottom: "1.5rem", left: "1.5rem", borderBottom: "1px solid", borderLeft: "1px solid" },
        { bottom: "1.5rem", right: "1.5rem", borderBottom: "1px solid", borderRight: "1px solid" },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-8 h-8"
          style={{ ...pos, borderColor: "rgba(140,220,255,0.5)", animation: "hud-flicker 5s ease-in-out infinite" }}
        />
      ))}
    
      <div className="absolute top-8 left-14 hidden md:block" style={{ animation: "hud-flicker 7s ease-in-out infinite" }}>
        <p className="text-[10px] tracking-[0.3em]" style={{ color: "rgba(140,220,255,0.6)" }}>
          SOL.NAV — LIVE
        </p>
        <p className="text-[10px] mt-1" style={{ color: "rgba(140,220,255,0.35)" }}>
          CAM_θ {(liveProgress * 137).toFixed(2).padStart(6, "0")}° / CAM_φ {(liveProgress * 53).toFixed(2).padStart(6, "0")}°
        </p>
      </div>

      <div className="absolute top-8 right-14 text-right hidden md:block">
        <p className="text-[10px] tracking-[0.3em]" style={{ color: "rgba(140,220,255,0.6)" }}>
          TRAJECTORY
        </p>
        <div className="flex items-center gap-2 mt-1 justify-end">
          <div className="w-24 h-[3px] bg-white/10 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0"
              style={{ width: `${scanPct}%`, background: "linear-gradient(to right, #4fd0ff, #a6e8ff)", boxShadow: "0 0 8px #4fd0ff" }}
            />
          </div>
          <span className="text-[10px] font-mono" style={{ color: "rgba(166,232,255,0.85)" }}>
            {scanPct}%
          </span>
        </div>
      </div>

      {/* Main stage text — position now driven per-stage via getPositionStyle,
          migrating between corners/sides as the user scrolls through STAGES. */}
      {content.heading && (
      <div
        style={{
          ...positionStyle,
          padding: "1.25rem",
          borderRadius: "1rem",
          background: content.anchor === "left"
            ? "linear-gradient(90deg, rgba(3, 13, 30, 0.84), rgba(3, 13, 30, 0.48), transparent)"
            : "linear-gradient(270deg, rgba(3, 13, 30, 0.84), rgba(3, 13, 30, 0.48), transparent)",
          // backdropFilter: "blur(1px)",
          boxShadow: content.anchor === "left"
            ? "-12px 0 30px rgba(3, 13, 30, 0.22)"
            : "12px 0 30px rgba(3, 13, 30, 0.22)",
          transition: "top 500ms ease, left 500ms ease, right 500ms ease",
        }}
      >
        <div
          key={content.id}
          className={fading ? "" : "hud-fade-in"}
          style={{ opacity: fading ? 0 : 1, transition: "opacity 180ms ease" }}
        >
          <div className={`flex items-center gap-2 mb-3 ${content.anchor === "right" ? "justify-end" : ""}`}>
            {content.anchor === "left" && <div className="w-6 h-[1px]" style={{ background: "rgba(140,220,255,0.6)" }} />}
            <p className="text-[10px] tracking-[0.35em]" style={{ color: "rgba(140,220,255,0.75)" }}>
              {content.eyebrow}
            </p>
            {content.anchor === "right" && <div className="w-6 h-[1px]" style={{ background: "rgba(140,220,255,0.6)" }} />}
          </div>
          <h1
            className="mt-4 text-sm md:text-[25px]"
            style={{
              color: "transparent",
              backgroundImage: "linear-gradient(90deg, #67dcff 0%, #d8c4ff 52%, #ffd49b 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              textShadow: "0 0 20px rgba(120,220,255,0.45), 0 0 60px rgba(80,160,255,0.25)",
              fontFamily: "var(--font-mono), monospace",
              letterSpacing: "0.02em",
              minHeight: "1.1em",
            }}
          >
            {heading}
            <span
              className="inline-block w-[3px] h-[0.85em] ml-1 align-middle"
              style={{ background: "#8fe0ff", animation: "hud-pulse 1s steps(2) infinite" }}
            />
          </h1>
          <p
  className="mt-4"
  style={{
    fontFamily: "var(--font-mono), monospace",
    fontSize: "clamp(11px, 1vw, 13px)",
    fontWeight: 400,
    color: "#d8edfa",
    textShadow: "0 0 18px rgba(103, 220, 255, 0.16)",
    lineHeight: 1.7,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    textAlign: "left",
    maxWidth: "34rem",
    minHeight: "3rem",
    hyphens: "none",

    borderLeft: content.anchor === "left"
      ? "1px solid rgba(140,220,255,0.3)"
      : "none",

    borderRight: content.anchor === "right"
      ? "1px solid rgba(140,220,255,0.3)"
      : "none",

    paddingLeft: content.anchor === "left" ? "1rem" : 0,
    paddingRight: content.anchor === "right" ? "1rem" : 0,
  }}
>
            {body}
          </p>
        </div>
      </div>
      )}

      <div className="absolute top-1/2 right-8 -translate-y-1/2 hidden lg:flex flex-col items-end gap-4">
        {STAGES.map((s, i) => (
          <div key={s.content.id} className="flex items-center gap-2">
            <span
              className="text-[9px] tracking-widest transition-all duration-300"
              style={{ color: i === stageIndex ? "rgba(166,232,255,0.9)" : "rgba(166,232,255,0.25)" }}
            >
              0{i + 1}
            </span>
            <div
              className="transition-all duration-300"
              style={{
                width: i === stageIndex ? "28px" : "10px",
                height: "1px",
                background: i === stageIndex ? "#8fe0ff" : "rgba(140,220,255,0.3)",
                boxShadow: i === stageIndex ? "0 0 6px #8fe0ff" : "none",
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-10 left-14 hidden lg:block">
        <p className="text-[9px] tracking-[0.3em] mb-2" style={{ color: "rgba(140,220,255,0.5)" }}>
          STACK.MANIFEST
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 max-w-[220px]">
          {SKILLS.map((s) => (
            <span key={s} className="text-[10px] tracking-wider" style={{ color: "rgba(200,230,255,0.55)" }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center md:bottom-8"
        style={{
          color: "#e4f7ff",
        }}
      >
        <p className="sr-only">
          SCROLL // TRAVEL &nbsp;·&nbsp; DRAG // ORBIT
        </p>
        <div className="flex items-center justify-center gap-3">
          <div
            className="relative h-10 w-6 rounded-full border"
            style={{ borderColor: "rgba(143,224,255,0.82)", boxShadow: "0 0 14px rgba(79,208,255,0.4)" }}
          >
            <span
              className="absolute left-1/2 top-2 h-3 w-[2px] -translate-x-1/2 rounded-full bg-[#b8efff]"
              style={{ animation: "travel-wheel 1.3s ease-in-out infinite" }}
            />
          </div>
          <div className="text-left">
            <p
              className="text-xs font-bold tracking-[0.2em] md:text-sm md:tracking-[0.28em]"
              style={{
                color: "transparent",
                backgroundImage: "linear-gradient(90deg, #69dcff 0%, #d8c4ff 52%, #ffd49b 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
              }}
            >
              SCROLL TO TRAVEL
            </p>
            <p className="mt-1 text-[10px] tracking-[0.14em]" style={{ color: "rgba(200,230,255,0.82)" }}>
              SECTOR {String(stageIndex + 1).padStart(2, "0")} <span className="mx-1 text-[#8fe0ff]">/</span> {scanPct}% EXPLORED
            </p>
          </div>
          <span className="text-lg text-[#8fe0ff]" style={{ animation: "travel-chevron 1.3s ease-in-out infinite" }}>↓</span>
        </div>
        <div className="relative mt-3 h-px w-full overflow-hidden bg-cyan-100/20">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-[#8fe0ff]" style={{ animation: "travel-sweep 1.8s ease-in-out infinite", boxShadow: "0 0 10px #8fe0ff" }} />
        </div>
      </div>
    </div>
  );
}
