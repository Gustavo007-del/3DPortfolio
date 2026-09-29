"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useJourney } from "./JourneyProvider";

const CHAPTER_CARDS: Record<string, { left: { label: string; text: string }; right: { label: string; text: string } }> = {
  dock: {
    left: { label: "ORIGIN", text: "A quiet landing place before the journey begins." },
    right: { label: "EXPLORE", text: "Follow the path through the island's hidden spaces." },
  },
  bridge: {
    left: { label: "PROFILE", text: "Developer, designer, and builder of digital worlds." },
    right: { label: "APPROACH", text: "Curious by nature. Precise when it matters." },
  },
  gate: {
    left: { label: "TOOLKIT", text: "React, Next.js, Django, Three.js, and cloud systems." },
    right: { label: "CRAFT", text: "Scalable foundations with an immersive human touch." },
  },
  courtyard: {
    left: { label: "SELECTED WORK", text: "Products shaped from first idea to final interaction." },
    right: { label: "FOCUS", text: "Performance, clarity, and experiences people remember." },
  },
  tower: {
    left: { label: "OPEN CHANNEL", text: "Have a project, idea, or difficult problem?" },
    right: { label: "NEXT STEP", text: "Reach out and let us build something meaningful." },
  },
};

export default function ChapterPanel() {
  const {
    started,
    currentStop,
    cameraState,
  } = useJourney();
  const [cardsVisible, setCardsVisible] = useState(true);

  useEffect(() => {
    setCardsVisible(true);
    const timeout = window.setTimeout(() => setCardsVisible(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [currentStop.id]);

  if (!started) return null;

  const cards = CHAPTER_CARDS[currentStop.id] ?? CHAPTER_CARDS.dock;

  return (
    <AnimatePresence>
      <>
        <style>{`
          .island-chapter-card {
            position: absolute;
            top: max(24px, env(safe-area-inset-top));
            width: min(24vw, 288px);
            min-height: 116px;
            padding: 17px 20px 17px 24px;
            overflow: hidden;
            border: 1px solid rgba(212, 176, 113, 0.36);
            border-radius: 6px;
            background: linear-gradient(135deg, rgba(23, 38, 33, 0.88), rgba(5, 13, 14, 0.7));
            box-shadow: 0 16px 42px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 232, 184, 0.12);
            backdrop-filter: blur(16px) saturate(120%);
          }
          .island-chapter-card::before {
            content: "";
            position: absolute;
            inset: 0 auto 0 0;
            width: 3px;
            background: linear-gradient(to bottom, #e1bd78, rgba(124, 157, 119, 0.25));
          }
          .island-chapter-card::after {
            content: "";
            position: absolute;
            right: -28px;
            bottom: -42px;
            width: 100px;
            height: 100px;
            border: 1px solid rgba(212, 176, 113, 0.12);
            border-radius: 50%;
          }
          .island-chapter-card-left { left: max(24px, env(safe-area-inset-left)); }
          .island-chapter-card-right { right: max(24px, env(safe-area-inset-right)); }
          .island-chapter-card p { max-width: 215px; }
          @media (max-width: 720px) {
            .island-chapter-card {
              top: max(16px, env(safe-area-inset-top));
              width: calc(50% - 22px);
              min-height: 104px;
              padding: 14px 13px 14px 17px;
            }
            .island-chapter-card-left { left: 14px; }
            .island-chapter-card-right { right: 14px; }
            .island-chapter-card p { font-size: 10px !important; line-height: 1.45 !important; }
            .island-chapter-card span { font-size: 9px !important; }
          }
          @media (max-width: 430px) {
            .island-chapter-card {
              position: relative;
              top: auto;
              left: auto;
              right: auto;
              width: 100%;
              min-height: 0;
              padding: 11px 14px 11px 17px;
            }
            .island-chapter-cards {
              position: absolute;
              top: max(12px, env(safe-area-inset-top));
              left: 16px;
              right: 16px;
              display: grid;
              gap: 8px;
            }
          }
        `}</style>

        <AnimatePresence>
          {cardsVisible && (
            <motion.div
              className="island-chapter-cards"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.45 } }}
              transition={{ duration: 0.5, delay: cameraState === "idle" ? 0 : 0.25 }}
              style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "none",
                zIndex: 100,
              }}
            >
              {[{ side: "left", card: cards.left }, { side: "right", card: cards.right }].map(({ side, card }) => (
                <div key={side} className={`island-chapter-card island-chapter-card-${side}`}>
                  <span
                    style={{
                      display: "block",
                      color: "#e1bd78",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.2em",
                      marginBottom: 10,
                    }}
                  >
                    {card.label}
                  </span>
                  <p
                    style={{
                      color: "rgba(245, 239, 220, 0.8)",
                      fontSize: 12,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {card.text}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

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
      </>
    </AnimatePresence>
  );
}