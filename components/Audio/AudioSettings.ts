// components/Audio/AudioSettings.ts

import { AudioSettingsData } from "./audioTypes";
import { DEFAULT_SETTINGS, STORAGE_KEY } from "./audioDefaults";

/**
 * Handles persistence of audio settings to localStorage.
 * Provides load/save operations with automatic fallback to defaults.
 */
export class AudioSettings {
  private key: string;

  constructor(key: string = STORAGE_KEY) {
    this.key = key;
  }

  /** Load settings from localStorage, or return null if not found or invalid */
  load(): AudioSettingsData | null {
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) return null;
      const data = JSON.parse(stored) as AudioSettingsData;
      // Validate structure (basic)
      if (typeof data.muted !== "boolean" || typeof data.masterVolume !== "number" || !data.busVolumes) {
        return null;
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  /** Load settings or return defaults if not found */
  loadOrDefault(): AudioSettingsData {
    const loaded = this.load();
    return loaded ? loaded : { ...DEFAULT_SETTINGS };
  }

  /** Save settings to localStorage */
  save(data: AudioSettingsData): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch (_) {
      // ignore (e.g., quota exceeded)
    }
  }

  /** Reset to default settings and save */
  reset(): AudioSettingsData {
    const defaults = { ...DEFAULT_SETTINGS };
    this.save(defaults);
    return defaults;
  }

  /** Clear stored settings from localStorage */
  clear(): void {
    try {
      localStorage.removeItem(this.key);
    } catch (_) { /* ignore */ }
  }
}