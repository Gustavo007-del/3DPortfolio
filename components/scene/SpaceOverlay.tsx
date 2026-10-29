// components/SpaceOverlay.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWorldState } from "@/components/World/WorldState";

type Anchor = "left" | "right";
type StageContent = { id: string; eyebrow: string; heading: string; body: string; anchor: Anchor; vertical: "top" | "mid" };

const STAGES: { at: number; content: StageContent }[] = [
  {
    at: 0,
    content: {
      id: "identity",
      eyebrow: "01 / THE DEVELOPER",
      heading: "ASA SHIJIL",
      body: "I build interfaces, systems, and worlds.",
      anchor: "left",
      vertical: "top",
    },
  },
  {
    at: 0.08,
    content: {
      id: "build",
      eyebrow: "02 / THE TOOLKIT",
      heading: "FULL STACK. MOBILE. 3D.",
      body: "Full-stack development, mobile products, and immersive 3D.",
      anchor: "right",
      vertical: "top",
    },
  },
  {
    at: 0.16,
    content: {
      id: "render",
      eyebrow: "03 / THE EXPERIENCE",
      heading: "ENGINEERING THE EXPERIENCE",
      body: "From React to Redis. From backend systems to visual experiences.",
      anchor: "left",
      vertical: "top",
    },
  },
  {
    at: 0.26,
    content: {
      id: "approach",
      eyebrow: "04 / THE APPROACH",
      heading: "BUILD. OPTIMIZE. SHIP.",
      body: "Thoughtful experiences, reliable engineering, and work that ships.",
      anchor: "right",
      vertical: "top",
    },
  },
  {
    // The last message is visible well before clouds begin at progress 0.37.
    at: 0.46,
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
const STAGE_DWELL_MS = 600;

// Even a large wheel or touch gesture must show every story beat in order.
export function nextStageIndex(current: number, desired: number, elapsedMs: number) {
  if (current === desired || elapsedMs < STAGE_DWELL_MS) return current;
  return current + Math.sign(desired - current);
}

// Maps each stage's anchor/vertical combo to actual position classes+styles.
// Kept as a lookup rather than inline ternaries so adding a 5th/6th stage
// position later is a one-line addition here, not a scattered edit.
function getPositionStyle(anchor: Anchor, vertical: "top" | "mid"): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: "min(54vw, 42rem)",
    maxWidth: "42rem",
    textAlign: anchor === "right" ? "right" : "left",
  };
  if (vertical === "top") {
    base.top = "clamp(7rem, 19vh, 11rem)";
  } else {
    base.top = "50%";
    base.transform = "translateY(-50%)";
  }
  if (anchor === "left") {
    base.left = "clamp(24px, 6vw, 88px)";
  } else {
    base.right = "clamp(24px, 6vw, 88px)";
  }
  return base;
}

