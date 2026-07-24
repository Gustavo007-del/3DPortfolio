// components/Audio/audioTypes.ts

export type BusName = "Master" | "Ambient" | "Environment" | "Effects" | "Music" | "Voice" | "UI";

export type FadeCurve = "linear" | "exponential";

export interface PositionalConfig {
  refDistance: number;
  maxDistance: number;
  rolloffFactor: number;
  coneInnerAngle: number;
  coneOuterAngle: number;
  coneOuterGain: number;
}

export interface SoundDefinition {
  id: string;
  bus: BusName;
  src: string[];
  loop: boolean;
  baseVolume: number;
  positional?: Partial<PositionalConfig>;
  preload?: boolean;
}

export interface PlayOptions {
  bus?: BusName;
  loop?: boolean;
  volume?: number;
  fadeMs?: number;
  position?: [number, number, number];
  positional?: Partial<PositionalConfig>;
  restartIfPlaying?: boolean;
}

export interface ActiveSound {
  id: string;
  instanceId: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner: PannerNode | null;
  bus: BusName;
  loop: boolean;
  startedAt: number;
}

export interface BusState {
  name: BusName;
  volume: number;
  muted: boolean;
}

export type BusGraph = Record<BusName, { input: GainNode; gain: GainNode }>;

export interface AudioSettingsShape {
  masterVolume: number;
  muted: boolean;
  busVolumes: Record<BusName, number>;
}

export interface AudioZoneProps {
  position: [number, number, number];
  radius: number;
  sound: string;
  bus?: BusName;
  fadeMs?: number;
  innerVolume?: number;
  falloff?: number;
}

export interface AudioContextValue {
  play: (id: string, opts?: PlayOptions) => string | null;
  stop: (id: string, fadeMs?: number) => void;
  stopInstance: (instanceId: string, fadeMs?: number) => void;
  pause: () => void;
  resume: () => void;
  fade: (busOrId: string, target: number, durationMs?: number) => void;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  setVolume: (value: number) => void;
  setBusVolume: (bus: BusName, value: number, fadeMs?: number) => void;
  isMuted: boolean;
  masterVolume: number;
  busVolumes: Record<BusName, number>;
  ready: boolean;
  unlock: () => Promise<void>;
}

export interface AudioDebugState {
  showZones: boolean;
  showRadius: boolean;
  debugAudio: boolean;
}