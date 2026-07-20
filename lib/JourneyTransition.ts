export type CameraState =
  | "idle"
  | "moving"
  | "arriving";

export type TransitionPhase =
  | "lift"
  | "fly"
  | "arrive";

export interface TransitionSettings {
  duration: number;
  lift: number;
  smoothTime: number;
  arrivalDelay: number;
  chapterDelay: number;
}