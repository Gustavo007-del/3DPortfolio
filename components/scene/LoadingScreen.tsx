// components/LoadingScreen.tsx
"use client";

interface LoadingScreenProps {
  progress: number;
  visible: boolean;
}

export default function LoadingScreen({ progress, visible }: LoadingScreenProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#050505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeOut 0.8s ease forwards",
        animationDelay: progress >= 100 ? "0s" : "9999s",
        opacity: 1,
      }}
    >
      {/* Faint radial vignette, matches the reference's near-black backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, #0d0d0d 0%, #050505 75%)",
        }}
      />

      {/* 4-square logo mark, staggered scale-in then a slow continuous pulse */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 44px)",
          gridTemplateRows: "repeat(2, 44px)",
          gap: 10,
          marginBottom: 40,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 44,
              height: 44,
              background: "#ffffff",
              opacity: 0,
              animation: `squareIn 0.5s ease forwards ${i * 0.12}s, squarePulse 2.4s ease-in-out infinite ${1.2 + i * 0.15}s`,
            }}
          />
        ))}
      </div>

      <h1
        style={{
          color: "#ffffff",
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 0.5,
          marginBottom: 10,
          fontFamily: "Inter, sans-serif",
          opacity: 0,
          animation: "textIn 0.6s ease forwards 0.5s",
        }}
      >
        Asa Shijil
      </h1>

      <p
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 12,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 56,
          fontFamily: "Inter, sans-serif",
          opacity: 0,
          animation: "textIn 0.6s ease forwards 0.65s",
        }}
      >
        Backend Engineer &nbsp;·&nbsp; Creative Developer
      </p>

      {/* Thin ring spinner, single stroke, matches the reference's understated feel */}
      <div
        style={{
          position: "relative",
          width: 46,
          height: 46,
          marginBottom: 48,
          opacity: 0,
          animation: "textIn 0.6s ease forwards 0.8s",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid transparent",
            borderTopColor: "rgba(255,255,255,0.9)",
            animation: "loaderSpin 1.1s linear infinite",
          }}
        />
      </div>

      {/* <p
        style={{
          position: "absolute",
          bottom: 48,
          color: "rgba(255,255,255,0.3)",
          fontSize: 11,
          letterSpacing: 3,
          textTransform: "uppercase",
          fontFamily: "monospace",
          opacity: 0,
          animation: "textIn 0.6s ease forwards 1s",
        }}
      >
        Powered by Curiosity &amp; Code — {Math.round(progress)}%
      </p> */}

      <style>{`
        @keyframes squareIn {
          from { opacity: 0; transform: scale(0.4); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes squarePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes textIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loaderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; pointer-events: none; }
        }
      `}</style>
    </div>
  );
}