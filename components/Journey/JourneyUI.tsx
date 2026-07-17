"use client";

import { JOURNEY_STOPS } from "@/lib/journey";
import { useJourney } from "./JourneyProvider";

export default function JourneyUI() {
  const {
    started,
    currentIndex,
    beginJourney,
    next,
    previous,
  } = useJourney();

  const stop = JOURNEY_STOPS[currentIndex];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {!started && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center",
            gap: 18,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.55))",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: "clamp(4rem, 8vw, 7rem)",
              fontWeight: 200,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            THE ISLAND
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: "1.2rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            A Journey Through My Work
          </div>

          <button
            onClick={beginJourney}
            style={{
              pointerEvents: "auto",
              marginTop: 40,
              padding: "16px 42px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 999,
              color: "white",
              fontSize: "1rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              transition: "all .3s ease",
            }}
          >
            Begin Journey
          </button>
        </div>
      )}

      {started && (
        <>
          <div
            style={{
              position: "absolute",
              top: 60,
              left: 60,
              maxWidth: 420,
            }}
          >
            <h2
              style={{
                color: "white",
                fontSize: "2.2rem",
                fontWeight: 300,
                marginBottom: 8,
                letterSpacing: "0.04em",
              }}
            >
              {stop.title}
            </h2>

            <p
              style={{
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.7,
                fontSize: "1rem",
              }}
            >
              {stop.subtitle}
            </p>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 48,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 80,
              pointerEvents: "auto",
            }}
          >
            <button
              onClick={previous}
              disabled={currentIndex === 0}
              style={{
                background: "transparent",
                border: "none",
                color:
                  currentIndex === 0
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.9)",
                fontSize: "1rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: currentIndex === 0 ? "default" : "pointer",
              }}
            >
              ← Previous
            </button>

            <button
              onClick={next}
              disabled={currentIndex === JOURNEY_STOPS.length - 1}
              style={{
                background: "transparent",
                border: "none",
                color:
                  currentIndex === JOURNEY_STOPS.length - 1
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.9)",
                fontSize: "1rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor:
                  currentIndex === JOURNEY_STOPS.length - 1
                    ? "default"
                    : "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}