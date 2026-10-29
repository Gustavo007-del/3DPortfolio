"use client";

import { useSyncExternalStore } from "react";

export type TimeOfDay = "day" | "dusk" | "night";
export type IslandSettings = {
  timeOfDay: TimeOfDay;
  fog: boolean;
  fogStrength: number;
  birds: boolean;
  birdActivity: number;
  mist: boolean;
  particles: boolean;
  brightness: number;
};

export const DEFAULT_ISLAND_SETTINGS: IslandSettings = {
  timeOfDay: "day",
  fog: true,
  fogStrength: 1,
  birds: true,
  birdActivity: 1,
  mist: true,
  particles: true,
  brightness: 1,
};

let settings = { ...DEFAULT_ISLAND_SETTINGS };
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => settings;

export function useIslandSettings() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function updateIslandSettings(patch: Partial<IslandSettings>) {
  settings = { ...settings, ...patch };
  listeners.forEach((listener) => listener());
}

export function resetIslandSettings() {
  settings = { ...DEFAULT_ISLAND_SETTINGS };
  listeners.forEach((listener) => listener());
}
