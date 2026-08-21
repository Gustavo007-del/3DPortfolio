"use client";

import { useEffect, useState } from "react";
import GravitationalVortex from "./GravitationalVortex";

interface LoadingScreenProps {
  progress: number;
  visible: boolean;
  complete: boolean;
}

const BOOT_LINES = [
  "INIT :: RENDER_CORE",
  "COMPILING SHADERS...",
  "BUILDING SCENE GRAPH",
  "CALIBRATING ORBITS",
  "LINKING AUDIO BUS",
  "SYNCING CAMERA RIG",
  "LOADING WORLD ASSETS",
  "GENERATING TERRAIN",
  "INITIALIZING WATER",
  "LOADING ATMOSPHERE",
  "SYNCING LIGHTING",
  "CALIBRATING CAMERA",
  "FINALIZING SCENE",
  "READY",
];

function useBootLog(active: boolean) {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!active) {
      setLines([]);
      return;
    }

    let index = 0;

    setLines([BOOT_LINES[0]]);

    const interval = setInterval(() => {
      index++;

      if (index >= BOOT_LINES.length) {
        clearInterval(interval);
        return;
      }

      setLines((current) => [
        ...current,
        BOOT_LINES[index],
      ]);
    }, 320);

    return () => clearInterval(interval);
  }, [active]);

  return lines;
}

