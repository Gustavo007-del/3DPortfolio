// components/Portfolio/ExplorerOverlay.tsx
"use client";

import styles from "./ExplorerOverlay.module.css";
import { profile, compassPoints, skills, projects, SECTIONS } from "@/lib/portfolioData";

// 5 sections spread evenly across the FULL scroll range: first section's
// center sits at progress=0, last section's center sits at progress=1, so
// Hero is fully opaque before any scrolling happens and Contact is fully
// opaque at the very bottom — instead of both being clipped at the edges.
const CENTERS = SECTIONS.map((_, i) => i / (SECTIONS.length - 1));
const HALF_WIDTH = 0.22; // wide enough that adjacent panels overlap smoothly, no dead gaps

function panelStyle(progress: number, index: number, rotate: number): React.CSSProperties {
  const t = (progress - CENTERS[index]) / HALF_WIDTH;
  const opacity = Math.max(0, 1 - Math.abs(t));
  const translateY = Math.max(-1, Math.min(1, t)) * 36;
  return {
    opacity,
    transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
  };
}

export default function ExplorerOverlay({ progress }: { progress: number }) {
  return (
    <div className={styles.overlayRoot}>
      {/* HERO */}
      <section className={`${styles.panel} ${styles.heroPanel}`} style={panelStyle(progress, 0, 0)}>
        <p className={styles.eyebrow}>Field Journal — {profile.location}</p>
        <h1 className={styles.heroTitle}>{profile.name}</h1>
        <p className={styles.heroRole}>{profile.role}</p>
        <p className={styles.heroTagline}>{profile.tagline}</p>
        <p className={styles.scrollPrompt} style={{ opacity: progress < 0.04 ? 1 : 0 }}>
          ↓ scroll to begin the expedition
        </p>
      </section>

      {/* ABOUT */}
      <section
        className={`${styles.panel} ${styles.aboutPanel} ${styles.tornBottom}`}
        style={panelStyle(progress, 1, -1.4)}
      >
        <p className={styles.eyebrow}>Chapter I — {SECTIONS[1]}</p>
        <p className={styles.bodyText}>{profile.bio}</p>
        <dl className={styles.fieldNotes}>
          {compassPoints.map((p) => (
            <div key={p.label} className={styles.fieldNote}>
              <dt>{p.label}</dt>
              <dd>{p.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* SKILLS */}
      <section
        className={`${styles.panel} ${styles.skillsPanel} ${styles.tornBottom}`}
        style={panelStyle(progress, 2, 1.1)}
      >
        <p className={styles.eyebrow}>Chapter II — {SECTIONS[2]}</p>
        <div className={styles.skillGrid}>
          {skills.map((s) => (
            <div key={s.name} className={styles.skillItem}>
              <div className={styles.skillRing} style={{ ["--lvl" as any]: s.level }}>
                <span>{s.level}%</span>
              </div>
              <div>
                <p className={styles.skillName}>{s.name}</p>
                <p className={styles.skillCategory}>{s.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROJECTS */}
      <section
        className={`${styles.panel} ${styles.projectsPanel}`}
        style={panelStyle(progress, 3, -0.8)}
      >
        <p className={styles.eyebrow}>Chapter III — {SECTIONS[3]}</p>
        <div className={styles.projectList}>
          {projects.map((p) => (
            <div key={p.title} className={`${styles.projectCard} ${styles.tornBottom}`}>
              <p className={styles.coordinates}>{p.coordinates}</p>
              <h3 className={styles.projectTitle}>{p.title}</h3>
              <p className={styles.bodyText}>{p.description}</p>
              <div className={styles.tagRow}>
                {p.tags.map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section className={`${styles.panel} ${styles.contactPanel}`} style={panelStyle(progress, 4, 1.6)}>
        <p className={styles.eyebrow}>Chapter IV — {SECTIONS[4]}</p>
        <h2 className={styles.contactTitle}>Send word ashore</h2>
        <p className={styles.bodyText}>Open to new expeditions — backend systems or creative 3D work.</p>
        <div className={styles.contactLinks}>
          <a href={`mailto:${profile.email}`} className={styles.sealLink}>
            Email
          </a>
          <a href={profile.github} target="_blank" rel="noreferrer" className={styles.sealLink}>
            GitHub
          </a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className={styles.sealLink}>
            LinkedIn
          </a>
        </div>
      </section>
    </div>
  );
}