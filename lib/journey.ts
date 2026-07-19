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
  position: [36.067, 21.267, 43.493],
  lookAt: [0.000, 5.000, 0.000],
  duration: 4,
  lift: 5,
},
  },

  {
    id: "bridge",
    title: "About Me",
    subtitle: "Cross the ancient bridge.",

    camera: {
  position: [-0.363, 6.424, 41.742],
  lookAt: [0.054, 5.107, -0.003],
  duration: 4,
  lift: 5,
},
  },

  {
    id: "gate",
    title: "Skills",
    subtitle: "The fortress gate.",

    camera: {
  position: [0.266, 11.133, 16.759],
  lookAt: [0.271, 8.677, -0.835],
  duration: 4,
  lift: 5,
},
  },

  {
    id: "courtyard",
    title: "Projects",
    subtitle: "Inside the castle courtyard.",

    camera: {
  position: [-0.189, 9.800, -1.334],
  lookAt: [-0.189, 9.800, -1.336],
  duration: 4,
  lift: 5,
},
  },

  {
    id: "tower",
    title: "Contact",
    subtitle: "Reach the highest tower.",

    camera: {
  position: [-18.763, 35.741, -3.020],
  lookAt: [-3.093, 13.642, -15.119],
  duration: 4,
  lift: 5,
},
  },
];