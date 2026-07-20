"use client";

import { useJourney } from "./JourneyProvider";

export default function JourneyUI() {
  const {
  started,
  currentIndex,
  totalStops,
  isTransitioning,
  beginJourney,
  next,
  previous,
} = useJourney();

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
              {isTransitioning && (
            <div
              style={{
                position: "absolute",
                bottom: 110,
                left: "50%",
                transform: "translateX(-50%)",

                color: "white",

                letterSpacing: "0.2em",

                textTransform: "uppercase",

                opacity: 0.8,

                fontSize: "0.9rem",
              }}
            >
              Traveling...
            </div>
          )}

          {!isTransitioning && (
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
              disabled={ isTransitioning ||currentIndex === 0}
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
              disabled={  isTransitioning ||  currentIndex === totalStops - 1}
              style={{
                background: "transparent",
                border: "none",
                color:
                  currentIndex === totalStops - 1
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.9)",
                fontSize: "1rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor:
                  currentIndex === totalStops - 1
                    ? "default"
                    : "pointer",
              }}
            >
              Next →
            </button>
          </div>
          )}
        </>
      )}
    </div>
  );
}