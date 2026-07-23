// components/Audio/AudioDebug.tsx

"use client";

import { useEffect, useRef } from "react";
import { useControls, button } from "leva";
import { useAudio } from "./AudioProvider";
import { BusName } from "./audioTypes";

/**
 * Debug panel for the audio system using Leva.
 * Exposes volume controls, mute, pause/resume, and debug visualization flags.
 *
 * This component should be placed inside the page alongside the Canvas.
 * It automatically registers with Leva and does not render any DOM elements.
 */
export default function AudioDebug() {
  const audio = useAudio();
  const debugRef = useRef({
    showZones: false,
    showRadius: false,
    debugAudio: false,
  });

  // Expose debug state to window for AudioZone components to read
  useEffect(() => {
    (window as any).__audioDebug = debugRef.current;
    return () => {
      delete (window as any).__audioDebug;
    };
  }, []);

  useControls("Audio Debug", {
    masterVolume: {
      value: audio.masterVolume,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Master",
      onChange: (v) => audio.setMasterVolume(v),
    },
    ambientVolume: {
      value: audio.busVolumes.Ambient,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Ambient",
      onChange: (v) => audio.setBusVolume("Ambient", v),
    },
    environmentVolume: {
      value: audio.busVolumes.Environment,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Environment",
      onChange: (v) => audio.setBusVolume("Environment", v),
    },
    effectsVolume: {
      value: audio.busVolumes.Effects,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Effects",
      onChange: (v) => audio.setBusVolume("Effects", v),
    },
    musicVolume: {
      value: audio.busVolumes.Music,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Music",
      onChange: (v) => audio.setBusVolume("Music", v),
    },
    voiceVolume: {
      value: audio.busVolumes.Voice,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Voice",
      onChange: (v) => audio.setBusVolume("Voice", v),
    },
    uiVolume: {
      value: audio.busVolumes.UI,
      min: 0,
      max: 1,
      step: 0.01,
      label: "UI",
      onChange: (v) => audio.setBusVolume("UI", v),
    },
    showZones: {
      value: false,
      label: "Show Zones",
      onChange: (v) => {
        debugRef.current.showZones = v;
        if (debugRef.current.debugAudio) {
          console.log("[AudioDebug] showZones:", v);
        }
      },
    },
    showRadius: {
      value: false,
      label: "Show Radius",
      onChange: (v) => {
        debugRef.current.showRadius = v;
        if (debugRef.current.debugAudio) {
          console.log("[AudioDebug] showRadius:", v);
        }
      },
    },
    debugAudio: {
      value: false,
      label: "Debug Logging",
      onChange: (v) => {
        debugRef.current.debugAudio = v;
        if (v) console.log("[AudioDebug] Debug logging enabled");
      },
    },
    "--- Controls ---": {
      value: "",
      label: " ",
    },
    pauseAll: button(() => {
      audio.pauseAll();
      console.log("[AudioDebug] Paused all audio");
    }),
    resumeAll: button(() => {
      audio.resumeAll();
      console.log("[AudioDebug] Resumed all audio");
    }),
    muteAll: button(() => {
      audio.mute(!audio.isMuted);
      console.log("[AudioDebug] Mute toggled:", !audio.isMuted);
    }),
  });

  // Log audio state changes if debug logging is enabled
  useEffect(() => {
    if (!debugRef.current.debugAudio) return;
    console.log("[AudioDebug] Audio state:", {
      isMuted: audio.isMuted,
      masterVolume: audio.masterVolume,
      busVolumes: audio.busVolumes,
      isReady: audio.isReady,
    });
  }, [
    audio.isMuted,
    audio.masterVolume,
    audio.busVolumes,
    audio.isReady,
    debugRef.current.debugAudio,
  ]);

  return null;
}