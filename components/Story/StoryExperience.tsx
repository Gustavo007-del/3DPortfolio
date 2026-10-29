"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./StoryExperience.module.css";

const CHAPTER_MS = 6500;
const chapters = [
  { label: "The spark", line: "Every world begins\nwith a question.", note: "What if the ordinary could feel extraordinary?", visual: "spark" },
  { label: "The structure", line: "Give the idea\na system.", note: "Thoughtful architecture makes the impossible feel effortless.", visual: "structure" },
  { label: "The feeling", line: "Make every\ndetail matter.", note: "Motion, interaction, and care turn a product into an experience.", visual: "feeling" },
  { label: "The release", line: "Build it.\nLet it live.", note: "From first sketch to something real in someone’s hands.", visual: "release" },
] as const;

export default function StoryExperience() {
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const elapsed = useRef(0);
  const active = chapters[chapter];

  const goTo = useCallback((index: number) => {
    setChapter(Math.max(0, Math.min(chapters.length - 1, index)));
    elapsed.current = 0;
    setProgress(0);
    setPlaying(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (document.hidden) { last = now; return; }
      elapsed.current += now - last;
      last = now;
      if (elapsed.current >= CHAPTER_MS) {
        if (chapter === chapters.length - 1) {
          elapsed.current = CHAPTER_MS;
          setProgress(1);
          setPlaying(false);
        } else {
          elapsed.current = 0;
          setProgress(0);
          setChapter(chapter + 1);
        }
      } else setProgress(elapsed.current / CHAPTER_MS);
    }, 50);
    return () => window.clearInterval(timer);
  }, [chapter, playing]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goTo(chapter + 1);
      if (event.key === "ArrowLeft") goTo(chapter - 1);
      if (event.code === "Space" && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        setPlaying((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [chapter, goTo]);

  return (
    <main className={styles.page} data-scene={active.visual}>
      <div className={styles.grain} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>SHIJIL<span>.DEV</span></Link>
        <span className={styles.headerCenter}>AN EXPERIMENT IN MOTION</span>
        <nav aria-label="Story navigation"><Link href="/projects">Projects ↗</Link><Link href="/">Island ↗</Link></nav>
      </header>

      <div className={styles.scene} key={active.visual} aria-hidden="true">
        <div className={styles.grid} />
        <div className={styles.halo} />
        <div className={styles.core} />
        <div className={styles.orbitOne} />
        <div className={styles.orbitTwo} />
        <div className={styles.signal} />
        <div className={styles.signalTwo} />
        <div className={styles.axis} />
        <div className={styles.axisTwo} />
        <div className={styles.satellite} />
        <div className={styles.satelliteTwo} />
        <span className={styles.diagramLabel}>FIG. 0{chapter + 1} / {active.label.toUpperCase()}</span>
      </div>

      <section className={styles.copy} key={chapter} aria-live="polite">
        <p className={styles.kicker}><span>0{chapter + 1} / 04</span> &nbsp; {active.label}</p>
        <h1>{active.line.split("\n").map((part, index) => <span key={part} className={index ? styles.secondLine : undefined}>{part}<br /></span>)}</h1>
        <p className={styles.note}>{active.note}</p>
        {chapter === chapters.length - 1 && !playing && <Link className={styles.endLink} href="/projects">See what I&apos;ve made <span>↗</span></Link>}
      </section>

      <footer className={styles.footer}>
        <div className={styles.chapterNav} aria-label="Story chapters">
          {chapters.map((item, index) => (
            <button key={item.label} type="button" className={index === chapter ? styles.chapterActive : ""} onClick={() => goTo(index)} aria-label={`Play chapter ${index + 1}: ${item.label}`} aria-current={index === chapter ? "step" : undefined}>
              <span className={styles.chapterNumber}>0{index + 1} <span>{item.label}</span></span>
              <span className={styles.track}><span style={{ transform: `scaleX(${index < chapter ? 1 : index === chapter ? progress : 0})` }} /></span>
            </button>
          ))}
        </div>
        <div className={styles.controls}>
          <button type="button" onClick={() => chapter === chapters.length - 1 && !playing ? goTo(0) : setPlaying((value) => !value)} aria-label={chapter === chapters.length - 1 && !playing ? "Replay story" : playing ? "Pause story" : "Play story"}>
            {chapter === chapters.length - 1 && !playing ? "↺ Replay" : playing ? "Ⅱ Pause" : "▶ Play"}
          </button>
          <span>AUTO STORY / {Math.round(CHAPTER_MS * chapters.length / 1000)} SEC</span>
        </div>
      </footer>
    </main>
  );
}
