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
        background: "#050510",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeOut 0.8s ease forwards",
        animationDelay: progress >= 100 ? "0s" : "9999s",
        opacity: 1,
      }}
    >
      {/* Animated star field background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, #0a0a2a 0%, #050510 70%)",
        }}
      />

      {/* Orbiting loader */}
      <div style={{ position: "relative", width: 80, height: 80, marginBottom: 32 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#4a90d9",
            borderRightColor: "#4a90d9",
            animation: "loaderSpin 1.2s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 12,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderBottomColor: "#ffaa33",
            borderLeftColor: "#ffaa33",
            animation: "loaderSpin 0.8s linear infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#ffffff",
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 12px rgba(255,255,255,0.5)",
          }}
        />
      </div>

      <h2
        style={{
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 16,
          fontFamily: "Inter, sans-serif",
        }}
      >
        Loading Universe
      </h2>

      {/* Progress bar */}
      <div
        style={{
          width: 200,
          height: 2,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 1,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "linear-gradient(90deg, #4a90d9, #ffaa33)",
            borderRadius: 1,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <p
        style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontFamily: "monospace",
        }}
      >
        {Math.round(progress)}%
      </p>

      <style>{`
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
