"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useJourney } from "./JourneyProvider";
import { useRide } from "@/components/Island/boat-ride/boatRideStore";
import { JOURNEY_STOPS } from "@/lib/journey";

const CHAPTER_COPY: Record<string, { left: string; right: string }> = {
  dock: {
    left: "A quiet landing place before the journey begins.",
    right: "Follow the path through the island's hidden spaces.",
  },
  bridge: {
    left: "Developer, designer, and builder of digital worlds.",
    right: "Curious by nature. Precise when it matters.",
  },
  gate: {
    left: "React, Next.js, Django, Three.js, and cloud systems.",
    right: "Scalable foundations with an immersive human touch.",
  },
  courtyard: {
    left: "Products shaped from first idea to final interaction.",
    right: "Performance, clarity, and experiences people remember.",
  },
  tower: {
    left: "Have a project, idea, or difficult problem?",
    right: "Reach out and let's build something meaningful.",
  },
};

export default function ChapterPanel() {
  const { started, currentStop, cameraState } = useJourney();
  const ride = useRide();

  if (!started || ride.phase !== "idle") return null;
  const copy = CHAPTER_COPY[currentStop.id] ?? CHAPTER_COPY.dock;
  const transitioning = cameraState !== "idle";

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        pointerEvents: "none",
        overflow: "hidden",
        color: "#f4edda",
        textShadow: "0 2px 18px rgba(0,0,0,.75)",
      }}
    >
      <style>{`
        @keyframes island-side-drift {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -7px; }
        }
        @media (max-width: 560px) {
          .island-side-copy { width: min(36vw, 150px) !important; }
          .island-side-title { font-size: clamp(20px, 6vw, 34px) !important; }
          .island-side-detail { font-size: 10px !important; }
        }
      `}</style>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStop.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: transitioning ? 1 : 0.82 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          style={{ position: "absolute", inset: 0 }}
        >
          <motion.div
            className="island-side-copy"
            initial={{ opacity: 0, x: -48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              left: "max(28px, env(safe-area-inset-left))",
              top: "43%",
              width: "min(25vw, 300px)",
              animation: "island-side-drift 6s ease-in-out infinite",
            }}
          >
            <div style={{ color: "#e1bd78", fontSize: 10, letterSpacing: ".32em", marginBottom: 13 }}>
              {String(JOURNEY_STOPS.findIndex((stop) => stop.id === currentStop.id) + 1).padStart(2, "0")} / ISLAND
            </div>
            <h2 className="island-side-title" style={{ fontSize: "clamp(25px, 4vw, 52px)", fontWeight: 300, lineHeight: 1.02, margin: "0 0 15px", letterSpacing: ".04em" }}>
              {currentStop.title}
            </h2>
            <p className="island-side-detail" style={{ color: "rgba(245,239,220,.84)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              {copy.left}
            </p>
          </motion.div>

          <motion.div
            className="island-side-copy"
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "absolute",
              right: "max(28px, env(safe-area-inset-right))",
              bottom: "18%",
              width: "min(23vw, 270px)",
              textAlign: "right",
              animation: "island-side-drift 7s ease-in-out infinite reverse",
            }}
          >
            <div style={{ color: "#e1bd78", fontSize: 10, letterSpacing: ".28em", marginBottom: 12 }}>
              {currentStop.subtitle}
            </div>
            <p className="island-side-detail" style={{ color: "rgba(245,239,220,.84)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              {copy.right}
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
