"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useJourney } from "./JourneyProvider";
import { useRide } from "@/components/Island/boat-ride/boatRideStore";
import { JOURNEY_STOPS } from "@/lib/journey";
import styles from "./ChapterPanel.module.css";

const CHAPTER_COPY: Record<string, { lead: string; detail: string }> = {
  dock: {
    lead: "A quiet landing place before the journey begins.",
    detail: "Follow the path through the island's hidden spaces.",
  },
  bridge: {
    lead: "Developer, designer, and builder of digital worlds.",
    detail: "Curious by nature. Precise when it matters.",
  },
  gate: {
    lead: "React, Next.js, Django, Three.js, and cloud systems.",
    detail: "Scalable foundations with an immersive human touch.",
  },
  courtyard: {
    lead: "Products shaped from first idea to final interaction.",
    detail: "Performance, clarity, and experiences people remember.",
  },
  tower: {
    lead: "Have a project, idea, or difficult problem?",
    detail: "Reach out and let's build something meaningful.",
  },
};

export default function ChapterPanel() {
  const { started, currentStop, cinematic } = useJourney();
  const ride = useRide();
  if (!started || ride.phase !== "idle" || cinematic !== "idle") return null;

  const copy = CHAPTER_COPY[currentStop.id] ?? CHAPTER_COPY.dock;
  const number = String(JOURNEY_STOPS.findIndex((stop) => stop.id === currentStop.id) + 1).padStart(2, "0");

  return (
    <div className={styles.overlay} aria-live="polite">
      <div className={styles.position}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStop.id}
            className={styles.copy}
            initial={{ opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={styles.index}>{number} <span>/</span> ISLAND JOURNEY</p>
            <h2>{currentStop.title}</h2>
            <p className={styles.lead}>{copy.lead}</p>
            <div className={styles.rule} aria-hidden="true" />
            <p className={styles.subtitle}>{currentStop.subtitle}</p>
            <p className={styles.detail}>{copy.detail}</p>
            {currentStop.id === "courtyard" && (
              <Link className={styles.projectLink} href="/projects">
                Explore projects <span aria-hidden="true">↗</span>
              </Link>
            )}
            {currentStop.id === "tower" && (
              <div className={styles.contactLinks}>
                <a href="tel:+919061444017"><span>CALL</span>9061444017 ↗</a>
                <a href="mailto:shijilkt27@gmail.com"><span>EMAIL</span>shijilkt27@gmail.com ↗</a>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
