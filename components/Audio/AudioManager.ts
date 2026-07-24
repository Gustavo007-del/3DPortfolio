// components/Audio/AudioManager.ts

import { ActiveSound, BusName, PlayOptions, PositionalConfig, SoundDefinition } from "./audioTypes";
import { DEFAULT_FADE_MS, DEFAULT_POSITIONAL, SOUND_MANIFEST } from "./audioDefaults";
import { AudioMixer } from "./AudioMixer";
import * as THREE from "three";

export class AudioManager {
  private ctx: AudioContext;
  private mixer: AudioMixer;
  private buffers: Map<string, Promise<AudioBuffer>> = new Map();
  private active: Map<string, ActiveSound> = new Map();
  private byId: Map<string, Set<string>> = new Map();
  private manifest: Map<string, SoundDefinition> = new Map(SOUND_MANIFEST.map(s => [s.id, s]));
  private listenerAttached = false;

  constructor(ctx: AudioContext, mixer: AudioMixer) { this.ctx = ctx; this.mixer = mixer; }

  attachListener(camera: THREE.Camera) { /* no-op placeholder, positional updates driven by AudioZone via panner.positionX etc */ }

  private async fetchAndDecode(src: string[]): Promise<AudioBuffer> {
    let lastErr: unknown = null;
    for (const url of src) {
      try { const res = await fetch(url); const arr = await res.arrayBuffer(); return await this.ctx.decodeAudioData(arr); }
      catch (e) { lastErr = e; }
    }
    throw lastErr ?? new Error("failed to load audio");
  }

  load(id: string): Promise<AudioBuffer> {
    const def = this.manifest.get(id);
    if (!def) return Promise.reject(new Error(`unknown sound id: ${id}`));
    const cached = this.buffers.get(id);
    if (cached) return cached;
    const p = this.fetchAndDecode(def.src);
    this.buffers.set(id, p);
    return p;
  }

  preload(ids: string[]) { return Promise.all(ids.map(id => this.load(id).catch(() => null))); }

  async play(id: string, opts: PlayOptions = {}): Promise<string | null> {
    const def = this.manifest.get(id);
    if (!def) return null;
    if (opts.restartIfPlaying === false && this.byId.get(id)?.size) return null;

    let buffer: AudioBuffer;
    try { buffer = await this.load(id); } catch { return null; }

    const bus: BusName = opts.bus ?? def.bus;
    const loop = opts.loop ?? def.loop;
    const fadeMs = opts.fadeMs ?? DEFAULT_FADE_MS;
    const targetVolume = opts.volume ?? def.baseVolume;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;

    let panner: PannerNode | null = null;
    let node: AudioNode = gain;

    if (opts.position) {
      const cfg: PositionalConfig = { ...DEFAULT_POSITIONAL, ...def.positional, ...opts.positional };
      panner = this.ctx.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = cfg.refDistance;
      panner.maxDistance = cfg.maxDistance;
      panner.rolloffFactor = cfg.rolloffFactor;
      panner.coneInnerAngle = cfg.coneInnerAngle;
      panner.coneOuterAngle = cfg.coneOuterAngle;
      panner.coneOuterGain = cfg.coneOuterGain;
      panner.positionX.value = opts.position[0];
      panner.positionY.value = opts.position[1];
      panner.positionZ.value = opts.position[2];
      source.connect(gain);
      gain.connect(panner);
      node = panner;
    } else {
      source.connect(gain);
    }

    node.connect(this.mixer.getBusInput(bus));

    const instanceId = `${id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(Math.max(0.0001, targetVolume), now + fadeMs / 1000);

    source.onended = () => { this.cleanupInstance(instanceId); };
    source.start(0);

    const record: ActiveSound = { id, instanceId, source, gain, panner, bus, loop, startedAt: now };
    this.active.set(instanceId, record);
    if (!this.byId.has(id)) this.byId.set(id, new Set());
    this.byId.get(id)!.add(instanceId);

    return instanceId;
  }

  private cleanupInstance(instanceId: string) {
    const rec = this.active.get(instanceId);
    if (!rec) return;
    try { rec.source.disconnect(); rec.gain.disconnect(); rec.panner?.disconnect(); } catch {}
    this.active.delete(instanceId);
    this.byId.get(rec.id)?.delete(instanceId);
  }

  stopInstance(instanceId: string, fadeMs = DEFAULT_FADE_MS) {
    const rec = this.active.get(instanceId);
    if (!rec) return;
    const now = this.ctx.currentTime;
    rec.gain.gain.cancelScheduledValues(now);
    rec.gain.gain.setValueAtTime(rec.gain.gain.value, now);
    rec.gain.gain.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
    window.setTimeout(() => { try { rec.source.stop(); } catch {} this.cleanupInstance(instanceId); }, fadeMs + 30);
  }

  stop(id: string, fadeMs = DEFAULT_FADE_MS) {
    const set = this.byId.get(id);
    if (!set) return;
    for (const instanceId of Array.from(set)) this.stopInstance(instanceId, fadeMs);
  }

  crossFade(fromId: string, toId: string, opts: PlayOptions = {}, fadeMs = DEFAULT_FADE_MS) {
    this.stop(fromId, fadeMs);
    return this.play(toId, { ...opts, fadeMs });
  }

  updateInstancePosition(instanceId: string, position: [number, number, number]) {
    const rec = this.active.get(instanceId);
    if (!rec?.panner) return;
    rec.panner.positionX.value = position[0];
    rec.panner.positionY.value = position[1];
    rec.panner.positionZ.value = position[2];
  }

  isPlaying(id: string): boolean { return (this.byId.get(id)?.size ?? 0) > 0; }

  pauseAll() { void this.ctx.suspend(); }
  resumeAll() { void this.ctx.resume(); }

  dispose() {
    for (const instanceId of Array.from(this.active.keys())) this.stopInstance(instanceId, 0);
    this.buffers.clear();
  }
}