// Edit all portfolio copy here.
// Links marked '#' are placeholders: replace them with your real live demo / repository URLs.

export const profile = {
  name: "Madusha Damith",
  role: "Full-stack developer · AI enthusiast",
  bio: "I’m an IT undergraduate at the University of Moratuwa, building thoughtful interfaces and the systems behind them. I’m drawn to useful software, considered design, and the possibilities of AI.",
  email: "madushdamith8@gmail.com", // e.g. 'hello@yourname.dev' — when set, the big "Let's talk" button becomes a mailto link
  github: "https://github.com/Madush4",
  linkedin: "https://www.linkedin.com/in/madushadamith/",
};

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  stack: string[];
  year: string;
  status?: string;
  /** Screenshot or poster. Put the file in public/projects/ and write '/projects/name.webp'. */
  image?: string;
  /** Short silent screen recording (mp4/webm). Plays when the card is in view. */
  video?: string;
  links: { live?: string; code?: string };
  /** Accent used for the card glow. */
  tint: string;
};

export const projects: Project[] = [
  {
    slug: "smartgov",
    title: "SmartGov",
    tagline: "Government services, one conversation away.",
    description:
      "An AI citizen-engagement platform for Sri Lanka. A LangGraph agent answers questions about government services using RAG over official GIC data, verifies NIC documents with a vision model and calculates income tax, with an admin dashboard for the people who run the services.",
    highlights: [
      "Agentic LangGraph workflow with tool calls and persistent multi-turn memory",
      "NIC verification with Gemini Vision: OCR, old and new NIC formats, structured JSON result",
      "RAG over government portal data in Pinecone, plus Gemini key rotation and GPT-4o fallback",
      "Expo mobile app for citizens and a React 19 admin web portal",
    ],
    stack: [
      "LangGraph",
      "FastAPI",
      "Gemini",
      "Pinecone",
      "React Native",
      "React",
    ],
    year: "2026",
    links: { live: "#", code: "https://github.com/Prabuddha4701/smartGov" },
    tint: "#4f8cff",
  },
  {
    slug: "waypoint",
    title: "Waypoint",
    tagline: "Four roles, one live delivery network.",
    description:
      "Built with team CodeCrew for the Tech-Triathlon 2026 hackathon. A delivery and distribution platform where store managers, dispatchers, warehouse loaders and drivers each get their own interface, connected in one real-time workflow and deployed live.",
    highlights: [
      "My part: the Loader kiosk, with LIFO loading sequence, crate-count checks and discrepancy reporting, built from our Figma designathon screens",
      "Constraint-based fleet allocation (weight, volume, temperature, access) for dispatchers",
      "Offline-first driver app with digital proof of delivery and automatic sync on reconnect",
      "Whole stack starts with one docker compose up, with seeded accounts for every role",
    ],
    stack: [
      "React",
      "TypeScript",
      "Tailwind",
      "Node.js",
      "PostgreSQL",
      "Docker",
    ],
    year: "2026",
    status: "Live",
    links: {
      live: "https://codecrew.inusha.me",
      code: "https://github.com/inusha-thathsara/CodeCrew_Waypoint",
    },
    tint: "#ffc940",
  },
  {
    slug: "elephant",
    title: "Elephant Guard",
    tagline: "An early warning when elephants come close.",
    description:
      "A wildlife alert system for communities living near elephant corridors. ESP32 sensor towers talk over LoRa, alerts sync through Firebase, and a React Native app warns people nearby in real time.",
    highlights: [
      "ESP32 sender and receiver units communicating over long-range LoRa",
      "Firebase Realtime Database for live tower state and community sightings",
      "Duplicate-alert suppression and automatic reset of stale tower states",
      "React Native / Expo app for alerts and sighting reports",
    ],
    stack: ["ESP32", "LoRa", "Firebase", "React Native", "Expo"],
    year: "2025",
    links: {
      live: "#",
      code: "https://github.com/Madush4/Smart-Elephant-Detective-Project",
    },
    tint: "#ff8a3d",
  },
  {
    slug: "devpulse",
    title: "DevPulse",
    tagline: "Your GitHub, turned into a story.",
    description:
      "A developer analytics platform. Search any GitHub username to see profile stats, top repositories, language breakdown, a contribution heatmap and coding-consistency insights.",
    highlights: [
      "Express API over the GitHub REST API with an SQLite cache to stay inside rate limits",
      "Interactive charts and a contribution heatmap with Recharts",
      "Clear handling of invalid usernames, API failures and rate limits",
    ],
    stack: [
      "React",
      "Vite",
      "Tailwind",
      "Recharts",
      "Node.js",
      "Express",
      "SQLite",
    ],
    year: "2026",
    links: { live: "#", code: "https://github.com/Madush4/DevPulse" },
    tint: "#3ddc97",
  },
  {
    slug: "nexus",
    title: "Nexus",
    tagline: "Distribution, from manufacturer to retailer.",
    description:
      "A year-long team project (IN2901, University of Moratuwa): a distribution management platform connecting manufacturers, agencies, warehouses, supervisors and delivery agents through web and mobile apps on a shared Spring Boot backend.",
    highlights: [
      "My part: dispatch and fleet management, route optimisation, maps and real-time monitoring",
      "Spring Boot + PostgreSQL with Flyway migrations, Redis cache, Docker",
      "Role-based web apps in React and mobile apps in React Native",
    ],
    stack: ["Spring Boot", "PostgreSQL", "React", "React Native", "Docker"],
    year: "2026–27",
    status: "In development",
    links: { code: "https://github.com/TEAM-NEXUS-UOM" },
    tint: "#b18cff",
  },
  {
    slug: "cinematch",
    title: "CineMatch",
    tagline: "The right movie for tonight’s mood.",
    description:
      "A movie recommender that maps your mood, age range and favourite genre to films from a public movie API. Focused on clean UI, smooth interaction and solid frontend logic, with dark and light themes.",
    highlights: [
      "Mood-to-genre mapping and age-appropriate filtering, no exact age needed",
      "Live data from a public movie API, plus a trending page",
      "Dark and light mode saved in LocalStorage, fully responsive",
    ],
    stack: ["JavaScript", "Tailwind CSS", "TMDB API", "HTML"],
    year: "2025",
    links: {
      live: "#",
      code: "https://github.com/Madush4/CIneMatch-Movie-Recommendation-Project",
    },
    tint: "#ff4d6d",
  },
];

