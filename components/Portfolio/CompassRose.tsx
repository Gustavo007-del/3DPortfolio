// components/Portfolio/CompassRose.tsx
"use client";

import styles from "./ExplorerOverlay.module.css";
import { SECTIONS } from "@/lib/portfolioData";

const CARDINALS = ["N", "NE", "E", "SE", "S"];

export default function CompassRose({ progress }: { progress: number }) {
  const activeIndex = Math.min(SECTIONS.length - 1, Math.floor(progress * SECTIONS.length));
  const rotation = progress * 620; // a little under two full spins across the journey

  return (
    <div className={styles.compassWrap} aria-hidden="true">
      <div className={styles.compassDial} style={{ transform: `rotate(${rotation}deg)` }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="50"
              x2={50 + 42 * Math.sin((deg * Math.PI) / 180)}
              y2={50 - 42 * Math.cos((deg * Math.PI) / 180)}
              stroke="var(--gold)"
              strokeWidth={deg % 90 === 0 ? 1.5 : 0.6}
              opacity={deg % 90 === 0 ? 0.9 : 0.4}
            />
          ))}
          <polygon points="50,10 56,50 50,90 44,50" fill="var(--seal)" opacity="0.9" />
          <circle cx="50" cy="50" r="4" fill="var(--paper)" />
        </svg>
      </div>
      <span className={styles.compassLabel}>
        {CARDINALS[activeIndex]} · {SECTIONS[activeIndex]}
      </span>
    </div>
  );
}