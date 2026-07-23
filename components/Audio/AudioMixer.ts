// components/Audio/AudioMixer.ts

import { BusName } from "./audioTypes";
import { DEFAULT_FADE_TIME } from "./audioDefaults";

/**
 * Professional audio mixer with per-bus gain staging.
 * Routes all sources through bus gains then master gain to destination.
 * Supports volume, mute, and smooth fades for each bus and master.
 */
export class AudioMixer {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private busGains: Map<BusName, GainNode>;
  private busVolumes: Map<BusName, number>;
  private masterVolume: number;
  private isMuted: boolean;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(ctx.destination);

    this.busGains = new Map();
    this.busVolumes = new Map();
    this.isMuted = false;
    this.masterVolume = 1;

    // Create bus gains for all known buses
    const busNames: BusName[] = ["Master", "Ambient", "Environment", "Effects", "Music", "Voice", "UI"];
    for (const name of busNames) {
      const gain = ctx.createGain();
      gain.gain.value = 1;
      gain.connect(this.masterGain);
      this.busGains.set(name, gain);
      this.busVolumes.set(name, 1);
    }
  }

  /** Connect a source node to the specified bus gain */
  connectSource(source: AudioNode, bus: BusName): void {
    const gain = this.busGains.get(bus);
    if (!gain) throw new Error(`Unknown bus: ${bus}`);
    source.connect(gain);
  }

  /** Get the gain node for a bus (for direct connection) */
  getBusGain(bus: BusName): GainNode {
    const gain = this.busGains.get(bus);
    if (!gain) throw new Error(`Unknown bus: ${bus}`);
    return gain;
  }

  /** Get the master gain node */
  getMasterGain(): GainNode {
    return this.masterGain;
  }

  /** Set a bus volume (0-1) with immediate effect */
  setBusVolume(bus: BusName, volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.busVolumes.set(bus, clamped);
    const gain = this.busGains.get(bus);
    if (gain) gain.gain.value = this.isMuted ? 0 : clamped;
  }

  /** Set master volume (0-1) with immediate effect */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
  }

  /** Mute or unmute all audio */
  mute(muted: boolean): void {
    this.isMuted = muted;
    const target = muted ? 0 : this.masterVolume;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.01);
    // Also mute bus gains to avoid signal buildup? Master handles it, but we keep bus gains at their volumes.
  }

  /** Toggle mute state */
  toggleMute(): void {
    this.mute(!this.isMuted);
  }

  /** Get mute state */
  get muted(): boolean {
    return this.isMuted;
  }

  /** Get current master volume */
  get masterVol(): number {
    return this.masterVolume;
  }

  /** Get current bus volume (0-1) */
  getBusVolume(bus: BusName): number {
    return this.busVolumes.get(bus) ?? 1;
  }

  /** Fade master volume to target over duration (seconds) */
  fadeMaster(target: number, duration: number = DEFAULT_FADE_TIME): void {
    const clamped = Math.max(0, Math.min(1, target));
    this.masterVolume = clamped; // store target
    if (!this.isMuted) {
      this.masterGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + duration);
    }
  }

  /** Fade a bus volume to target over duration (seconds) */
  fadeBus(bus: BusName, target: number, duration: number = DEFAULT_FADE_TIME): void {
    const clamped = Math.max(0, Math.min(1, target));
    this.busVolumes.set(bus, clamped);
    const gain = this.busGains.get(bus);
    if (gain && !this.isMuted) {
      gain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + duration);
    } else if (gain) {
      gain.gain.value = 0; // muted
    }
  }

  /**
   * Duck a bus: temporarily reduce its volume by a factor (0-1) over duration,
   * then restore after a hold time. Useful for voice-over.
   * @param bus Bus to duck
   * @param amount Factor to reduce (0 = silence, 0.5 = half volume)
   * @param fadeIn Duration to fade down
   * @param hold Duration to hold ducked level before restoring
   * @param fadeOut Duration to fade back up
   */
  duck(bus: BusName, amount: number, fadeIn: number = 0.3, hold: number = 1.0, fadeOut: number = 0.3): void {
    const gain = this.busGains.get(bus);
    if (!gain) return;
    const current = this.busVolumes.get(bus) ?? 1;
    const target = current * (1 - Math.max(0, Math.min(1, amount)));
    const now = this.ctx.currentTime;
    gain.gain.linearRampToValueAtTime(target, now + fadeIn);
    gain.gain.linearRampToValueAtTime(target, now + fadeIn + hold);
    gain.gain.linearRampToValueAtTime(current, now + fadeIn + hold + fadeOut);
  }

  /** Dispose all gain nodes and disconnect */
  dispose(): void {
    this.masterGain.disconnect();
    for (const gain of this.busGains.values()) {
      gain.disconnect();
    }
    this.busGains.clear();
    this.busVolumes.clear();
  }
}