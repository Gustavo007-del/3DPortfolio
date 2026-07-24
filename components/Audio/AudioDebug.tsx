// components/Audio/AudioDebug.tsx

"use client";

import { useEffect, useRef } from "react";
import { useControls, button, folder } from "leva";
import { useAudioContext } from "./AudioProvider";
import { BUS_NAMES, DEFAULT_FADE_MS } from "./audioDefaults";
import { BusName } from "./audioTypes";

export default function AudioDebug() {
  const { busVolumes, setBusVolume, mute, unmute, isMuted, pause, resume } = useAudioContext();
  const fadeMsRef = useRef(DEFAULT_FADE_MS);

  const [, setBusControls] = useControls("Audio Debug", () => ({
    fadeTime: { value: DEFAULT_FADE_MS, min: 0, max: 3000, step: 50, onChange: (v: number) => { fadeMsRef.current = v; } },
    showZones: { value: false },
    showRadius: { value: false },
    debugAudio: { value: false },
    Buses: folder({
      masterVolume: { value: busVolumes.Master ?? 1, min: 0, max: 1, step: 0.01, onChange: (v: number) => setBusVolume("Master", v) },
      ambientVolume: { value: busVolumes.Ambient ?? 0.8, min: 0, max: 1, step: 0.01, onChange: (v: number) => setBusVolume("Ambient", v) },
      environmentVolume: { value: busVolumes.Environment ?? 0.9, min: 0, max: 1, step: 0.01, onChange: (v: number) => setBusVolume("Environment", v) },
      effectsVolume: { value: busVolumes.Effects ?? 1, min: 0, max: 1, step: 0.01, onChange: (v: number) => setBusVolume("Effects", v) },
      musicVolume: { value: busVolumes.Music ?? 0.7, min: 0, max: 1, step: 0.01, onChange: (v: number) => setBusVolume("Music", v) },
      voiceVolume: { value: busVolumes.Voice ?? 1, min: 0, max: 1, step: 0.01, onChange: (v: number) => setBusVolume("Voice", v) },
      uiVolume: { value: busVolumes.UI ?? 0.6, min: 0, max: 1, step: 0.01, onChange: (v: number) => setBusVolume("UI", v) },
    }),
    Transport: folder({
      pauseAll: button(() => pause()),
      resumeAll: button(() => resume()),
      muteAll: button(() => (isMuted ? unmute() : mute())),
    }),
  }), [busVolumes, isMuted]);

  useEffect(() => {}, []);

  return null;
}