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
      body: "Full Stack Developer crafting scalable web, mobile, and interactive 3D experiences. From backend architecture to immersive interfaces—I build products end to end.",
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
      body: "Building modern SaaS platforms, mobile applications, enterprise dashboards, booking systems, AI-powered tools, and immersive web experiences that perform at scale.",
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
      body: "React • Next.js • React Native • Django • Python • Three.js • React Three Fiber • Docker • Kubernetes • Celery • Redis • PostgreSQL • REST APIs",
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
      body: "Clean architecture, scalable systems, responsive interfaces, and maintainable code. Every project is engineered for performance, reliability, and exceptional user experience.",
      anchor: "right",
      vertical: "top",
    },
  },
];

const SKILLS = ["PYTHON", "DJANGO", "R3F", "NEXT.JS", "POSTGRES", "CELERY", "REACT NATIVE", "DOCKER", "KUBERNETES", "REDIS","TAILWINDCSS","TYPESCRIPT"];

function useTypewriter(text: string, speed = 22) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
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

  useEffect(() => {
    if (phase !== "SPACE") return;

    function tick() {
      const p = progressRef.current;
      setLiveProgress(p);

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
      <div style={{ ...positionStyle, transition: "top 500ms ease, left 500ms ease, right 500ms ease" }}>
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
              color: "#f2fbff",
              textShadow: "0 0 20px rgba(120,220,255,0.45), 0 0 60px rgba(80,160,255,0.25)",
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
  className="mt-4 text-xs md:text-[13px] font-light"
  style={{
    color: "rgba(210,235,255,0.72)",
    lineHeight: 1.9,
    letterSpacing: "0.03em",
    textAlign: "justify",
    maxWidth: "34rem",
    textWrap: "pretty",
    hyphens: "auto",

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
            {content.body}
          </p>
        </div>
      </div>

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

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
        <p className="text-[10px] tracking-[0.4em]" style={{ color: "rgba(200,230,255,0.4)" }}>
          SCROLL // TRAVEL &nbsp;·&nbsp; DRAG // ORBIT
        </p>
      </div>
    </div>
  );
}