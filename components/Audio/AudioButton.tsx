// components/Audio/AudioButton.tsx

"use client";

import { useState } from "react";
import { useAudioContext } from "./AudioProvider";

export default function AudioButton() {
  const { isMuted, toggleMute, ready } = useAudioContext();
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={toggleMute}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      title={isMuted ? "Enable Ambient Sound" : "Disable Ambient Sound"}
      aria-label={isMuted ? "Enable Ambient Sound" : "Disable Ambient Sound"}
      style={{
        position: "fixed", left: 24, bottom: 24, zIndex: 200,
        width: 56, height: 56, borderRadius: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.22)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        boxShadow: hover ? "0 8px 28px rgba(0,0,0,0.35)" : "0 4px 16px rgba(0,0,0,0.25)",
        cursor: ready ? "pointer" : "wait",
        opacity: ready ? 1 : 0.6,
        transform: `scale(${pressed ? 0.92 : hover ? 1.06 : 1})`,
        transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease, opacity .3s ease",
      }}
    >
      <span
        style={{
          display: "inline-block", fontSize: 22, lineHeight: 1,
          transform: `rotate(${pressed ? 8 : 0}deg) scale(${isMuted ? 0.9 : 1})`,
          transition: "transform .3s cubic-bezier(.34,1.56,.64,1)",
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
        }}
      >
        {isMuted ? "🔇" : "🔊"}
      </span>
    </button>
  );
}