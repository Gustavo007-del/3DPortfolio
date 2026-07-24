// components/Audio/AudioMixer.ts

import { BusGraph, BusName, BusState } from "./audioTypes";
import { BUS_NAMES, DEFAULT_BUS_VOLUMES } from "./audioDefaults";

export class AudioMixer {
  private ctx: AudioContext;
  private master: GainNode;
  private buses: BusGraph = {} as BusGraph;
  private state: Record<BusName, BusState> = {} as Record<BusName, BusState>;
  private duckTimers: Map<BusName, number> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = DEFAULT_BUS_VOLUMES.Master;
    this.master.connect(ctx.destination);

    for (const name of BUS_NAMES) {
      if (name === "Master") { this.state.Master = { name, volume: DEFAULT_BUS_VOLUMES.Master, muted: false }; continue; }
      const input = ctx.createGain();
      const gain = ctx.createGain();
      gain.gain.value = DEFAULT_BUS_VOLUMES[name];
      input.connect(gain);
      gain.connect(this.master);
      this.buses[name] = { input, gain };
      this.state[name] = { name, volume: DEFAULT_BUS_VOLUMES[name], muted: false };
    }
  }

  getBusInput(bus: BusName): GainNode { return bus === "Master" ? this.master : this.buses[bus].input; }
  getBusState(bus: BusName): BusState { return this.state[bus]; }
  getAllBusVolumes(): Record<BusName, number> { const out = {} as Record<BusName, number>; for (const n of BUS_NAMES) out[n] = this.state[n].volume; return out; }

  private rampNode(node: GainNode, target: number, fadeMs: number) {
  const now = this.ctx.currentTime;
  const clamped = Math.max(0, target);
  node.gain.cancelScheduledValues(now);
  node.gain.setValueAtTime(node.gain.value, now);
  if (fadeMs <= 0) { node.gain.setValueAtTime(clamped, now); return; }
  node.gain.linearRampToValueAtTime(clamped, now + fadeMs / 1000);
}

  setBusVolume(bus: BusName, value: number, fadeMs = 0) {
    const v = Math.min(1, Math.max(0, value));
    this.state[bus].volume = v;
    const node = bus === "Master" ? this.master : this.buses[bus].gain;
    const effective = this.state[bus].muted ? 0 : v;
    this.rampNode(node, effective, fadeMs);
  }

  setBusMuted(bus: BusName, muted: boolean, fadeMs = 200) {
    this.state[bus].muted = muted;
    const node = bus === "Master" ? this.master : this.buses[bus].gain;
    this.rampNode(node, muted ? 0 : this.state[bus].volume, fadeMs);
  }

  duck(bus: BusName, target: number, fadeMs = 300) {
    const node = bus === "Master" ? this.master : this.buses[bus].gain;
    const existing = this.duckTimers.get(bus);
    if (existing) window.clearTimeout(existing);
    this.rampNode(node, target * this.state[bus].volume, fadeMs);
  }

  restore(bus: BusName, fadeMs = 300) {
    const node = bus === "Master" ? this.master : this.buses[bus].gain;
    this.rampNode(node, this.state[bus].muted ? 0 : this.state[bus].volume, fadeMs);
  }

  duckThenRestore(bus: BusName, target: number, holdMs: number, fadeMs = 300) {
    this.duck(bus, target, fadeMs);
    const t = window.setTimeout(() => this.restore(bus, fadeMs), holdMs);
    this.duckTimers.set(bus, t);
  }

  dispose() {
    for (const name of BUS_NAMES) { if (name === "Master") continue; this.buses[name].input.disconnect(); this.buses[name].gain.disconnect(); }
    this.master.disconnect();
    for (const t of this.duckTimers.values()) window.clearTimeout(t);
    this.duckTimers.clear();
  }
}