/**
 * The timeline is drawn as a git graph. `lane: 'branch'` items fork off main,
 * show their commits on the side lane, and merge back. `msg` is the commit
 * message typed out in the little terminal on the left.
 */
export type Milestone = {
  branch: string;
  lane: "main" | "branch";
  time: string;
  title: string;
  text: string;
  msg: string;
  commits: string[];
};

export const journey: Milestone[] = [
  {
    branch: "main",
    lane: "main",
    time: "The start",
    title: "Joined the Faculty of IT, UoM.",
    text: "BSc (Hons) in Information Technology at the University of Moratuwa. Data structures, databases, operating systems: the foundations everything else is built on.",
    msg: "init: BSc IT @ UoM",
    commits: ["C", "DSA", "SQL", "OS"],
  },
  {
    branch: "feature/web",
    lane: "branch",
    time: "Learning to ship",
    title: "From HTML to full-stack.",
    text: "React, TypeScript and Tailwind on the front, Node, Express and Java on the back. CineMatch and DevPulse were where it clicked: real APIs, caching, charts.",
    msg: "feat: CineMatch + DevPulse",
    commits: ["React", "TypeScript", "Express", "Spring Boot"],
  },
  {
    branch: "feature/iot",
    lane: "branch",
    time: "Code meets hardware",
    title: "Software that leaves the screen.",
    text: "Elephant Guard: ESP32 towers talking over LoRa, alerts flowing through Firebase to a React Native app, for villages living next to elephant corridors.",
    msg: "feat(iot): Elephant Guard",
    commits: ["ESP32", "LoRa", "Firebase", "Expo"],
  },
  {
    branch: "feature/ai",
    lane: "branch",
    time: "Python & AI",
    title: "Agents that actually do things.",
    text: "Python, LangGraph and RAG for IDEALIZE 2026. SmartGov answers government-service questions from official data, verifies NICs with a vision model and calculates tax.",
    msg: "feat(ai): SmartGov agent + RAG",
    commits: ["Python", "LangGraph", "Pinecone", "Gemini"],
  },
  {
    branch: "team/hackathons",
    lane: "branch",
    time: "Teams & deadlines",
    title: "Shipping under pressure.",
    text: "Tech-Triathlon 2026 with CodeCrew: designed in Figma, then built the Loader kiosk for Waypoint and shipped it live. Now owning dispatch & fleet in Nexus, our year-long IN2901 team project.",
    msg: "merge: Waypoint live, Nexus WIP",
    commits: ["Figma", "Docker", "PostgreSQL", "Code review"],
  },
  {
    branch: "main",
    lane: "main",
    time: "Next chapter",
    title: "Heading into AI/ML engineering.",
    text: "Building a strong full-stack base while going deeper into machine learning. Looking for an internship where I can learn fast and ship real things.",
    msg: "chore: open to internships",
    commits: [],
  },
];

/** Tech stack, grouped. Colours tint the 3D sphere. */
export const stack: { name: string; color: string; items: string[] }[] = [
  {
    name: "Frontend",
    color: "#8fb8ff",
    items: [
      "React",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "Vite",
      "HTML & CSS",
    ],
  },
  { name: "Mobile", color: "#b18cff", items: ["React Native", "Expo"] },
  {
    name: "Backend",
    color: "#3ddc97",
    items: ["Node.js", "Express", "Spring Boot", "Java", "FastAPI"],
  },
  {
    name: "AI & Data",
    color: "#ffb36b",
    items: ["Python", "LangGraph", "RAG", "Pinecone", "Gemini"],
  },
  {
    name: "Databases",
    color: "#5ce1e6",
    items: ["PostgreSQL", "MySQL", "Firebase", "SQLite"],
  },
  {
    name: "IoT & Tools",
    color: "#ff6b9a",
    items: ["ESP32", "LoRa", "Git & GitHub", "Docker", "Figma"],
  },
];

/** The scrolling text bands. */
export const marquees = {
  top: [
    "Full-stack developer",
    "AI agents & RAG",
    "IoT systems",
    "UoM · Faculty of IT",
    "Open to internships",
  ],
  bottom: [
    "React",
    "TypeScript",
    "Spring Boot",
    "LangGraph",
    "React Native",
    "Node.js",
    "PostgreSQL",
    "ESP32",
  ],
};
