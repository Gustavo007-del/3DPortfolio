// components/Audio/AudioSettings.ts

import { AudioSettingsShape, BusName } from "./audioTypes";
import { BUS_NAMES, DEFAULT_BUS_VOLUMES } from "./audioDefaults";

const STORAGE_KEY = "audio-settings-v1";

export function defaultAudioSettings(): AudioSettingsShape {
  return { masterVolume: 1, muted: false, busVolumes: { ...DEFAULT_BUS_VOLUMES } };
}

export function loadAudioSettings(): AudioSettingsShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.masterVolume !== "number" || typeof parsed.muted !== "boolean" || typeof parsed.busVolumes !== "object") return null;
    const busVolumes = { ...DEFAULT_BUS_VOLUMES };
    for (const name of BUS_NAMES) if (typeof parsed.busVolumes[name] === "number") busVolumes[name as BusName] = parsed.busVolumes[name];
    return { masterVolume: parsed.masterVolume, muted: parsed.muted, busVolumes };
  } catch { return null; }
}

export function saveAudioSettings(partial: Partial<AudioSettingsShape>) {
  if (typeof window === "undefined") return;
  try {
    const current = loadAudioSettings() ?? defaultAudioSettings();
    const next: AudioSettingsShape = {
      masterVolume: partial.masterVolume ?? current.masterVolume,
      muted: partial.muted ?? current.muted,
      busVolumes: partial.busVolumes ? { ...current.busVolumes, ...partial.busVolumes } : current.busVolumes
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function clearAudioSettings() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
}