export default function SpaceOverlay() {
  const { phase, progressRef } = useWorldState();
  const [stageIndex, setStageIndex] = useState(0);
  const [liveProgress, setLiveProgress] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  const stageIndexRef = useRef(0);
  const lastStageChangeRef = useRef(0);
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

      let desired = 0;
      for (let i = STAGES.length - 1; i >= 0; i--) {
        if (p >= STAGES[i].at) { desired = i; break; }
      }
      const next = nextStageIndex(stageIndexRef.current, desired, now - lastStageChangeRef.current);
      if (next !== stageIndexRef.current) {
        stageIndexRef.current = next;
        lastStageChangeRef.current = now;
        setStageIndex(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, progressRef]);

  const { content } = STAGES[stageIndex];
  const scanPct = Math.round(liveProgress * 100);
  const positionStyle = getPositionStyle(content.anchor, content.vertical);

  if (phase !== "SPACE") return null;

  return (
    <div className="space-overlay fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <style>{`
        @keyframes hud-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes hud-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes hud-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
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
        .space-hud-label { font-family: var(--font-mono), monospace; letter-spacing: .16em; }
        .space-display-heading {
          color: #f3ead8;
          font-family: var(--font-display), Georgia, serif;
          font-size: clamp(2rem, 3.5vw, 3.4rem);
          font-weight: 400;
          letter-spacing: -.045em;
          line-height: .98;
          text-wrap: balance;
          text-shadow: 0 4px 32px rgba(0, 0, 0, .48);
        }
        .space-body-copy {
          color: rgba(239, 237, 225, .88);
          font-family: var(--font-body), Georgia, serif;
          font-size: clamp(15px, 1.25vw, 19px);
          font-weight: 400;
          letter-spacing: .005em;
          line-height: 1.8;
          text-transform: none;
          text-shadow: 0 2px 18px rgba(0, 0, 0, .65);
        }
        .space-project-link {
          border-color: rgba(212, 193, 151, .45) !important;
          border-radius: 999px;
          background: rgba(10, 18, 20, .56) !important;
          color: #f3ead8 !important;
          font-family: var(--font-mono), monospace;
          letter-spacing: .11em;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 35px rgba(0,0,0,.18);
        }
        .space-project-link:hover { border-color: rgba(219, 190, 130, .85) !important; background: rgba(25, 39, 38, .8) !important; }
        .space-scroll-prompt { font-family: var(--font-display), Georgia, serif; letter-spacing: .08em; }
        .space-scroll-meta { font-family: var(--font-mono), monospace; letter-spacing: .12em; }
        .space-copy-panel { padding: 0; background: transparent; box-shadow: none; }
        .space-eyebrow { color: rgba(219, 205, 169, .76); }
        .space-accent-line { background: rgba(219, 205, 169, .62); }
        .space-stage-index { font-family: var(--font-mono), monospace; }
        .space-swipe-label { display: none; }
        @media (pointer: coarse) {
          .space-scroll-label { display: none; }
          .space-swipe-label { display: inline; }
        }
        @media (max-width: 640px) {
          .space-display-heading { font-size: clamp(1.9rem, 7.5vw, 2.6rem); }
          .space-copy-panel { top: 23% !important; left: 24px !important; right: 24px !important; width: auto !important; max-width: none !important; }
          .space-copy-panel[data-anchor="right"] { text-align: right !important; }
          .space-project-link { top: auto !important; bottom: 9.5rem; right: 18px !important; padding: 10px 13px !important; font-size: 9px !important; }
          .space-corner { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .space-overlay *, .space-overlay *::before, .space-overlay *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
        }
      `}</style>

      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)" }}
      />

      <div
        className="space-scan absolute left-0 right-0 h-24"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(214,198,158,0.035), transparent)",
          animation: "hud-scan 6s linear infinite",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, rgba(218,205,171,0.24) 0px, transparent 1px, transparent 4px)",
        }}
      />

      {liveProgress < 0.08 && (
        <Link
          href="/projects"
          className="space-project-link absolute top-20 right-8 md:right-14 pointer-events-auto inline-flex items-center gap-3 border px-4 py-3 text-[10px] transition-colors"
          style={{ textDecoration: "none" }}
        >
          <span style={{ color: "rgba(219,205,169,0.75)" }}>01—03</span>
          <span>View selected projects</span>
          <span aria-hidden="true">↗</span>
        </Link>
      )}

      {[
        { top: "1.5rem", left: "1.5rem", borderTop: "1px solid", borderLeft: "1px solid" },
        { top: "1.5rem", right: "1.5rem", borderTop: "1px solid", borderRight: "1px solid" },
        { bottom: "1.5rem", left: "1.5rem", borderBottom: "1px solid", borderLeft: "1px solid" },
        { bottom: "1.5rem", right: "1.5rem", borderBottom: "1px solid", borderRight: "1px solid" },
      ].map((pos, i) => (
        <div
          key={i}
          className="space-corner absolute w-8 h-8"
          style={{ ...pos, borderColor: "rgba(212,193,151,0.4)" }}
        />
      ))}
    
      <div className="absolute top-8 left-14 hidden md:block">
        <p className="space-hud-label text-[10px]" style={{ color: "rgba(223,212,183,0.74)" }}>
          SOL.NAV / LIVE
        </p>
        <p className="space-hud-label text-[9px] mt-2" style={{ color: "rgba(223,212,183,0.42)" }}>
          CAM_θ {(liveProgress * 137).toFixed(2).padStart(6, "0")}° / CAM_φ {(liveProgress * 53).toFixed(2).padStart(6, "0")}°
        </p>
      </div>

      <div className="absolute top-8 right-14 text-right hidden md:block">
        <p className="space-hud-label text-[10px]" style={{ color: "rgba(223,212,183,0.74)" }}>
          TRAJECTORY
        </p>
        <div className="flex items-center gap-2 mt-1 justify-end">
          <div className="w-24 h-[2px] bg-white/15 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0"
              style={{ width: `${scanPct}%`, background: "linear-gradient(to right, #b8cbb1, #e3d2ac)", boxShadow: "0 0 8px rgba(227,210,172,.45)" }}
            />
          </div>
          <span className="space-hud-label text-[9px]" style={{ color: "rgba(238,229,205,0.85)" }}>
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
          padding: 0,
          background: "transparent",
          boxShadow: "none",
          transition: "top 500ms ease, left 500ms ease, right 500ms ease",
        }}
        className="space-copy-panel"
        data-anchor={content.anchor}
      >
        <div
          key={content.id}
          className="hud-fade-in"
        >
          <div className={`flex items-center gap-3 mb-5 ${content.anchor === "right" ? "justify-end" : ""}`}>
            {content.anchor === "left" && <div className="w-8 h-px space-accent-line" />}
            <p className="space-hud-label space-eyebrow text-[10px]">
              {content.eyebrow}
            </p>
            {content.anchor === "right" && <div className="w-8 h-px space-accent-line" />}
          </div>
          <h1
            className="space-display-heading"
            style={{
              minHeight: "1.1em",
            }}
          >
            {content.heading}
            <span
              className="inline-block w-[3px] h-[0.85em] ml-1 align-middle"
              style={{ background: "#d8c59b", animation: "hud-pulse 1.4s ease-in-out infinite" }}
            />
          </h1>
          <p
  className="space-body-copy mt-5"
  style={{
    textAlign: content.anchor,
    maxWidth: "34rem",
    marginLeft: content.anchor === "right" ? "auto" : 0,
    minHeight: "3.5rem",
    hyphens: "none",
  }}
>
            {content.body}
          </p>
        </div>
      </div>
      )}

      <div className="absolute top-1/2 right-8 -translate-y-1/2 hidden lg:flex flex-col items-end gap-4">
        {STAGES.slice(0, -1).map((s, i) => (
          <div key={s.content.id} className="flex items-center gap-2">
            <span
              className="space-stage-index text-[9px] tracking-widest transition-all duration-300"
              style={{ color: i === stageIndex ? "rgba(219,205,169,0.92)" : "rgba(219,205,169,0.32)" }}
            >
              0{i + 1}
            </span>
            <div
              className="transition-all duration-300"
              style={{
                width: i === stageIndex ? "28px" : "10px",
                height: "1px",
                background: i === stageIndex ? "#d8c59b" : "rgba(219,205,169,0.28)",
                boxShadow: i === stageIndex ? "0 0 8px rgba(216,197,155,.5)" : "none",
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-10 left-14 hidden lg:block">
        <p className="space-hud-label text-[9px] mb-2" style={{ color: "rgba(219,205,169,0.58)" }}>
          Stack / manifest
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 max-w-[220px]">
          {SKILLS.map((s) => (
            <span key={s} className="space-hud-label text-[9px] tracking-wider" style={{ color: "rgba(225,222,207,0.62)" }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center md:bottom-8"
        style={{
          color: "#f3ead8",
        }}
      >
        <p className="sr-only">
          SCROLL OR SWIPE TO TRAVEL
        </p>
        <div className="flex items-center justify-center gap-3">
          <div
            className="relative h-10 w-6 rounded-full border"
            style={{ borderColor: "rgba(219,205,169,0.72)", boxShadow: "0 0 18px rgba(219,205,169,0.14)" }}
          >
            <span
              className="absolute left-1/2 top-2 h-3 w-[2px] -translate-x-1/2 rounded-full bg-[#e4d4ae]"
              style={{ animation: "travel-wheel 1.3s ease-in-out infinite" }}
            />
          </div>
          <div className="text-left">
            <p
              className="space-scroll-prompt text-base md:text-lg"
              style={{
                color: "#f3ead8",
              }}
            >
              <span className="space-scroll-label">SCROLL TO TRAVEL</span>
              <span className="space-swipe-label">SWIPE TO TRAVEL</span>
            </p>
            <p className="space-scroll-meta mt-1 text-[9px]" style={{ color: "rgba(225,222,207,0.72)" }}>
              SECTOR {String(Math.min(stageIndex + 1, 4)).padStart(2, "0")} <span className="mx-1" style={{ color: "#d8c59b" }}>/</span> {scanPct}% EXPLORED
            </p>
          </div>
          <span className="text-lg" style={{ color: "#d8c59b", animation: "travel-chevron 1.3s ease-in-out infinite" }}>↓</span>
        </div>
        <div className="relative mt-3 h-px w-full overflow-hidden" style={{ background: "rgba(219,205,169,.2)" }}>
          <div className="absolute inset-y-0 left-0 w-1/3" style={{ background: "#d8c59b", animation: "travel-sweep 1.8s ease-in-out infinite", boxShadow: "0 0 10px rgba(216,197,155,.5)" }} />
        </div>
      </div>
    </div>
  );
}
