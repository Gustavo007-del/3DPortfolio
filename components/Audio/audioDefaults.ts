// components/Audio/audioDefaults.ts

import { BusName, PositionalConfig, SoundDefinition } from "./audioTypes";

export const DEFAULT_FADE_MS = 500;

export const DEFAULT_POSITIONAL: PositionalConfig = {
  refDistance: 8, maxDistance: 80, rolloffFactor: 1.6,
  coneInnerAngle: 360, coneOuterAngle: 360, coneOuterGain: 0
};

export const DEFAULT_BUS_VOLUMES: Record<BusName, number> = {
  Master: 1, Ambient: 0.8, Environment: 0.9, Effects: 1, Music: 0.7, Voice: 1, UI: 0.6
};

export const SOUND_MANIFEST: SoundDefinition[] = [
  { id: "wind", bus: "Ambient", src: ["/audio/ambient/wind.ogg", "/audio/wind.mp3"], loop: true, baseVolume: 0.5, preload: true },
  { id: "birds", bus: "Ambient", src: ["/audio/ambient/birds.ogg", "/audio/birds.mp3"], loop: true, baseVolume: 0.4, preload: true },
  { id: "insects", bus: "Ambient", src: ["/audio/ambient/insects.ogg", "/audio/insects.mp3"], loop: true, baseVolume: 0.35, preload: true },
  { id: "fire", bus: "Environment", src: ["/audio/env/fire.ogg", "/audio/fire.mp3"], loop: true, baseVolume: 0.6, positional: { refDistance: 4, maxDistance: 30, rolloffFactor: 2 } },
  { id: "bell", bus: "Environment", src: ["/audio/env/bell.ogg", "/audio/bell.mp3"], loop: false, baseVolume: 0.8, positional: { refDistance: 10, maxDistance: 100, rolloffFactor: 1 } },
//   { id: "castle", bus: "Environment", src: ["/audio/env/castle.ogg", "/audio/castle.mp3"], loop: true, baseVolume: 0.45, positional: { refDistance: 8, maxDistance: 70, rolloffFactor: 1.4 } },
//   { id: "dock", bus: "Environment", src: ["/audio/env/dock.ogg", "/audio/dock.mp3"], loop: true, baseVolume: 0.4, positional: { refDistance: 6, maxDistance: 50, rolloffFactor: 1.5 } },
//   { id: "bridge", bus: "Environment", src: ["/audio/env/bridge.ogg", "/audio/bridge.mp3"], loop: true, baseVolume: 0.4, positional: { refDistance: 6, maxDistance: 45, rolloffFactor: 1.5 } },
  { id: "ui-hover", bus: "UI", src: ["/audio/ui/hover.ogg", "/audio/hover.mp3"], loop: false, baseVolume: 0.5 },
  { id: "ui-click", bus: "UI", src: ["/audio/ui/click.ogg", "/audio/click.mp3"], loop: false, baseVolume: 0.6 },
  { id: "theme", bus: "Music", src: ["/audio/music/theme.ogg", "/audio/sea2.mp3"], loop: true, baseVolume: 0.3, preload: true }
];

export const GLOBAL_AMBIENCE_IDS = ["theme"];

export const BUS_NAMES: BusName[] = ["Master", "Ambient", "Environment", "Effects", "Music", "Voice", "UI"];