// components/Audio/audioDefaults.ts

import { AudioSettingsData, BusName } from "./audioTypes";

/** Default master volume (0-1) */
export const DEFAULT_MASTER_VOLUME = 0.85;

/** Default fade in/out time in seconds */
export const DEFAULT_FADE_TIME = 0.5;

/** Default reference distance for positional audio */
export const DEFAULT_REF_DISTANCE = 1;

/** Default max distance for positional audio */
export const DEFAULT_MAX_DISTANCE = 50;

/** Default rolloff factor for positional audio */
export const DEFAULT_ROLLOFF = 1;

/** Default cone inner angle (degrees) */
export const DEFAULT_CONE_INNER_ANGLE = 360;

/** Default cone outer angle (degrees) */
export const DEFAULT_CONE_OUTER_ANGLE = 360;

/** Default cone outer gain */
export const DEFAULT_CONE_OUTER_GAIN = 0;

/** Default volumes per bus (0-1) */
export const DEFAULT_BUS_VOLUMES: Record<BusName, number> = {
  Master: 1,
  Ambient: 0.8,
  Environment: 0.9,
  Effects: 0.9,
  Music: 0.7,
  Voice: 1,
  UI: 0.8,
};

/** Default settings data for localStorage */
export const DEFAULT_SETTINGS: AudioSettingsData = {
  muted: false,
  masterVolume: DEFAULT_MASTER_VOLUME,
  busVolumes: { ...DEFAULT_BUS_VOLUMES },
};

/** Storage key for localStorage */
export const STORAGE_KEY = "audioSettings";

/** Audio file extension priority (prefer ogg, fallback mp3) */
export const AUDIO_EXTENSIONS = [".ogg", ".mp3"];

/** Audio file base path */
export const AUDIO_BASE_PATH = "/audio/";