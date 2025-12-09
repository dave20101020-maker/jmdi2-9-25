// NorthStar Theme Palette
// Core brand + pillar colors centralized for consistent usage

export const CORE = Object.freeze({
  NAVY: "#0A1224",
  GOLD: "#D4AF37",
  SOFT_GOLD: "#E6C76A",
  WHITE: "#FFFFFF",
  SOFT_WHITE: "#F4F7FA",
  DIVIDER: "#1C2438",
  ERROR_RED: "#FF6868",
});

export const PILLARS = Object.freeze({
  sleep: { primary: "#4B6FFF", light: "#AFC2FF", text: CORE.WHITE },
  diet: { primary: "#7BC74D", light: "#CFF2B8", text: CORE.NAVY },
  exercise: { primary: "#FF7A28", light: "#FFC9A8", text: CORE.WHITE },
  physical_health: { primary: "#1BBF9A", light: "#A4EDDD", text: CORE.WHITE },
  mental_health: { primary: "#4FB3FF", light: "#BFE6FF", text: CORE.NAVY },
  finances: { primary: "#22A06B", light: "#A8ECCE", text: CORE.WHITE },
  social: { primary: "#FF4D8B", light: "#FFC2D8", text: CORE.WHITE },
  spirituality: { primary: "#9A66FF", light: "#D9C6FF", text: CORE.WHITE },
});

export default { CORE, PILLARS };
