// lib/portfolioData.ts

export type Skill = { name: string; level: number; category: string };
export type Project = {
  slug: string;
  title: string;
  description: string;
  role: string;
  outcome: string;
  caseStudy: string;
  highlights: string[];
  tags: string[];
  coordinates: string;
  link?: string;
  sourceLink?: string;
  image?: string;
  featured?: boolean;
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
    slug: "shopify-product-classifier",
    title: "Shopify Product Taxonomy Classifier",
    description:
      "A Django and React review workspace that classifies supplier catalog rows against Shopify taxonomy using a text-first, image-assisted pipeline.",
    role: "Full-stack development and ML workflow",
    outcome: "Suggests taxonomy categories for products, then routes uncertain matches into a human review queue.",
    caseStudy: "The Taxon prototype imports product rows from spreadsheets and maps them to Shopify's 14,606-category taxonomy. Its first pass uses MiniLM text embeddings and fuzzy matching; a second OpenCLIP image pass is reserved for low-confidence products. The pipeline combines text and image confidence, stores alternatives and detected attributes, and supports approval, rejection, and manual review through a React dashboard and Django REST API.",
    highlights: ["Two-pass text and image classification to focus heavier inference on uncertain products", "Confidence scores, alternatives, and manual review statuses", "Batch jobs with progress tracking, resumable runs, and a React results dashboard"],
    tags: ["Python", "Django REST", "React", "PyTorch", "Sentence Transformers", "OpenCLIP"],
    coordinates: "Catalog Operations · ML Prototype",
    sourceLink: "https://github.com/Gustavo007-del/taxon",
    featured: true,
  },
  {
    slug: "3d-island-portfolio",
    title: "3D Island Portfolio",
    description:
      "This very site — a hand-tuned sunset island in React Three Fiber, with custom GLSL sky gradients, reflective water shaders, and this cinematic scroll-driven camera path.",
    role: "Design and full-stack development",
    outcome: "A portfolio presented as an explorable 3D world, with a scroll-driven journey between chapters.",
    caseStudy: "Designed and developed an interactive portfolio that turns the usual section-by-section page into a journey from space to an island. The experience combines a custom Three.js scene, shader work, camera choreography, and HTML overlays for the portfolio content.",
    highlights: ["React Three Fiber world with custom scene elements", "GLSL sky and reflective water", "Scroll-driven camera journey with chapter navigation"],
    tags: ["Three.js", "R3F", "GLSL", "Next.js"],
    coordinates: "You Are Here",
    sourceLink: "https://github.com/Gustavo007-del/3DPortfolio",
    featured: true,
  },
  {
    slug: "texfix-mobile-app",
    title: "TechFix Field Operations",
    description:
      "A field operations system pairing an Expo mobile app with a Django REST backend for technician attendance, location sessions, courier operations, and spare parts workflows.",
    role: "Mobile and backend development",
    outcome: "Connects technician-facing attendance and stock workflows with administrative courier, inventory, and service operations.",
    caseStudy: "The public tecxfix-final repository contains an Expo and React Native Android app alongside a Django REST backend. The source models technician profiles, GPS-stamped attendance, work-location sessions, spare requests, courier transactions, stock movement, and sales requests. Admin APIs support technician management, approvals, reporting, and PDF sales-request output.",
    highlights: ["JWT sign-in for technician and admin roles", "GPS check-in/out and technician location sessions", "Courier and spare-part flows with stock sync and approval endpoints"],
    tags: ["React Native", "Expo", "Django REST", "PostgreSQL", "Google Sheets"],
    coordinates: "Field Operations · Android + API",
    sourceLink: "https://github.com/Gustavo007-del/tecxfix-final",
    featured: true,
  },
  {
    slug: "movie-booking-system",
    title: "Movie Show Booking",
    description:
      "A Django cinema-booking site with searchable movie listings, city and language filters, cinema/showtime data, and user bookings that store selected seats and payment status.",
    role: "Full-stack Django development",
    outcome: "Brings movie discovery, scheduled screenings, and per-user ticket reservations into one web workflow.",
    caseStudy: "The movie-booking repository is a Django application split into movie listings, cinema/showtime management, user registration, and booking apps. The movie catalogue supports filtering by title, city, and language. The data model relates screenings to a theater, movie, date, time, screen, and ticket price; bookings record ticket count, selected seat numbers, total price, and pending, confirmed, or cancelled status.",
    highlights: ["Search and filter films by title, city, and language", "Theater, screen, date, time, and ticket-price showtime records", "User bookings store seats, ticket count, price, and status"],
    tags: ["Python", "Django", "SQLite", "HTML", "CSS"],
    coordinates: "Django Web Application",
    sourceLink: "https://github.com/Gustavo007-del/movie-booking",
  },
  {
    slug: "movie-wishlist",
    title: "Movie Wishlist",
    description:
      "A Django movie catalogue with detail pages, user accounts, editable profiles, and personal favorite-movie lists.",
    role: "Full-stack Django development",
    outcome: "Lets visitors discover films and signed-in users keep a personal collection of favorites.",
    caseStudy: "The separate moviewishlist repository models a movie catalogue with genre, release date, language, rating, description, and poster fields. Its Django views provide movie search and detail pages, authentication, profile editing, and a user-scoped favorites view.",
    highlights: ["Searchable movie catalogue and detail pages", "User registration, sign-in, and profile editing", "Favorites associated with each user account"],
    tags: ["Python", "Django", "SQLite", "HTML", "CSS"],
    coordinates: "Django Web Application",
    sourceLink: "https://github.com/Gustavo007-del/moviewishlist",
  },
  {
    slug: "image-to-3d-surface-visualizer",
    title: "Image to 3D Surface Visualizer",
    description:
      "A browser tool that turns image luminance into a GPU-displaced 3D surface, with live height-map, lighting, smoothing, and color controls.",
    role: "Creative development and shader engineering",
    outcome: "Makes an image's tonal structure explorable as a live 3D height field, with image and height-map export.",
    caseStudy: "Built a Three.js WebGL tool with custom GLSL vertex and fragment shaders. Users can upload or drag in an image, orbit a procedural or image-derived surface, adjust height, contrast, source channel, smoothing, mesh detail, lighting, and palettes, then export the canvas as PNG. An optional OpenCV script generates denoised and normalized height maps before upload.",
    highlights: ["GLSL vertex displacement driven by image luminance", "Live histogram, FPS display, camera controls, and rendering modes", "Optional OpenCV preprocessing for denoising and height-map generation"],
    tags: ["Three.js", "WebGL", "GLSL", "JavaScript", "OpenCV"],
    coordinates: "Interactive Graphics Tool",
    sourceLink: "https://github.com/Gustavo007-del/Image-to-3D-Surface-Visualizer",
  },
  {
    slug: "worker-inventory-api",
    title: "Worker Inventory & Attendance API",
    description:
      "A Django REST backend for worker stock assignments, photo-backed usage reports, shipment receipts, and GPS-stamped attendance.",
    role: "Backend development",
    outcome: "Connects stock issued to workers with usage review, courier records, and attendance history.",
    caseStudy: "This API models inventory items, worker assignments, usage logs with supporting photos and approval status, courier shipments with received quantities and photos, worker locations, and attendance check-in/out coordinates. DRF endpoints provide stock and member administration, item assignment, usage submission and review, history, and attendance actions.",
    highlights: ["Per-worker stock assignments and inventory administration", "Usage submissions include a photo and an approval workflow", "Courier shipment status, received quantities, and GPS attendance records"],
    tags: ["Python", "Django", "Django REST Framework", "SQLite"],
    coordinates: "Workforce Inventory API",
    sourceLink: "https://github.com/Gustavo007-del/worker_inventory_backend",
  },
  {
    slug: "natuvipani-farmer-app",
    title: "Natuvipani Farmer App",
    description:
      "A farmer-focused mobile app designed to make everyday agricultural information and services easier to access.",
    role: "Mobile product development",
    outcome: "Agricultural information and services brought into a farmer-focused mobile experience.",
    caseStudy: "Created a farmer-focused mobile app to make everyday agricultural information and services easier to access. The product is designed around a specific audience and the practical needs of daily use.",
    highlights: ["Designed for a farmer audience", "Mobile access to agricultural services", "React Native experience"],
    tags: ["Mobile", "Farmers", "Backend"],
    coordinates: "Digital Tools — Natuvipani",
  },
  {
    slug: "kandakalankavu",
    title: "Kandakalankavu",
    description:
      "A dedicated digital experience for Kandakalankavu, bringing its identity and information together in a clear, accessible space.",
    role: "Web development",
    outcome: "A dedicated online home that presents Kandakalankavu's identity and information clearly.",
    caseStudy: "Created a dedicated digital experience for Kandakalankavu, organizing its identity and information into a clear online destination.",
    highlights: ["Dedicated digital presence", "Identity-led presentation", "Clear information structure"],
    tags: ["Website", "Branding", "Community"],
    coordinates: "Cultural Digital Experience",
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
