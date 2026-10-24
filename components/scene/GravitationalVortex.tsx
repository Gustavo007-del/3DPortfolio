"use client";
import React, { useEffect, useRef } from "react";
import { startVortex } from "./vortexRenderer";
import type { VortexState } from "./vortexRenderer";

interface GravitationalVortexProps {
  progress?: number;
  background?: string;
  baseColor?: string;
  accentColor?: string;
  density?: number;
  dotSize?: number;
  speed?: number;
  direction?: "inward" | "outward";
  scale?: number;
  tiltX?: number;
  tiltY?: number;
  twist?: number;
  funnel?: number;
  style?: React.CSSProperties;
}

export default function GravitationalVortex({
  progress = 0,
  background = "transparent",
  baseColor = "#8fe0ff",
  accentColor = "#ffaa44",
  density = 18,
  dotSize = 300,
  speed = 28,
  direction = "inward",
  scale = 100,
  tiltX = 55,
  tiltY = 0,
  twist = 32,
  funnel = 55,
  style,
}: GravitationalVortexProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const stateRef = useRef<VortexState>({ width: 1, height: 1, dpr: 1, progress: 0, hidden: false });
  stateRef.current.progress = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    workerRef.current?.postMessage({ type: "state", state: { progress: stateRef.current.progress } });
  }, [progress]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const options = { baseColor, accentColor, density, dotSize, speed, direction, scale, tiltX, tiltY, twist, funnel };
    let canvas: HTMLCanvasElement;
    let stop: (() => void) | undefined;
    let disposed = false;
    // Transfers are one-way. A fresh canvas makes Strict Mode and remounts safe.
    const createCanvas = () => {
      const element = document.createElement("canvas");
      element.setAttribute("aria-hidden", "true");
      element.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
      host.appendChild(element);
      return element;
    };
    const syncState = () => {
      Object.assign(stateRef.current, {
        width: host.clientWidth, height: host.clientHeight,
        dpr: window.devicePixelRatio || 1, hidden: document.hidden,
      });
      workerRef.current?.postMessage({ type: "state", state: stateRef.current });
    };
    syncState();
    canvas = createCanvas();
    const fallback = () => {
      if (disposed) return;
      workerRef.current?.terminate();
      workerRef.current = null;
      stop?.();
      canvas.remove();
      canvas = createCanvas();
      host.dataset.renderer = "main-thread";
      try {
        stop = startVortex(canvas, options, stateRef.current,
          requestAnimationFrame.bind(window), cancelAnimationFrame.bind(window));
      } catch (error) { console.warn("Vortex renderer unavailable", error); }
    };
    if (typeof Worker !== "undefined" && "transferControlToOffscreen" in canvas) {
      try {
        const worker = new Worker(new URL("./vortex.worker.ts", import.meta.url), { type: "module" });
        workerRef.current = worker;
        worker.onmessage = (event) => {
          if (event.data.type === "error") fallback();
          if (event.data.type === "ready") {
            host.dataset.renderer = "worker";
          }
        };
        worker.onerror = (event) => { event.preventDefault(); fallback(); };
        const offscreen = canvas.transferControlToOffscreen();
        worker.postMessage({ type: "init", canvas: offscreen, options, state: stateRef.current }, [offscreen]);
      } catch { fallback(); }
    } else { fallback(); }
    const observer = new ResizeObserver(syncState);
    observer.observe(host);
    window.addEventListener("resize", syncState);
    document.addEventListener("visibilitychange", syncState);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("resize", syncState);
      document.removeEventListener("visibilitychange", syncState);
      workerRef.current?.terminate();
      workerRef.current = null;
      stop?.();
      canvas.remove();
    };
  }, [baseColor, accentColor, density, dotSize, speed, direction, scale, tiltX, tiltY, twist, funnel]);

  return <div ref={hostRef} data-vortex aria-hidden="true" style={{
    position: "relative", width: "100%", height: "100%",
    minWidth: 0, minHeight: 0, overflow: "hidden", background, ...style,
  }} />;
}
