// // \components\systems\TransitionFade.tsx
// "use client";
// import { useEffect, useRef } from "react";
// import { useWorldState } from "@/components/World/WorldState";
// import { ENTER_ISLAND_THRESHOLD } from "@/components/World/WorldTimeline";

// // The fog shape around the Space->Island handoff is a trapezoid, not a
// // triangle: it ramps in over CLOUD_RAMP, then HOLDS at full opacity for
// // CLOUD_HOLD on either side of the threshold (this is the "walking through
// // the cloud" distance), then ramps back out. Driven directly by progressRef
// // every frame — not a fixed timer — so it thickens/clears symmetrically
// // whichever direction you cross the threshold from.
// //
// // Widen CLOUD_HOLD if the island still peeks through mid-cloud, or if you
// // want a longer stretch of "inside the cloud, can't see anything yet".
// // Widen CLOUD_RAMP for softer, slower edges; narrow it for a quicker punch
// // in/out of the fog.
// const CLOUD_HOLD = 0.06;
// const CLOUD_RAMP = 0.13;

// function easeInOutCubic(t: number) {
//   return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
// }

// // Trapezoid falloff: 1 inside the hold zone, eased 1->0 across the ramp,
// // 0 beyond it. `d` is distance (in progress units) from the threshold.
// function trapezoid(d: number) {
//   if (d <= CLOUD_HOLD) return 1;
//   if (d >= CLOUD_HOLD + CLOUD_RAMP) return 0;
//   const local = (d - CLOUD_HOLD) / CLOUD_RAMP; // 0 at hold edge -> 1 at outer edge
//   return 1 - easeInOutCubic(local);
// }

// export default function TransitionFade() {
//   const { progressRef } = useWorldState();
//   const rootRef = useRef<HTMLDivElement>(null);
//   const puffARef = useRef<HTMLDivElement>(null);
//   const puffBRef = useRef<HTMLDivElement>(null);
//   const rafRef = useRef<number>(0);
//   const frameRef = useRef(0);

//   useEffect(() => {
//     function tick() {
//       frameRef.current += 1;
//       const p = progressRef.current;
//       const d = Math.abs(p - ENTER_ISLAND_THRESHOLD);
//       const opacity = trapezoid(d);

//       if (rootRef.current) rootRef.current.style.opacity = String(opacity);

//       // Slow drift so the smoke reads as moving, not a static image; scales
//       // up slightly as it thickens for a subtle "closing in" feel.
//       const drift = frameRef.current;
//       if (puffARef.current) {
//         puffARef.current.style.transform = `translate(${Math.sin(drift * 0.011) * 4}%, ${Math.cos(drift * 0.008) * 4}%) scale(${1 + opacity * 0.15})`;
//       }
//       if (puffBRef.current) {
//         puffBRef.current.style.transform = `translate(${Math.cos(drift * 0.013) * 5}%, ${Math.sin(drift * 0.009) * 5}%) scale(${1 + opacity * 0.2})`;
//       }

//       rafRef.current = requestAnimationFrame(tick);
//     }
//     rafRef.current = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(rafRef.current);
//   }, [progressRef]);

//   return (
//     <div
//       ref={rootRef}
//       aria-hidden
//       style={{ position: "fixed", inset: 0, opacity: 0, pointerEvents: "none", zIndex: 90, overflow: "hidden" }}
//     >
//       <div
//         ref={puffARef}
//         style={{
//           position: "absolute",
//           inset: "-20%",
//           background:
//             "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.95), transparent 55%), radial-gradient(circle at 65% 65%, rgba(255,255,255,0.9), transparent 60%)",
//           filter: "blur(50px)",
//         }}
//       />
//       <div
//         ref={puffBRef}
//         style={{
//           position: "absolute",
//           inset: "-20%",
//           background:
//             "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.9), transparent 50%), radial-gradient(circle at 25% 70%, rgba(255,255,255,0.95), transparent 55%)",
//           filter: "blur(60px)",
//         }}
//       />
//       <div style={{ position: "absolute", inset: 0, background: "white", opacity: 0.15 }} />
//     </div>
//   );
// }