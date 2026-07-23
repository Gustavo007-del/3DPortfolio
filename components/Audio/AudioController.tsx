// components/Audio/AudioController.tsx

import { ReactNode, cloneElement, isValidElement } from "react";
import { useAudio } from "./AudioProvider";
import { SoundId, PlayOptions, AudioHandle, BusName } from "./audioTypes";

/**
 * Convenience hook that extends the base audio API with
 * pre-configured play methods for common use cases.
 */
export function useAudioController() {
  const audio = useAudio();

  const playSound = (soundId: SoundId, options?: PlayOptions): AudioHandle | null => {
    return audio.play(soundId, options);
  };

  const playUISound = (soundId: SoundId, volume?: number): AudioHandle | null => {
    return audio.play(soundId, { bus: "UI", volume, fadeIn: 0.05, fadeOut: 0.05 });
  };

  const playEffectSound = (
    soundId: SoundId,
    position?: [number, number, number],
    volume?: number
  ): AudioHandle | null => {
    return audio.play(soundId, { bus: "Effects", position, volume, fadeIn: 0.1 });
  };

  const playAmbientSound = (
    soundId: SoundId,
    volume?: number,
    loop: boolean = true
  ): AudioHandle | null => {
    return audio.play(soundId, { bus: "Ambient", loop, volume, fadeIn: 1 });
  };

  const playEnvironmentSound = (
    soundId: SoundId,
    position?: [number, number, number],
    volume?: number,
    loop: boolean = true
  ): AudioHandle | null => {
    return audio.play(soundId, { bus: "Environment", loop, position, volume, fadeIn: 0.5 });
  };

  const playVoice = (soundId: SoundId, volume?: number): AudioHandle | null => {
    return audio.play(soundId, { bus: "Voice", volume, fadeIn: 0.2 });
  };

  const playMusic = (soundId: SoundId, volume?: number, loop: boolean = true): AudioHandle | null => {
    return audio.play(soundId, { bus: "Music", loop, volume, fadeIn: 2 });
  };

  return {
    ...audio,
    playSound,
    playUISound,
    playEffectSound,
    playAmbientSound,
    playEnvironmentSound,
    playVoice,
    playMusic,
  };
}

/**
 * Wraps a child element and plays a sound on interaction.
 */
interface AudioTriggerProps {
  sound: SoundId;
  children: ReactNode;
  bus?: BusName;
  volume?: number;
  on?: "click" | "hover" | "focus";
  options?: PlayOptions;
}

export function AudioTrigger({
  sound,
  children,
  bus = "UI",
  volume = 0.8,
  on = "click",
  options = {},
}: AudioTriggerProps) {
  const { play } = useAudio();

  const handleTrigger = () => {
    play(sound, { bus, volume, ...options });
  };

  if (isValidElement(children)) {
    const eventMap = {
      click: { onClick: handleTrigger },
      hover: { onMouseEnter: handleTrigger },
      focus: { onFocus: handleTrigger },
    };
    const eventProps = eventMap[on] || eventMap.click;
    // Merge existing props with new event handler
    return cloneElement(children, {
      ...eventProps,
      // If the child already has the same event, we could chain or override; we override for simplicity.
    });
  }

  return <span onClick={handleTrigger}>{children}</span>;
}