// components/Audio/AudioProvider.tsx

"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { AudioContextValue, BusName } from "./audioTypes";
import { BUS_NAMES, DEFAULT_FADE_MS, GLOBAL_AMBIENCE_IDS } from "./audioDefaults";
import { AudioManager } from "./AudioManager";
import { AudioMixer } from "./AudioMixer";
import { loadAudioSettings, saveAudioSettings } from "./AudioSettings";

const AudioCtx = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const mixerRef = useRef<AudioMixer | null>(null);
  const managerRef = useRef<AudioManager | null>(null);

  const [ready, setReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);
  const [busVolumes, setBusVolumesState] = useState<Record<BusName, number>>(() => {
    const saved = loadAudioSettings();
    return saved?.busVolumes ?? ({} as Record<BusName, number>);
  });

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    const mixer = new AudioMixer(ctx);
    const manager = new AudioManager(ctx, mixer);
    ctxRef.current = ctx; mixerRef.current = mixer; managerRef.current = manager;
    return ctx;
  }, []);

  const unlock = useCallback(async () => {
    const ctx = ensureContext();
    if (ctx.state === "suspended") await ctx.resume();

    const saved = loadAudioSettings();
    const mixer = mixerRef.current!;
    if (saved) {
      setIsMuted(saved.muted);
      setMasterVolume(saved.masterVolume);
      mixer.setBusVolume("Master", saved.muted ? 0 : saved.masterVolume, 0);
      for (const bus of BUS_NAMES) {
        if (bus === "Master") continue;
        const v = saved.busVolumes[bus];
        if (typeof v === "number") mixer.setBusVolume(bus, v, 0);
      }
      setBusVolumesState(mixer.getAllBusVolumes());
    }

    await managerRef.current!.preload(GLOBAL_AMBIENCE_IDS);
    for (const id of GLOBAL_AMBIENCE_IDS) managerRef.current!.play(id, { fadeMs: 1200 });

    setReady(true);
  }, [ensureContext]);

  useEffect(() => () => { managerRef.current?.dispose(); mixerRef.current?.dispose(); ctxRef.current?.close(); }, []);

  const persist = useCallback((next: Partial<{ muted: boolean; masterVolume: number; busVolumes: Record<BusName, number> }>) => {
    const mixer = mixerRef.current;
    saveAudioSettings({
      muted: next.muted ?? isMuted,
      masterVolume: next.masterVolume ?? masterVolume,
      busVolumes: next.busVolumes ?? (mixer ? mixer.getAllBusVolumes() : busVolumes)
    });
  }, [isMuted, masterVolume, busVolumes]);

  const play = useCallback((id: string, opts?: Parameters<AudioContextValue["play"]>[1]) => {
    if (!managerRef.current) return null;
    void managerRef.current.play(id, opts);
    return id;
  }, []);

  const stop = useCallback((id: string, fadeMs?: number) => { managerRef.current?.stop(id, fadeMs ?? DEFAULT_FADE_MS); }, []);
  const stopInstance = useCallback((instanceId: string, fadeMs?: number) => { managerRef.current?.stopInstance(instanceId, fadeMs ?? DEFAULT_FADE_MS); }, []);
  const pause = useCallback(() => { managerRef.current?.pauseAll(); }, []);
  const resume = useCallback(() => { managerRef.current?.resumeAll(); }, []);

  const fade = useCallback((busOrId: string, target: number, durationMs = DEFAULT_FADE_MS) => {
    if (BUS_NAMES.includes(busOrId as BusName)) mixerRef.current?.setBusVolume(busOrId as BusName, target, durationMs);
  }, []);

  const setBusVolume = useCallback((bus: BusName, value: number, fadeMs = 0) => {
    mixerRef.current?.setBusVolume(bus, value, fadeMs);
    setBusVolumesState(prev => { const next = { ...prev, [bus]: value }; persist({ busVolumes: next }); return next; });
  }, [persist]);

  const setVolume = useCallback((value: number) => {
    setMasterVolume(value);
    mixerRef.current?.setBusVolume("Master", isMuted ? 0 : value, 150);
    persist({ masterVolume: value });
  }, [isMuted, persist]);

  const toggleMute = useCallback(() => {
  setIsMuted(prev => {
    const next = !prev;
    mixerRef.current?.setBusMuted("Master", next, 200);
    persist({ muted: next });
    return next;
  });
}, [persist]);

  const mute = useCallback(() => { if (!isMuted) toggleMute(); }, [isMuted, toggleMute]);
  const unmute = useCallback(() => { if (isMuted) toggleMute(); }, [isMuted, toggleMute]);

  const value: AudioContextValue = {
    play, stop, stopInstance, pause, resume, fade, mute, unmute, toggleMute,
    setVolume, setBusVolume, isMuted, masterVolume, busVolumes, ready, unlock
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudioContext() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudioContext must be inside AudioProvider");
  return ctx;
}