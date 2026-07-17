// lib/portfolioData.ts

export type Skill = { name: string; level: number; category: string };
export type Project = {
  title: string;
  description: string;
  tags: string[];
  coordinates: string;
  link?: string;
};

export const profile = {
  name: "Shijil P",
  role: "Full-Stack Developer & Creative Technologist",
  tagline: "Charting backend systems by day, uncharted 3D islands by night.",
  location: "Kozhikode, Kerala, India",
  bio:
    "B.Tech Computer Science graduate turned full-stack explorer — fluent in Python/Django, comfortable in Java, and currently charting new territory in React Three Fiber and WebGL. I build reliable systems for real businesses, and restless side-projects for myself.",
  email: "you@example.com",
  github: "https://github.com/yourhandle",
  linkedin: "https://linkedin.com/in/yourhandle",
};

// Sequential — these ARE waypoints on a journey, so numbering/ordering carries real meaning.
export const compassPoints = [
  { label: "Origin", value: "TKM College of Engineering — B.Tech CS, 2024" },
  { label: "Base Camp", value: "Aspen Digital Solutions — Full Stack Developer" },
  { label: "Territory", value: "Python · Django · Java · React Three Fiber" },
  { label: "Next Expedition", value: "Open to backend & creative-dev roles" },
];

export const skills: Skill[] = [
  { name: "Python / Django", level: 92, category: "Backend" },
  { name: "Java", level: 75, category: "Backend" },
  { name: "REST APIs & Celery", level: 85, category: "Backend" },
  { name: "React / Next.js", level: 78, category: "Frontend" },
  { name: "Three.js / R3F", level: 70, category: "3D & Creative" },
  { name: "PostgreSQL / MySQL", level: 80, category: "Data" },
];

export const projects: Project[] = [
  {
    title: "Temple Pooja Booking System",
    description:
      "Production Django platform for a live temple — real-time booking guards against double-bookings, a bilingual Malayalam/English calendar, and automated subscription reminders via Celery Beat.",
    tags: ["Django", "Celery", "PostgreSQL"],
    coordinates: "12.3°N — Live Production Site",
  },
  {
    title: "3D Island Portfolio",
    description:
      "This very site — a hand-tuned sunset island in React Three Fiber, with custom GLSL sky gradients, reflective water shaders, and this cinematic scroll-driven camera path.",
    tags: ["Three.js", "R3F", "GLSL", "Next.js"],
    coordinates: "You Are Here",
  },
  {
    title: "JWT Auth Starter",
    description:
      "A Django authentication app with secure JWT flows and a properly implemented, persistent 'Remember Me' experience.",
    tags: ["Django", "JWT", "Auth"],
    coordinates: "Uncharted Backend Waters",
  },
];

// Camera stops for the scroll-driven journey. Tune these using your
// existing <CameraInspector /> — walk the camera to a spot you like for
// each section, read the printed position/lookAt, and paste it in here.
export const CAMERA_WAYPOINTS: {
  position: [number, number, number];
  lookAt: [number, number, number];
}[] = [
  { position: [11.873, 10.369, 2.485], lookAt: [0, 2, 0] }, // Hero — your current default view
  { position: [-8, 6, 14], lookAt: [-4, 2, 0] },            // About — pull in toward the island
  { position: [18, 4, -6], lookAt: [10, 1, -10] },          // Skills — closer to the mountains
  { position: [2, 8, 20], lookAt: [0, 0, 5] },               // Expeditions — water reflection view
  { position: [0, 14, 30], lookAt: [0, 2, 0] },               // Contact — pull back, wide sunset
];

export const SECTIONS = ["Origin", "Base Camp", "Territory", "Expeditions", "Rendezvous"];