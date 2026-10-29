"use client";

import { useJourney } from "./JourneyProvider";
import { useRide } from "@/components/Island/boat-ride/boatRideStore";
import cinematicStyles from "./JourneyCinematic.module.css";

export default function JourneyUI() {
  const {
  started,
  currentIndex,
  totalStops,
  isTransitioning,
  beginJourney,
  next,
  previous,
  cinematic,
  startCinematic,
  stopCinematic,
} = useJourney();

  // Hide/dim journey UI while riding (PLAN §10): overlays must not compete
  // with the HUD, and its buttons must not be clickable mid-ride.
  const ride = useRide();
  if (ride.phase !== "idle") return null;

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
            island is in some remodelling!!!
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: "0.85rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            Scroll to travel through the world
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
          {cinematic === "playing" && <div className={cinematicStyles.frame} aria-hidden="true">
            <div className={cinematicStyles.vignette} />
            <div className={cinematicStyles.flare} />
            <div className={cinematicStyles.shutter} />
            <div className={cinematicStyles.top} />
            <div className={cinematicStyles.bottom} />
            <span className={cinematicStyles.caption}>THE ISLAND <i>·</i> A FINAL PASS</span>
            <div className={cinematicStyles.sequence}>
              <span className={cinematicStyles.phaseOne}>01 / COASTAL DIVE</span>
              <span className={cinematicStyles.phaseTwo}>02 / LOW SWEEP</span>
              <span className={cinematicStyles.phaseThree}>03 / ISLAND ORBIT</span>
              <span className={cinematicStyles.phaseFour}>04 / OVERHEAD</span>
              <span className={cinematicStyles.phaseFive}>05 / WIDE REVEAL</span>
            </div>
            <div className={cinematicStyles.progress}><span /></div>
          </div>}
          <div
            style={{
              position: "absolute",
              top: 28,
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.78)",
              fontSize: "0.72rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textAlign: "center",
              width: "calc(100% - 32px)",
            }}
          >
            {cinematic === "playing" ? "ISLAND / CINEMATIC FLYOVER" : `Chapter ${currentIndex + 1} of ${totalStops}`}
          </div>

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
              {cinematic === "playing" ? "A final look around the island" : "Traveling..."}
            </div>
          )}

          {!isTransitioning && (
            <div
              style={{
                position: "absolute",
                bottom: 92,
                left: "50%",
                transform: "translateX(-50%)",
                color: "rgba(255,255,255,0.72)",
                fontSize: "0.72rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                textAlign: "center",
                width: "calc(100% - 32px)",
              }}
            >
              {currentIndex === totalStops - 1
                ? cinematic === "complete" ? "The island, seen from above" : "One last journey awaits"
                : "Choose Next to continue your journey"}
            </div>
          )}

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
              disabled={currentIndex === 0 || cinematic === "playing"}
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
              onClick={currentIndex === totalStops - 1
                ? cinematic === "playing" ? stopCinematic : startCinematic
                : next}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.9)",
                fontSize: "1rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {currentIndex === totalStops - 1
                ? cinematic === "playing" ? "Skip tour →" : cinematic === "complete" ? "Replay tour ↺" : "Tour island →"
                : "Next →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
