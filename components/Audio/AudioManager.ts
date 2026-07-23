// components/Audio/AudioManager.ts

import * as THREE from "three";
import { AudioMixer } from "./AudioMixer";
import { SoundId, PlayOptions, AudioHandle, BusName } from "./audioTypes";
import { DEFAULT_FADE_TIME, DEFAULT_REF_DISTANCE, DEFAULT_MAX_DISTANCE, DEFAULT_ROLLOFF, AUDIO_BASE_PATH, AUDIO_EXTENSIONS } from "./audioDefaults";

type ActiveSound = {
  source: AudioBufferSourceNode | THREE.PositionalAudio;
  gain: GainNode;
  bus: BusName;
  isPlaying: boolean;
  isPaused: boolean;
  startTime: number;
  loop: boolean;
  fadeOutTimer?: number;
  onEnded?: () => void;
};

export class AudioManager {
  private ctx: AudioContext;
  private mixer: AudioMixer;
  private cache: Map<SoundId, AudioBuffer> = new Map();
  private active: Map<Symbol, ActiveSound> = new Map();
  private listener: THREE.AudioListener | null = null;
  private parent: THREE.Object3D | null = null;
  private idCounter = 0;

  constructor(ctx: AudioContext, mixer: AudioMixer) {
    this.ctx = ctx;
    this.mixer = mixer;
  }

  setListener(listener: THREE.AudioListener): void {
    this.listener = listener;
  }

  setParent(parent: THREE.Object3D): void {
    this.parent = parent;
  }

