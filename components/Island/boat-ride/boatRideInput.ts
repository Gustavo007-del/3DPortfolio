// components/Island/boat-ride/boatRideInput.ts
//
// Keyboard + on-screen control merge (PLAN.md §8). All input lives in one
// module-level mutable object — nothing re-renders per keypress.

"use client";

export const rideInput = {
  keyThrottle: 0,
  keyBrake: 0,
  keySteer: 0, // written by keyboard
  uiThrottle: 0,
  uiBrake: 0,
  uiWheel: 0, // written by on-screen controls
};

const down = new Set<string>();
const HANDLED = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "KeyW", "KeyA", "KeyS", "KeyD", "Space",
]);

function recompute() {
  rideInput.keyThrottle = down.has("ArrowUp") || down.has("KeyW") ? 1 : 0;
  rideInput.keyBrake =
    down.has("ArrowDown") || down.has("KeyS") || down.has("Space") ? 1 : 0;
  rideInput.keySteer =
    (down.has("ArrowRight") || down.has("KeyD") ? 1 : 0) -
    (down.has("ArrowLeft") || down.has("KeyA") ? 1 : 0);
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function resetRideInput() {
  down.clear();
  rideInput.keyThrottle = 0;
  rideInput.keyBrake = 0;
  rideInput.keySteer = 0;
  rideInput.uiThrottle = 0;
  rideInput.uiBrake = 0;
  rideInput.uiWheel = 0;
}

/** Attach while phase !== "idle". Returns a detach function. */
export function attachRideKeyboard(onExit: () => void) {
  const kd = (e: KeyboardEvent) => {
    if (isTyping(e.target)) return;
    if (e.code === "Escape") {
      e.preventDefault();
      onExit();
      return;
    }
    if (HANDLED.has(e.code)) {
      e.preventDefault(); // freeze journey scroll while riding (§2.4)
      down.add(e.code);
      recompute();
    }
  };
  const ku = (e: KeyboardEvent) => {
    if (HANDLED.has(e.code)) {
      down.delete(e.code);
      recompute();
    }
  };
  const blur = () => resetRideInput();
  window.addEventListener("keydown", kd, { passive: false });
  window.addEventListener("keyup", ku);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", blur);
  return () => {
    window.removeEventListener("keydown", kd);
    window.removeEventListener("keyup", ku);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", blur);
    resetRideInput();
  };
}

export interface RideInputReading {
  throttle: number;
  brake: number;
  steer: number;
}

export function readRideInput(out: RideInputReading) {
  out.throttle = Math.max(rideInput.keyThrottle, rideInput.uiThrottle);
  out.brake = Math.max(rideInput.keyBrake, rideInput.uiBrake);
  out.steer =
    Math.abs(rideInput.uiWheel) > 0.001 ? rideInput.uiWheel : rideInput.keySteer;
}
