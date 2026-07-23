// components/Audio/AudioProvider.tsx

"use client";

import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";
import * as THREE from "three";
import { AudioManager } from "./AudioManager";
import { AudioMixer } from "./AudioMixer";
import { AudioSettings } from "./AudioSettings";
import { AudioContextType, SoundId, PlayOptions, AudioHandle, BusName } from "./audioTypes";
import { DEFAULT_SETTINGS } from "./audioDefaults";

export interface InternalAudioContextType extends AudioContextType {
  __setListener: (listener: THREE.AudioListener) => void;
  __setParent: (parent: THREE.Object3D) => void;
  __ensureInitialized: () => Promise<void>; // now async
}

const AudioContext = createContext<InternalAudioContextType | null>(null);

export function useAudio(): InternalAudioContextType {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}

interface AudioProviderProps {
  children: ReactNode;
  audioContext?: AudioContext;
}

export function AudioProvider({ children, audioContext }: AudioProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(DEFAULT_SETTINGS.muted);
  const [masterVolume, setMasterVolumeState] = useState(DEFAULT_SETTINGS.masterVolume);
  const [busVolumes, setBusVolumes] = useState<Record<BusName, number>>(DEFAULT_SETTINGS.busVolumes);

  const ctxRef = useRef<AudioContext | null>(audioContext ?? null);
  const mixerRef = useRef<AudioMixer | null>(null);
  const managerRef = useRef<AudioManager | null>(null);
  const settingsRef = useRef<AudioSettings | null>(null);
  const initialized = useRef(false);
  const initPromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    settingsRef.current = new AudioSettings();
    const saved = settingsRef.current.load();
    if (saved) {
      setIsMuted(saved.muted);
      setMasterVolumeState(saved.masterVolume);
      setBusVolumes(saved.busVolumes);
    }
  }, []);

  const initAudio = async (): Promise<void> => {
    if (initialized.current) {
      // Already initialized, but ensure context is running
      if (ctxRef.current && ctxRef.current.state === "suspended") {
        await ctxRef.current.resume();
      }
      return;
    }
    // Prevent concurrent init
    if (initPromise.current) return initPromise.current;

    initPromise.current = (async () => {
      console.log("[AudioProvider] Initializing audio...");
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") {
        console.log("[AudioProvider] Resuming suspended context");
        await ctx.resume();
        console.log("[AudioProvider] Context resumed, state:", ctx.state);
      } else {
        console.log("[AudioProvider] Context state:", ctx.state);
      }

      const mixer = new AudioMixer(ctx);
      mixerRef.current = mixer;
      mixer.setMasterVolume(masterVolume);
      if (isMuted) mixer.mute(true);
      for (const [bus, vol] of Object.entries(busVolumes)) {
        mixer.setBusVolume(bus as BusName, vol);
      }
      console.log("[AudioProvider] Mixer created, master volume:", masterVolume, "muted:", isMuted);

      const manager = new AudioManager(ctx, mixer);
      managerRef.current = manager;
      initialized.current = true;
      setIsReady(true);
      console.log("[AudioProvider] AudioManager created and ready");
    })();

    await initPromise.current;
    initPromise.current = null;
  };

  // --- Public API ---
  const load = async (soundId: SoundId): Promise<AudioBuffer> => {
    await initAudio();
    const manager = managerRef.current;
    if (!manager) throw new Error("AudioManager not initialized");
    return manager.load(soundId);
  };

  const play = (soundId: SoundId, options?: PlayOptions): AudioHandle | null => {
    // Play must be called after init, but we can't make it async without breaking the API.
    // We'll check if initialized; if not, we call initAudio synchronously (but it won't await).
    // Instead, we require that the caller ensures initialization before calling play.
    // But we can also attempt to init and if context is suspended, return null.
    if (!initialized.current) {
      // Try to init synchronously (but it will be async, so we can't wait).
      // We'll call initAudio but not await, and then check state.
      initAudio().catch(console.error);
      // For safety, return null; caller should retry after init.
      console.warn("[AudioProvider] play called before initialization, returning null");
      return null;
    }
    const manager = managerRef.current;
    if (!manager) return null;
    return manager.play(soundId, options);
  };

  const stopAll = (bus?: BusName) => {
    const manager = managerRef.current;
    if (!manager) return;
    manager.stopAll(bus);
  };

  const pauseAll = () => {
    const manager = managerRef.current;
    if (!manager) return;
    manager.pauseAll();
  };

  const resumeAll = () => {
    const manager = managerRef.current;
    if (!manager) return;
    manager.resumeAll();
  };

  const setMasterVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setMasterVolumeState(clamped);
    if (mixerRef.current) {
      mixerRef.current.setMasterVolume(clamped);
    }
    if (settingsRef.current) {
      settingsRef.current.save({ muted: isMuted, masterVolume: clamped, busVolumes });
    }
  };

  const setBusVolume = (bus: BusName, vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setBusVolumes(prev => ({ ...prev, [bus]: clamped }));
    if (mixerRef.current) {
      mixerRef.current.setBusVolume(bus, clamped);
    }
    if (settingsRef.current) {
      settingsRef.current.save({ muted: isMuted, masterVolume, busVolumes: { ...busVolumes, [bus]: clamped } });
    }
  };

  const mute = (muted: boolean = true) => {
    setIsMuted(muted);
    if (mixerRef.current) mixerRef.current.mute(muted);
    if (settingsRef.current) {
      settingsRef.current.save({ muted, masterVolume, busVolumes });
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    mute(newMuted);
  };

  const fadeMaster = (target: number, duration: number) => {
    if (mixerRef.current) {
      mixerRef.current.fadeMaster(target, duration);
      setMasterVolumeState(Math.max(0, Math.min(1, target)));
    }
  };

  const fadeBus = (bus: BusName, target: number, duration: number) => {
    if (mixerRef.current) {
      mixerRef.current.fadeBus(bus, target, duration);
      setBusVolumes(prev => ({ ...prev, [bus]: Math.max(0, Math.min(1, target)) }));
    }
  };

  const __setListener = (listener: THREE.AudioListener) => {
    initAudio().catch(console.error);
    if (managerRef.current) {
      managerRef.current.setListener(listener);
      console.log("[AudioProvider] Listener set");
    }
  };

  const __setParent = (parent: THREE.Object3D) => {
    initAudio().catch(console.error);
    if (managerRef.current) {
      managerRef.current.setParent(parent);
      console.log("[AudioProvider] Parent set");
    }
  };

  const __ensureInitialized = async (): Promise<void> => {
    await initAudio();
  };

  useEffect(() => {
    if (audioContext && audioContext.state === "running") {
      initAudio().catch(console.error);
    }
  }, [audioContext]);

  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
      if (mixerRef.current) {
        mixerRef.current.dispose();
        mixerRef.current = null;
      }
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        ctxRef.current.close().catch(() => {});
      }
      initialized.current = false;
      setIsReady(false);
    };
  }, []);

  const value: InternalAudioContextType = {
    play,
    load,
    stopAll,
    pauseAll,
    resumeAll,
    setMasterVolume,
    setBusVolume,
    mute,
    toggleMute,
    isMuted,
    masterVolume,
    busVolumes,
    fadeMaster,
    fadeBus,
    isReady,
    __setListener,
    __setParent,
    __ensureInitialized,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}