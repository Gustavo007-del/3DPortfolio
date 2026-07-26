// // \components\canvas\IslandPrewarm.tsx
// "use client";
// import { useRef } from "react";
// import { useFrame, useThree } from "@react-three/fiber";
// import { useWorldState } from "@/components/World/WorldState";

// // Progress point at which we force-compile Island's shaders while it's still
// // invisible (LODGroup keeps Island's group at visible=false until phase
// // reaches TRANSITION_TO_ISLAND). Three.js only compiles a material's GPU
// // program the first time it's actually rendered — so without this, the
// // instant Island's group flips visible mid-transition, every mesh/shader in
// // the scene (mountain, water, mist, birds, fireflies, lights) compiles in a
// // single frame, causing a stutter right as the fog is supposed to be
// // clearing. Warming this early — still deep in the Space zoom, well before
// // the cloud even starts thickening — gives the driver time to compile
// // without it ever showing up as a dropped frame.
// const PREWARM_AT_PROGRESS = 0.55;

// export default function IslandPrewarm() {
//   const { progressRef } = useWorldState();
//   const { gl, scene, camera } = useThree();
//   const hasWarmed = useRef(false);

//   useFrame(() => {
//     if (hasWarmed.current) return;
//     if (progressRef.current >= PREWARM_AT_PROGRESS) {
//       gl.compile(scene, camera);
//       hasWarmed.current = true;
//     }
//   });

//   return null;
// }