import { startVortex } from "./vortexRenderer";
import type { VortexOptions, VortexState } from "./vortexRenderer";

type Message =
  | { type: "init"; canvas: OffscreenCanvas; options: VortexOptions; state: VortexState }
  | { type: "state"; state: Partial<VortexState> };

// No DOM or React work in this thread's animation loop.
const scope = self;
let state: VortexState;
let stop: (() => void) | undefined;
scope.onmessage = (event: MessageEvent<Message>) => {
  const message = event.data;
  if (message.type === "state") {
    if (state) Object.assign(state, message.state);
    return;
  }
  try {
    stop?.();
    state = message.state;
    const hasRaf = typeof scope.requestAnimationFrame === "function";
    const schedule = (callback: FrameRequestCallback): number => hasRaf
      ? scope.requestAnimationFrame(callback)
      : scope.setTimeout(() => callback(performance.now()), 1000 / 60);
    const cancel = (id: number) => hasRaf
      ? scope.cancelAnimationFrame(id) : scope.clearTimeout(id);
    stop = startVortex(message.canvas, message.options, state, schedule, cancel);
    scope.postMessage({ type: "ready" });
  } catch (error) {
    scope.postMessage({ type: "error", message: String(error) });
  }
};
