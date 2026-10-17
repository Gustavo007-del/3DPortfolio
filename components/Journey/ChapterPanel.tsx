"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useJourney } from "./JourneyProvider";

export default function ChapterPanel() {
  const {
    started,
    currentStop,
    cameraState,
  } = useJourney();

  if (!started) return null;

  return (
    <AnimatePresence>
      {cameraState !== "idle" && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          style={{
            position: "fixed",
            inset: 0,

            pointerEvents: "none",

            display: "flex",
            justifyContent: "center",
            alignItems: "center",

            flexDirection: "column",

            zIndex: 100,
          }}
        >
          <motion.div
            initial={{
              y: 30,
            }}
            animate={{
              y: 0,
            }}
            exit={{
              y: -30,
            }}
            transition={{
              duration: 0.8,
            }}
            style={{
              padding: "2rem clamp(1.5rem, 6vw, 5rem)",
              borderRadius: "1.5rem",
              background: "radial-gradient(ellipse at center, rgba(3, 14, 30, 0.82) 0%, rgba(3, 14, 30, 0.54) 52%, transparent 75%)",
              boxShadow: "0 0 50px 28px rgba(3, 14, 30, 0.32)",
              backdropFilter: "blur(5px)",
            }}
          >
            <div
              style={{
                color: "#7ee2ff",
                textAlign: "center",
                letterSpacing: "0.5em",
                fontSize: 14,
                marginBottom: 16,
                textShadow: "0 1px 12px rgba(3, 14, 30, 0.85)",
              }}
            >
              JOURNEY
            </div>

            <h1
              style={{
                color: "transparent",
                backgroundImage: "linear-gradient(90deg, #58d7ff 0%, #d6c2ff 52%, #ffd29a 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",

                fontSize: 72,

                fontWeight: 300,

                margin: 0,

                textAlign: "center",
                textShadow: "0 2px 20px rgba(3, 14, 30, 0.9)",
              }}
            >
              {currentStop.title}
            </h1>

            <p
              style={{
                color: "#e6f7ff",

                fontSize: 20,

                marginTop: 16,

                textAlign: "center",
                textShadow: "0 2px 14px rgba(3, 14, 30, 0.95)",
              }}
            >
              {currentStop.subtitle}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
