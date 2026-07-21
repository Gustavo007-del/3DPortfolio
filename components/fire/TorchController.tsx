"use client";

import Torch from "./Torch";

type TorchData = {
  position: [number, number, number];
  scale?: number;
  intensity?: number;
};

const TORCHES: TorchData[] = [
  // ---------- Dock ----------
  {
    position: [8, 2.3, 18],
  },
  {
    position: [-8, 2.3, 18],
  },

  // ---------- Bridge ----------
  {
    position: [12, 2.3, 5],
  },
  {
    position: [-12, 2.3, 5],
  },

  // ---------- Castle Gate ----------
  {
    position: [7, 2.3, -18],
  },
  {
    position: [-7, 2.3, -18],
  },

  // ---------- Courtyard ----------
  {
    position: [18, 2.3, -42],
  },
  {
    position: [-18, 2.3, -42],
  },

  // ---------- Tower ----------
  {
    position: [2, 14, -62],
    intensity: 24,
  },
];

export default function TorchController() {
  return (
    <>
      {TORCHES.map((torch, index) => (
        <Torch
          key={index}
          position={torch.position}
          scale={torch.scale ?? 1}
          lightIntensity={torch.intensity ?? 18}
        />
      ))}
    </>
  );
}