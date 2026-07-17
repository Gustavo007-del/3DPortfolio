// components/Portfolio/ExpeditionRoute.tsx
"use client";

import styles from "./ExplorerOverlay.module.css";
import { SECTIONS } from "@/lib/portfolioData";

const THRESHOLDS = [0, 0.2, 0.4, 0.6, 0.8];

export default function ExpeditionRoute({ progress }: { progress: number }) {
  return (
    <div className={styles.routeRail} aria-hidden="true">
      <svg className={styles.routeSvg} viewBox="0 0 40 1000" preserveAspectRatio="none">
        <line x1="20" y1="0" x2="20" y2="1000" className={styles.routeTrack} />
        <line
          x1="20"
          y1="0"
          x2="20"
          y2="1000"
          className={styles.routeFill}
          style={{ strokeDashoffset: 1000 - progress * 1000 }}
        />
      </svg>
      {SECTIONS.map((label, i) => {
        const stamped = progress >= THRESHOLDS[i] - 0.015;
        return (
          <div
            key={label}
            className={`${styles.waypointStamp} ${stamped ? styles.stamped : ""}`}
            style={{ top: `${THRESHOLDS[i] * 100}%` }}
          >
            <span className={styles.stampRing} />
            <span className={styles.stampLabel}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}