export default function LoadingScreen({
  progress,
  visible,
  complete,
}: LoadingScreenProps) {
  const lines = useBootLog(visible);

  const safeProgress = Math.max(
    0,
    Math.min(100, progress)
  );

  // Driven by the real "safe to exit" gate (assets loaded AND min time elapsed),
  // NOT just local asset progress. This is what was causing the screen to
  // visually fade / go click-through before the 10s minimum was up.
  const isComplete = complete;

  const segments = 30;

  const filledSegments = Math.round(
    (safeProgress / 100) * segments
  );

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        overflow: "hidden",

        // No old black background.
        background: "#000",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        fontFamily: "monospace",

        animation: isComplete
          ? "loadingFadeOut 1s ease forwards"
          : "none",

        pointerEvents: isComplete
          ? "none"
          : "auto",
      }}
    >
      {/* =====================================================
          FULLSCREEN VORTEX
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        <GravitationalVortex
          progress={safeProgress}
          background="#000000"
          baseColor="#8fe0ff"
          accentColor="#ffaa44"
          density={35}
          dotSize={240}
          speed={30}
          direction="inward"
          scale={100}
          tiltX={55}
          tiltY={0}
          twist={38}
          funnel={62}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {/* =====================================================
          VERY SUBTLE CENTER DEPTH
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.42) 100%)",
        }}
      />

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div
        style={{
          position: "relative",
          zIndex: 5,
          width: "min(600px, 90vw)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* =================================================
            NAME
        ================================================== */}

        <h1
          style={{
            margin: "0 0 8px",
            padding: 0,

            fontSize:
              "clamp(26px, 4vw, 38px)",

            fontWeight: 700,

            lineHeight: 1,

            letterSpacing: 6,

            color: "#ffffff",

            textShadow: `
              0 0 10px rgba(255,255,255,0.8),
              0 0 30px rgba(140,220,255,0.65),
              0 0 60px rgba(140,220,255,0.3)
            `,

            animation:
              "nameReveal 0.9s ease forwards",
          }}
        >
          ASA SHIJIL
        </h1>

        {/* =================================================
            SUBTITLE
        ================================================== */}

        <p
          style={{
            margin: "0 0 34px",

            color:
              "rgba(220,245,255,0.82)",

            fontSize:
              "clamp(9px, 1.5vw, 12px)",

            letterSpacing: 5,

            textTransform: "uppercase",

            textShadow:
              "0 0 15px rgba(140,220,255,0.7)",

            opacity: 0,

            animation:
              "textReveal 0.7s ease forwards 0.35s",
          }}
        >
          Full Stack Developer
          <span
            style={{
              margin: "0 9px",
              opacity: 0.65,
            }}
          >
            ·
          </span>
          Creative Technologist
        </p>

        {/* =================================================
            BOOT LOG
        ================================================== */}

        <div
          style={{
            width: "min(340px, 82vw)",
            height: 110,

            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",

            gap: 4,

            marginBottom: 24,

            overflow: "hidden",

            textAlign: "left",
          }}
        >
          {lines.slice(-7).map(
            (line, index, array) => {
              const isLast =
                index === array.length - 1;

              return (
                <div
                  key={`${line}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",

                    gap: 8,

                    fontSize: 9,

                    lineHeight: 1.5,

                    letterSpacing: 1.7,

                    color: isLast
                      ? "rgba(190,240,255,0.95)"
                      : "rgba(190,235,255,0.42)",

                    textShadow: isLast
                      ? "0 0 10px rgba(140,220,255,0.7)"
                      : "none",

                    animation:
                      "logLineIn 0.25s ease forwards",
                  }}
                >
                  <span
                    style={{
                      color: isLast
                        ? "#8fe0ff"
                        : "rgba(140,220,255,0.35)",

                      fontWeight: 700,
                    }}
                  >
                    {isLast ? ">" : "·"}
                  </span>

                  <span>
                    {line}
                  </span>
                </div>
              );
            }
          )}
        </div>

        {/* =================================================
            LOADING STATUS
        ================================================== */}

        <div
          style={{
            width:
              "min(420px, 84vw)",

            display: "flex",
            justifyContent:
              "space-between",

            alignItems: "center",

            marginBottom: 8,

            fontSize: 9,

            letterSpacing: 2.5,

            color:
              "rgba(210,245,255,0.72)",

            textTransform:
              "uppercase",

            textShadow:
              "0 0 10px rgba(140,220,255,0.5)",
          }}
        >
          <span>
            {isComplete
              ? "WORLD ONLINE"
              : "LOADING WORLD"}
          </span>

          <span
            style={{
              color: "#ffffff",

              fontVariantNumeric:
                "tabular-nums",

              textShadow:
                "0 0 12px rgba(140,220,255,0.8)",
            }}
          >
            {Math.round(
              safeProgress
            )
              .toString()
              .padStart(3, "0")}
            %
          </span>
        </div>

        {/* =================================================
            PROGRESS BAR
        ================================================== */}

        <div
          style={{
            width:
              "min(420px, 84vw)",

            height: 13,

            display: "flex",

            gap: 3,

            marginBottom: 16,
          }}
        >
          {Array.from({
            length: segments,
          }).map((_, index) => {
            const filled =
              index < filledSegments;

            return (
              <div
                key={index}
                style={{
                  flex: 1,

                  height: "100%",

                  background: filled
                    ? `
                      linear-gradient(
                        180deg,
                        #e8fbff 0%,
                        #8fe0ff 35%,
                        #4d9ed1 100%
                      )
                    `
                    : "rgba(255,255,255,0.13)",

                  boxShadow: filled
                    ? `
                      0 0 5px rgba(140,220,255,0.8),
                      0 0 14px rgba(140,220,255,0.35)
                    `
                    : "none",

                  transition:
                    "all 180ms ease",
                }}
              />
            );
          })}
        </div>

        {/* =================================================
            STATUS
        ================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",

            gap: 9,

            fontSize: 8,

            letterSpacing: 2.2,

            color:
              "rgba(210,245,255,0.6)",

            textTransform:
              "uppercase",

            textShadow:
              "0 0 10px rgba(140,220,255,0.45)",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,

              borderRadius: "50%",

              background: isComplete
                ? "#8fe0ff"
                : "#ffaa44",

              boxShadow: isComplete
                ? "0 0 12px rgba(140,220,255,1)"
                : "0 0 12px rgba(255,170,68,1)",

              animation: isComplete
                ? "none"
                : "statusPulse 1s ease-in-out infinite",
            }}
          />

          <span>
            {isComplete
              ? "ALL SYSTEMS NOMINAL"
              : "CALIBRATING ENVIRONMENT"}
          </span>
        </div>
      </div>

      {/* =====================================================
          MINIMAL TOP STATUS
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          top: 30,
          left: 34,
          right: 34,

          zIndex: 6,

          display: "flex",
          justifyContent:
            "space-between",

          fontSize: 8,

          letterSpacing: 2.5,

          color:
            "rgba(210,245,255,0.45)",

          textTransform:
            "uppercase",

          textShadow:
            "0 0 8px rgba(140,220,255,0.5)",
        }}
      >
        <span>
          SYSTEM / BOOT_SEQUENCE
        </span>

        <span>
          {isComplete
            ? "ONLINE"
            : "INITIALIZING"}
        </span>
      </div>

      {/* =====================================================
          MINIMAL BOTTOM STATUS
      ====================================================== */}

      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 34,
          right: 34,

          zIndex: 6,

          display: "flex",
          justifyContent:
            "space-between",

          fontSize: 8,

          letterSpacing: 2,

          color:
            "rgba(210,245,255,0.35)",

          textTransform:
            "uppercase",

          textShadow:
            "0 0 8px rgba(140,220,255,0.4)",
        }}
      >
        <span>
          WEBGL / R3F / GLSL
        </span>

        <span>
          {new Date().getFullYear()}
          .08
        </span>
      </div>

      <style>{`
        @keyframes nameReveal {
          0% {
            opacity: 0;
            transform:
              translateY(10px)
              scale(0.97);
            filter: blur(7px);
          }

          60% {
            opacity: 1;
            transform:
              translateY(-2px)
              scale(1);
            filter: blur(0);
          }

          100% {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        @keyframes textReveal {
          from {
            opacity: 0;
            transform:
              translateY(7px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes logLineIn {
          from {
            opacity: 0;
            transform:
              translateX(-8px);
          }

          to {
            opacity: 1;
            transform:
              translateX(0);
          }
        }

        @keyframes statusPulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.8);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes loadingFadeOut {
          0% {
            opacity: 1;
          }

          65% {
            opacity: 1;
          }

          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}