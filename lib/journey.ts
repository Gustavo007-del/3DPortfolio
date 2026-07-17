// lib/journey.ts

export type Vec3 = [number, number, number];

export interface JourneyCameraSettings {
  position: Vec3;
  lookAt: Vec3;

  // Cinematic settings
  duration: number;
  lift: number;
}

export interface JourneyStop {
  id: string;
  title: string;
  subtitle: string;

  camera: JourneyCameraSettings;
}

export const JOURNEY_STOPS: JourneyStop[] = [
  {
    id: "dock",
    title: "Arrival",
    subtitle: "Welcome to my island.",

    camera: {
      position: [11.873, 10.369, 2.485],
      lookAt: [0, 5, 0],

      duration: 4,
      lift: 5,
    },
  },

  {
    id: "bridge",
    title: "About Me",
    subtitle: "Cross the ancient bridge.",

    camera: {
      position: [0, 0, 0],
      lookAt: [0, 0, 0],

      duration: 4,
      lift: 5,
    },
  },

  {
    id: "gate",
    title: "Skills",
    subtitle: "The fortress gate.",

    camera: {
      position: [0, 0, 0],
      lookAt: [0, 0, 0],

      duration: 4,
      lift: 5,
    },
  },

  {
    id: "courtyard",
    title: "Projects",
    subtitle: "Inside the castle courtyard.",

    camera: {
      position: [0, 0, 0],
      lookAt: [0, 0, 0],

      duration: 4,
      lift: 5,
    },
  },

  {
    id: "tower",
    title: "Contact",
    subtitle: "Reach the highest tower.",

    camera: {
      position: [0, 0, 0],
      lookAt: [0, 0, 0],

      duration: 4,
      lift: 5,
    },
  },
];