// components/Audio/audioTypes.ts

import * as THREE from "three";

export type BusName =
  | "Master"
  | "Ambient"
  | "Environment"
  | "Effects"
  | "Music"
  | "Voice"
  | "UI";

export type SoundId = string;
export type Position = [number, number, number];

export interface PlayOptions {
  bus?: BusName;
  loop?: boolean;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  rate?: number;
  offset?: number;
  position?: Position;
  refDistance?: number;
  maxDistance?: number;
  rolloff?: number;
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
}

export interface AudioHandle {
  stop: (fadeOut?: number) => void;
  pause: () => void;
  resume: () => void;
  isPlaying: boolean;
  source: AudioBufferSourceNode | THREE.PositionalAudio | null;
  gain: GainNode | null;
}

export interface ZoneConfig {
  sound: SoundId;
  position: Position;
  radius: number;
  bus?: BusName;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
  id?: string;
}

export interface AudioSettingsData {
  muted: boolean;
  masterVolume: number;
  busVolumes: Record<BusName, number>;
}

export interface AudioContextType {
  play: (soundId: SoundId, options?: PlayOptions) => AudioHandle | null;
  load: (soundId: SoundId) => Promise<AudioBuffer>; // <-- NEW
  stopAll: (bus?: BusName) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  setMasterVolume: (volume: number) => void;
  setBusVolume: (bus: BusName, volume: number) => void;
  mute: (muted?: boolean) => void;
  toggleMute: () => void;
  isMuted: boolean;
  masterVolume: number;
  busVolumes: Record<BusName, number>;
  fadeMaster: (target: number, duration: number) => void;
  fadeBus: (bus: BusName, target: number, duration: number) => void;
  isReady: boolean;
}