  private generateProceduralBuffer(soundId: SoundId): AudioBuffer {
    const sampleRate = this.ctx.sampleRate;
    const duration = 4;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    const t = (i: number) => i / sampleRate;

    switch (soundId) {
      case "ocean": {
        for (let i = 0; i < length; i++) {
          const noise = (Math.random() * 2 - 1) * 0.4;
          const rumble = Math.sin(2 * Math.PI * 0.8 * t(i)) * 0.2;
          data[i] = noise + rumble;
        }
        break;
      }
      case "wind": {
        let prev = 0;
        for (let i = 0; i < length; i++) {
          const noise = (Math.random() * 2 - 1) * 0.5;
          prev = prev * 0.95 + noise * 0.05;
          data[i] = prev * 0.5;
        }
        break;
      }
      case "birds": {
        for (let i = 0; i < length; i++) {
          const time = t(i);
          const chirp = Math.sin(2 * Math.PI * (800 + 400 * Math.sin(2 * Math.PI * 2 * time)) * time);
          const envelope = Math.exp(-time * 0.5) * 0.5 + 0.5;
          data[i] = chirp * envelope * 0.2;
        }
        break;
      }
      case "fire": {
        let prev = 0;
        for (let i = 0; i < length; i++) {
          const noise = (Math.random() > 0.9) ? (Math.random() * 2 - 1) : 0;
          prev = prev * 0.95 + noise * 0.05;
          data[i] = prev * 0.4;
        }
        break;
      }
      case "waterfall": {
        for (let i = 0; i < length; i++) {
          const noise = (Math.random() * 2 - 1) * 0.8;
          const mod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.2 * t(i));
          data[i] = noise * mod * 0.6;
        }
        break;
      }
      case "river": {
        let prev = 0;
        for (let i = 0; i < length; i++) {
          const noise = (Math.random() * 2 - 1) * 0.6;
          prev = prev * 0.9 + noise * 0.1;
          data[i] = prev * 0.5;
        }
        break;
      }
      case "castle": {
        for (let i = 0; i < length; i++) {
          const time = t(i);
          const f = 55 + 2 * Math.sin(2 * Math.PI * 0.1 * time);
          data[i] = (Math.sin(2 * Math.PI * f * time) * 0.3 + Math.sin(2 * Math.PI * f * 2 * time) * 0.1) * 0.5;
        }
        break;
      }
      case "dock": {
        for (let i = 0; i < length; i++) {
          const time = t(i);
          const creak = Math.sin(2 * Math.PI * (100 + 50 * Math.sin(2 * Math.PI * 0.3 * time)) * time);
          const env = Math.exp(-time * 0.8) * 0.3 + 0.2;
          const water = (Math.random() * 2 - 1) * 0.15;
          data[i] = creak * env + water;
        }
        break;
      }
      case "bridge": {
        let prev = 0;
        for (let i = 0; i < length; i++) {
          const noise = (Math.random() * 2 - 1) * 0.4;
          prev = prev * 0.92 + noise * 0.08;
          const rumble = Math.sin(2 * Math.PI * 2.5 * t(i)) * 0.1;
          data[i] = prev * 0.4 + rumble;
        }
        break;
      }
      case "bell": {
        for (let i = 0; i < length; i++) {
          const time = t(i);
          const f = 440 * Math.pow(2, -0.1 * time);
          data[i] = Math.sin(2 * Math.PI * f * time) * Math.exp(-time * 0.8) * 0.5;
        }
        break;
      }
      default: {
        for (let i = 0; i < length; i++) {
          data[i] = Math.sin(2 * Math.PI * 440 * t(i)) * 0.2;
        }
      }
    }
    return buffer;
  }

  async load(soundId: SoundId): Promise<AudioBuffer> {
    if (this.cache.has(soundId)) return this.cache.get(soundId)!;
    let buffer: AudioBuffer | null = null;
    for (const ext of AUDIO_EXTENSIONS) {
      try {
        const url = `${AUDIO_BASE_PATH}${soundId}${ext}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const arrayBuffer = await res.arrayBuffer();
        buffer = await this.ctx.decodeAudioData(arrayBuffer);
        break;
      } catch (_) { /* try next */ }
    }
    if (!buffer) {
      buffer = this.generateProceduralBuffer(soundId);
    }
    this.cache.set(soundId, buffer);
    return buffer;
  }

  play(soundId: SoundId, options: PlayOptions = {}): AudioHandle | null {
    if (this.ctx.state === "suspended") {
      console.warn("[AudioManager] Context suspended, cannot play");
      return null;
    }
    const buffer = this.cache.get(soundId);
    if (!buffer) {
      console.warn(`[AudioManager] Buffer not loaded for ${soundId}, call load first`);
      return null;
    }

    const bus = options.bus ?? "Effects";
    const loop = options.loop ?? false;
    const volume = options.volume ?? 1;
    const rate = options.rate ?? 1;
    const fadeIn = options.fadeIn ?? 0;
    const fadeOut = options.fadeOut ?? DEFAULT_FADE_TIME;
    const pos = options.position;
    const isPositional = !!pos && this.listener && this.parent;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    const busGain = this.mixer.getBusGain(bus);
    gain.connect(busGain);

    let source: AudioBufferSourceNode | THREE.PositionalAudio;
    let sourceIsPositional = false;

    if (isPositional && this.listener && this.parent) {
      try {
        const pAudio = new THREE.PositionalAudio(this.listener);
        if (!pAudio) throw new Error("PositionalAudio creation failed");
        pAudio.setBuffer(buffer);
        pAudio.setRefDistance(options.refDistance ?? DEFAULT_REF_DISTANCE);
        pAudio.setMaxDistance(options.maxDistance ?? DEFAULT_MAX_DISTANCE);
        pAudio.setRolloffFactor(options.rolloff ?? DEFAULT_ROLLOFF);
        if (options.coneInnerAngle !== undefined) (pAudio as any).setConeInnerAngle?.(options.coneInnerAngle);
        if (options.coneOuterAngle !== undefined) (pAudio as any).setConeOuterAngle?.(options.coneOuterAngle);
        if (options.coneOuterGain !== undefined) (pAudio as any).setConeOuterGain?.(options.coneOuterGain);
        pAudio.position.set(pos[0], pos[1], pos[2]);
        this.parent.add(pAudio);

        pAudio.disconnect();
        pAudio.connect(gain as AudioNode);
        pAudio.setVolume(1);
        pAudio.setLoop(loop);
        pAudio.setPlaybackRate(rate);
        pAudio.play();

        source = pAudio;
        sourceIsPositional = true;
      } catch (e) {
        console.warn("[AudioManager] PositionalAudio failed, falling back to non-positional:", e);
        // fallback to non-positional
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = loop;
        src.playbackRate.value = rate;
        src.start(0, options.offset ?? 0);
        src.connect(gain);
        source = src;
      }
    } else {
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = loop;
      src.playbackRate.value = rate;
      src.start(0, options.offset ?? 0);
      src.connect(gain);
      source = src;
    }

    const id = Symbol(`sound_${soundId}_${this.idCounter++}`);
    const active: ActiveSound = {
      source,
      gain,
      bus,
      isPlaying: true,
      isPaused: false,
      startTime: this.ctx.currentTime,
      loop,
    };
    this.active.set(id, active);

    if (fadeIn > 0) {
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + fadeIn);
    } else {
      gain.gain.value = volume;
    }

    if (!loop) {
      const onEnd = () => {
        if (this.active.has(id)) {
          this.cleanup(id);
        }
        if (source instanceof THREE.PositionalAudio) {
          source.removeEventListener('ended', onEnd);
        }
      };
      active.onEnded = onEnd;
      if (source instanceof THREE.PositionalAudio) {
        source.addEventListener('ended', onEnd);
      } else {
        source.onended = onEnd;
      }
    }

    const handle: AudioHandle = {
      stop: (fadeOutDuration?: number) => {
        this.stop(id, fadeOutDuration ?? fadeOut);
      },
      pause: () => {
        this.pause(id);
      },
      resume: () => {
        this.resume(id);
      },
      get isPlaying() {
        const a = this.active.get(id);
        return a ? a.isPlaying : false;
      },
      source: source instanceof THREE.PositionalAudio ? source : (source as AudioBufferSourceNode),
      gain,
    };
    return handle;
  }

  stop(id: Symbol, fadeOut: number = DEFAULT_FADE_TIME): void {
    const active = this.active.get(id);
    if (!active) return;
    if (fadeOut > 0) {
      const gain = active.gain;
      const current = gain.gain.value;
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(current, now);
      gain.gain.linearRampToValueAtTime(0, now + fadeOut);
      active.fadeOutTimer = window.setTimeout(() => {
        this.cleanup(id);
      }, fadeOut * 1000 + 50);
    } else {
      this.cleanup(id);
    }
  }

  pause(id: Symbol): void {
    const active = this.active.get(id);
    if (!active || !active.isPlaying || active.isPaused) return;
    if (active.source instanceof THREE.PositionalAudio) {
      active.source.pause();
    } else {
      const elapsed = this.ctx.currentTime - active.startTime;
      (active as any)._pauseOffset = elapsed % (active.source.buffer?.duration ?? 1);
      active.source.stop();
    }
    active.isPaused = true;
    active.isPlaying = false;
  }

  resume(id: Symbol): void {
    const active = this.active.get(id);
    if (!active || !active.isPaused) return;
    if (active.source instanceof THREE.PositionalAudio) {
      active.source.play();
      active.isPaused = false;
      active.isPlaying = true;
      return;
    }
    const offset = (active as any)._pauseOffset || 0;
    const buffer = active.source.buffer;
    if (!buffer) return;
    const newSource = this.ctx.createBufferSource();
    newSource.buffer = buffer;
    newSource.loop = active.loop;
    newSource.playbackRate.value = (active.source as AudioBufferSourceNode).playbackRate.value;
    newSource.start(0, offset);
    active.source.disconnect();
    newSource.connect(active.gain);
    active.source = newSource;
    active.isPaused = false;
    active.isPlaying = true;
    active.startTime = this.ctx.currentTime - offset;
    if (!active.loop) {
      const onEnd = () => {
        if (this.active.has(id)) this.cleanup(id);
      };
      newSource.onended = onEnd;
      active.onEnded = onEnd;
    }
  }

  stopAll(bus?: BusName): void {
    for (const [id, active] of this.active) {
      if (!bus || active.bus === bus) {
        this.stop(id, 0);
      }
    }
  }

  pauseAll(): void {
    for (const [id] of this.active) {
      this.pause(id);
    }
  }

  resumeAll(): void {
    for (const [id] of this.active) {
      this.resume(id);
    }
  }

  private cleanup(id: Symbol): void {
    const active = this.active.get(id);
    if (!active) return;
    if (active.fadeOutTimer) {
      clearTimeout(active.fadeOutTimer);
      delete active.fadeOutTimer;
    }
    try {
      if (active.source instanceof THREE.PositionalAudio) {
        active.source.stop();
        active.source.removeFromParent();
        active.source.disconnect();
      } else {
        active.source.stop();
        active.source.disconnect();
      }
      active.gain.disconnect();
    } catch (_) { /* ignore */ }
    this.active.delete(id);
  }

  dispose(): void {
    for (const [id] of this.active) {
      this.cleanup(id);
    }
    this.cache.clear();
  }
}