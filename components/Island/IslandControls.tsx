"use client";

import { useEffect, useRef, useState } from "react";
import { useRide } from "./boat-ride/boatRideStore";
import { resetIslandSettings, updateIslandSettings, useIslandSettings, type IslandSettings, type TimeOfDay } from "./islandSettings";
import styles from "./IslandControls.module.css";

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return <div className={styles.row}>
    <div><strong>{label}</strong><span>{description}</span></div>
    <button type="button" className={`${styles.switch} ${checked ? styles.on : ""}`} role="switch" aria-label={label} aria-checked={checked} onClick={onChange}><span /></button>
  </div>;
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return <label className={styles.slider}>
    <span><strong>{label}</strong><em>{Math.round(value * 100)}%</em></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  </label>;
}

export default function IslandControls() {
  const settings = useIslandSettings();
  const ride = useRide();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const onPointer = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onPointer); };
  }, [open]);
  if (ride.phase !== "idle") return null;

  const toggle = (key: "fog" | "birds" | "mist" | "particles") => updateIslandSettings({ [key]: !settings[key] } as Partial<IslandSettings>);
  return <div className={styles.root} ref={rootRef}>
    <button type="button" className={styles.trigger} aria-expanded={open} aria-controls="island-controls-panel" onClick={() => setOpen((value) => !value)}>
      <span className={styles.triggerMark}>✦</span> Island controls <span aria-hidden="true">{open ? "×" : "⌄"}</span>
    </button>
    {open && <section id="island-controls-panel" className={styles.panel} aria-label="Island scene controls" data-lenis-prevent>
      <div className={styles.heading}><div><span>THE ISLAND / ENVIRONMENT</span><h2>Set the mood.</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close controls">×</button></div>
      <p className={styles.intro}>Shape the atmosphere while you explore.</p>

      <div className={styles.groupLabel}>Light & sky <span>01</span></div>
      <div className={styles.times} role="group" aria-label="Time of day">
        {(["day", "dusk", "night"] as TimeOfDay[]).map((time) => <button key={time} type="button" className={settings.timeOfDay === time ? styles.selected : ""} aria-pressed={settings.timeOfDay === time} onClick={() => updateIslandSettings({ timeOfDay: time })}>{time === "day" ? "☀" : time === "dusk" ? "◐" : "☾"}<span>{time}</span></button>)}
      </div>
      <Slider label="Brightness" value={settings.brightness} min={0.5} max={1.5} step={0.05} onChange={(brightness) => updateIslandSettings({ brightness })} />

      <div className={styles.groupLabel}>Atmosphere <span>02</span></div>
      <Toggle label="Distance fog" description="Haze across the horizon" checked={settings.fog} onChange={() => toggle("fog")} />
      {settings.fog && <Slider label="Fog density" value={settings.fogStrength} min={0.4} max={2} step={0.05} onChange={(fogStrength) => updateIslandSettings({ fogStrength })} />}
      <Toggle label="Ground mist" description="Low drifting layers" checked={settings.mist} onChange={() => toggle("mist")} />

      <div className={styles.groupLabel}>Living world <span>03</span></div>
      <Toggle label="Birds" description="Flocks around the island" checked={settings.birds} onChange={() => toggle("birds")} />
      {settings.birds && <Slider label="Bird activity" value={settings.birdActivity} min={0.25} max={1.5} step={0.05} onChange={(birdActivity) => updateIslandSettings({ birdActivity })} />}
      <Toggle label="Atmospheric particles" description="Details in the air" checked={settings.particles} onChange={() => toggle("particles")} />

      <button type="button" className={styles.reset} onClick={resetIslandSettings}>↺ Reset the island</button>
    </section>}
  </div>;
}
