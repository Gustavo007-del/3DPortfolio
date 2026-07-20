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
          >
            <div
              style={{
                color: "#b08d57",
                textAlign: "center",
                letterSpacing: "0.5em",
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              JOURNEY
            </div>

            <h1
              style={{
                color: "white",

                fontSize: 72,

                fontWeight: 300,

                margin: 0,

                textAlign: "center",
              }}
            >
              {currentStop.title}
            </h1>

            <p
              style={{
                color: "#cccccc",

                fontSize: 20,

                marginTop: 16,

                textAlign: "center",
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