// components/Environment/Birds/birdTypes.ts
import { Vector3 } from 'three';

export type Species = 'seagull' | 'crow' | 'eagle' | 'owl';

export type BirdState = 'flying' | 'gliding' | 'turning' | 'circling' | 'returning' | 'landing' | 'takeoff' | 'scared';

export interface SpeciesProfile {
  species: Species;
  bodyLength: number; wingSpan: number; tailLength: number;
  baseSpeed: number; wingSpeedBase: number; wingAmplitudeBase: number;
  glideChanceBase: number; bankAmountBase: number; color: string; scale: number;
}

export const SPECIES_PROFILES: Record<Species, SpeciesProfile> = {
  seagull: { species: 'seagull', bodyLength: 0.5, wingSpan: 1.1, tailLength: 0.25, baseSpeed: 4, wingSpeedBase: 3.2, wingAmplitudeBase: 0.6, glideChanceBase: 0.35, bankAmountBase: 0.6, color: '#e8e4da', scale: 1 },
  crow: { species: 'crow', bodyLength: 0.35, wingSpan: 0.7, tailLength: 0.2, baseSpeed: 3.4, wingSpeedBase: 4.5, wingAmplitudeBase: 0.5, glideChanceBase: 0.15, bankAmountBase: 0.7, color: '#1a1a1a', scale: 0.85 },
  eagle: { species: 'eagle', bodyLength: 0.65, wingSpan: 1.6, tailLength: 0.3, baseSpeed: 3.8, wingSpeedBase: 1.8, wingAmplitudeBase: 0.45, glideChanceBase: 0.6, bankAmountBase: 0.5, color: '#5c4a3a', scale: 1.2 },
  owl: { species: 'owl', bodyLength: 0.4, wingSpan: 0.9, tailLength: 0.15, baseSpeed: 2.6, wingSpeedBase: 3.8, wingAmplitudeBase: 0.55, glideChanceBase: 0.25, bankAmountBase: 0.65, color: '#8a7a5c', scale: 0.95 },
};

export interface FlockingWeights {
  separationWeight: number; alignmentWeight: number; cohesionWeight: number;
  wanderStrength: number; orbitSpeed: number;
}

export interface BirdRuntimeParams {
  wingSpeed: number; wingAmplitude: number; bankAmount: number;
  scatterDistance: number; scatterSpeed: number; returnSpeed: number; birdScale: number;
  glideChance: number;
}

export interface BirdData {
  position: Vector3; velocity: Vector3; acceleration: Vector3;
  forward: Vector3; up: Vector3;
  homeCenter: Vector3; orbitAngle: number; orbitRadius: number; orbitHeight: number;
  species: Species; state: BirdState;
  bank: number; pitch: number;
  wingPhase: number; wingSpeed: number; wingAmplitude: number;
  glideChance: number; glideTimer: number; glideDuration: number; isGliding: boolean;
  scatterAmount: number; seed: number; id: number;
}

export interface FieldConfig {
  name: string; center: [number, number, number]; radius: number;
  height: number; count: number; speed: number; species: Species;
}

export const DEFAULT_FLOCKING_WEIGHTS: FlockingWeights = {
  separationWeight: 1.5, alignmentWeight: 1, cohesionWeight: 0.8,
  wanderStrength: 0.6, orbitSpeed: 0.15,
};

export const DEFAULT_RUNTIME_PARAMS: BirdRuntimeParams = {
  wingSpeed: 1, wingAmplitude: 1, bankAmount: 1,
  scatterDistance: 4, scatterSpeed: 6, returnSpeed: 1.2, birdScale: 1,
  glideChance: 0.3,
};

export const BIRD_STATES: BirdState[] = ['flying', 'gliding', 'turning', 'circling', 'returning', 'landing', 'takeoff', 'scared'];