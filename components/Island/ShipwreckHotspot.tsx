// components/Island/ShipwreckHotspot.tsx
//
// DOM side of the shipwreck interaction (PLAN.md §6.2):
//  - hover the wreck → pointer cursor + anchored info card (≤80 ms open,
//    150 ms close grace). Cursor off the wreck → card goes away.
//  - moving onto the card itself keeps it open (standard menu affordance);
//    leaving the card closes it again.
//  - click (not drag) → router.push("/projects"); touch: first tap opens,
//    second tap navigates, tap elsewhere dismisses.
//  - keyboard-focusable proxy button performs the same action
//  - respects prefers-reduced-motion (transition off via motion-reduce)
//
// Mounted OUTSIDE the R3F canvas (WorldManager journey overlay / Nwisland).

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addWreckPointerListener,
  raycastWreckAt,
  type WreckPointerPayload,
} from "./FortEffectsController";
import { getRidePhase } from "./boat-ride/boatRideStore";

const ROUTE = "/projects";
const CLOSE_GRACE_MS = 150;
const DRAG_SLOP_PX = 5;

export default function ShipwreckHotspot() {
  const router = useRouter();
  const [payload, setPayload] = useState<WreckPointerPayload>({
    hovered: false,
    anchorX: 0,
    anchorY: 0,
    anchorVisible: false,
  });
  const [barOpen, setBarOpen] = useState(false);

  const downPosRef = useRef<{ x: number; y: number } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barOpenRef = useRef(barOpen);
  barOpenRef.current = barOpen;
  const prefetchedRef = useRef(false);
  /** True while the bar was opened by a touch tap (two-tap flow). */
  const tapArmedRef = useRef(false);
  /** True while the cursor is over the card itself (keeps it open). */
  const cardHoverRef = useRef(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openBar = useCallback(() => {
    clearCloseTimer();
    setBarOpen(true);
    if (!prefetchedRef.current) {
      prefetchedRef.current = true;
      router.prefetch(ROUTE);
    }
  }, [clearCloseTimer, router]);

  // Idempotent on purpose: repeated hovered=false emits (~12.5 Hz) must NOT
  // re-arm the timer — the old version cleared and reset it every emit, so
  // the grace period never elapsed and the bar never closed.
  const scheduleClose = useCallback(() => {
    if (closeTimerRef.current) return;
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setBarOpen(false);
      tapArmedRef.current = false;
    }, CLOSE_GRACE_MS);
  }, []);

  const dismiss = useCallback(() => {
    clearCloseTimer();
    setBarOpen(false);
    tapArmedRef.current = false;
  }, [clearCloseTimer]);

  const navigate = useCallback(() => {
    router.push(ROUTE);
  }, [router]);

  // Throttled hover raycast results from the controller (~12.5 Hz).
  useEffect(() => {
    return addWreckPointerListener((p) => {
      // Skip no-change emits so hovering doesn't re-render at 12.5 Hz.
      setPayload((prev) =>
        prev.hovered === p.hovered &&
        prev.anchorVisible === p.anchorVisible &&
        Math.round(prev.anchorX) === Math.round(p.anchorX) &&
        Math.round(prev.anchorY) === Math.round(p.anchorY)
          ? prev
          : p
      );
      // The tap flow manages its own lifetime; hover drives the rest.
      if (tapArmedRef.current) return;
      if (p.hovered) {
        openBar();
      } else if (barOpenRef.current && !cardHoverRef.current) {
        scheduleClose();
      }
    });
  }, [openBar, scheduleClose]);

  // Pointer cursor while hovering the hotspot.
  useEffect(() => {
    if (!payload.hovered) return;
    const prev = document.body.style.cursor;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = prev;
    };
  }, [payload.hovered]);

  // Click/tap handling directly on the canvas. Drags are ignored (PLAN §6.2).
  // While a boat ride is active the hotspot is fully disabled (PLAN §2.6):
  // no navigation from a click on the canvas, no tap arming.
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const onDown = (e: PointerEvent) => {
      if (getRidePhase() !== "idle") return;
      downPosRef.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (getRidePhase() !== "idle") return;
      const down = downPosRef.current;
      downPosRef.current = null;
      if (!down) return;
      const moved =
        Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) >
        DRAG_SLOP_PX;
      if (moved) return;

      const tap = raycastWreckAt(e.clientX, e.clientY);
      if (!tap.hit) {
        // Tapping anywhere else dismisses an armed touch bar.
        if (tapArmedRef.current) dismiss();
        return;
      }
      if (e.pointerType === "touch") {
        if (!tapArmedRef.current) {
          // First tap: show the bar; second tap navigates (PLAN §6.2).
          tapArmedRef.current = true;
          setPayload((prev) => ({ ...prev, ...tap, hovered: true }));
          openBar();
        } else {
          navigate();
        }
        return;
      }
      navigate();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [navigate, openBar, dismiss]);

  // Leaving the canvas closes a hover-opened bar. The tap flow ignores this
  // (a touch tap also fires a synthetic pointerleave right after pointerup).
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const onLeave = () => {
      if (getRidePhase() !== "idle") return;
      if (!tapArmedRef.current) scheduleClose();
    };
    canvas.addEventListener("pointerleave", onLeave);
    return () => canvas.removeEventListener("pointerleave", onLeave);
  }, [scheduleClose]);

  // Moving onto the card itself keeps it open; leaving the card closes it.
  // cardHoverRef also stops the off-canvas hovered=false emits from re-arming
  // the close timer while the user is reading / reaching for the CTA.
  const onCardEnter = useCallback(() => {
    if (tapArmedRef.current) return;
    cardHoverRef.current = true;
    clearCloseTimer();
  }, [clearCloseTimer]);
  const onCardLeave = useCallback(() => {
    if (tapArmedRef.current) return;
    cardHoverRef.current = false;
    scheduleClose();
  }, [scheduleClose]);

  // Drop any pending timer when the page goes away (defensive).
  useEffect(() => {
    const onUnload = () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
    window.addEventListener("pagehide", onUnload);
    return () => window.removeEventListener("pagehide", onUnload);
  }, []);

  const visible = barOpen && payload.anchorVisible;

  return (
    <>
      {/* Anchored info card (default UI, PLAN §6.2) */}
      <div
        role="dialog"
        aria-label="Shipwreck"
        aria-hidden={!visible}
        className={`pointer-events-none fixed z-40 transition-all duration-200 motion-reduce:transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          left: payload.anchorX,
          top: payload.anchorY,
          transform: visible
            ? "translate(-50%, -100%)"
            : "translate(-50%, -100%) translateY(6px)",
        }}
      >
        <div
          onPointerEnter={onCardEnter}
          onPointerLeave={onCardLeave}
          className={`-mt-3 w-64 rounded-2xl border border-white/15 bg-slate-900/85 p-4 shadow-2xl backdrop-blur-md ${
            visible ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
            Somewhere off the bow
          </p>
          <h3 className="mt-1 text-lg font-bold text-white">Shipwreck</h3>
          <p className="mt-1 text-sm text-slate-300">
            Every project here started as a wreck somebody refused to abandon.
          </p>
          <button
            type="button"
            onClick={navigate}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            View projects <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* Keyboard-accessible proxy (PLAN §6.2 a11y) */}
      <button
        type="button"
        onClick={navigate}
        className="sr-only focus:not-sr-only focus:fixed focus:bottom-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-xl focus:ring-2 focus:ring-cyan-400"
      >
        Open projects (shipwreck shortcut)
      </button>
    </>
  );
}
