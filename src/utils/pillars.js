/**
 * 8-Pillar System Configuration
 * Defines the core pillars of the NorthStar wellness app
 */

export const PILLARS = {
  sleep: {
    id: "sleep",
    name: "Sleep",
    longName: "Sleep & Rest",
    icon: "🌙",
    color: "#6B46C1",
    hexColor: "#6B46C1",
    description: "Quality sleep is foundational to physical health, cognitive function, and emotional resilience. Prioritize consistent sleep schedules and sleep hygiene.",
    category: "Health",
    order: 1
  },
  diet: {
    id: "diet",
    name: "Diet",
    longName: "Nutrition & Diet",
    icon: "🥗",
    color: "#52B788",
    hexColor: "#52B788",
    description: "Nourish your body with balanced nutrition. A healthy diet boosts energy, supports mental clarity, and prevents chronic diseases.",
    category: "Health",
    order: 2
  },
  exercise: {
    id: "exercise",
    name: "Exercise",
    longName: "Physical Activity",
    icon: "💪",
    color: "#FF5733",
    hexColor: "#FF5733",
    description: "Regular movement improves cardiovascular health, builds strength, and enhances mood through endorphin release.",
    category: "Health",
    order: 3
  },
  physical_health: {
    id: "physical_health",
    name: "Physical Health",
    longName: "Physical Health & Wellness",
    icon: "❤️",
    color: "#FF7F50",
    hexColor: "#FF7F50",
    description: "Holistic physical wellbeing including preventive care, stress management, and disease prevention.",
    category: "Health",
    order: 4
  },
  mental_health: {
    id: "mental_health",
    name: "Mental Health",
    longName: "Mental Health & Mindfulness",
    icon: "🧠",
    color: "#4CC9F0",
    hexColor: "#4CC9F0",
    description: "Cultivate emotional resilience, practice mindfulness, and prioritize mental wellbeing through meditation and reflection.",
    category: "Wellness",
    order: 5
  },
  finances: {
    id: "finances",
    name: "Finances",
    longName: "Financial Health",
    icon: "💰",
    color: "#2E8B57",
    hexColor: "#2E8B57",
    description: "Build financial stability through smart budgeting, saving, and investing. Financial security reduces stress and enables freedom.",
    category: "Lifestyle",
    order: 6
  },
  social: {
    id: "social",
    name: "Social",
    longName: "Social Connections",
    icon: "👥",
    color: "#FFD700",
    hexColor: "#FFD700",
    description: "Strong relationships and meaningful social connections are vital to happiness and longevity. Invest in your relationships.",
    category: "Relationships",
    order: 7
  },
  spirituality: {
    id: "spirituality",
    name: "Spirituality",
    longName: "Spirituality & Purpose",
    icon: "✨",
    color: "#7C3AED",
    hexColor: "#7C3AED",
    description: "Find meaning, purpose, and alignment with your values. Spirituality transcends religion and includes life direction and fulfillment.",
    category: "Purpose",
    order: 8
  }
};

/**
 * Get all pillars as an array sorted by order
 */
export const getPillarsArray = () => {
  return Object.values(PILLARS).sort((a, b) => a.order - b.order);
};

/**
 * Get a specific pillar by ID
 */
export const getPillarById = (id) => {
  return PILLARS[id] || null;
};

/**
 * Get pillar name by ID
 */
export const getPillarName = (id) => {
  const pillar = PILLARS[id];
  return pillar ? pillar.name : null;
};

/**
 * Get pillar color by ID
 */
export const getPillarColor = (id) => {
  const pillar = PILLARS[id];
  return pillar ? pillar.color : "#CCCCCC";
};

/**
 * Get pillar icon by ID
 */
export const getPillarIcon = (id) => {
  const pillar = PILLARS[id];
  return pillar ? pillar.icon : "📊";
};

/**
 * Check if a pillar ID is valid
 */
export const isValidPillarId = (id) => {
  return id in PILLARS;
};

/**
 * Get all pillar IDs
 */
export const getAllPillarIds = () => {
  return Object.keys(PILLARS);
};

/**
 * Get pillars by category
 */
export const getPillarsByCategory = (category) => {
  return getPillarsArray().filter(pillar => pillar.category === category);
};
