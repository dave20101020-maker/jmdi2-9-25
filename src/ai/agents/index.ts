import { NORTHSTAR_SYSTEM_PROMPT } from "./northstar.system";
import { SLEEP_SYSTEM_PROMPT } from "./sleep.system";
import { MENTAL_SYSTEM_PROMPT } from "./mental.system";
import { NUTRITION_SYSTEM_PROMPT } from "./nutrition.system";
import { FITNESS_SYSTEM_PROMPT } from "./fitness.system";
import { PHYSICAL_SYSTEM_PROMPT } from "./physical.system";
import { FINANCES_SYSTEM_PROMPT } from "./finances.system";
import { SOCIAL_SYSTEM_PROMPT } from "./social.system";
import { SPIRITUALITY_SYSTEM_PROMPT } from "./spirituality.system";

export { NORTHSTAR_SYSTEM_PROMPT } from "./northstar.system";
export { SLEEP_SYSTEM_PROMPT } from "./sleep.system";
export { MENTAL_SYSTEM_PROMPT } from "./mental.system";
export { NUTRITION_SYSTEM_PROMPT } from "./nutrition.system";
export { FITNESS_SYSTEM_PROMPT } from "./fitness.system";
export { PHYSICAL_SYSTEM_PROMPT } from "./physical.system";
export { FINANCES_SYSTEM_PROMPT } from "./finances.system";
export { SOCIAL_SYSTEM_PROMPT } from "./social.system";
export { SPIRITUALITY_SYSTEM_PROMPT } from "./spirituality.system";

export const SYSTEM_PROMPTS = {
  northstar: NORTHSTAR_SYSTEM_PROMPT,
  sleep: SLEEP_SYSTEM_PROMPT,
  mental: MENTAL_SYSTEM_PROMPT,
  nutrition: NUTRITION_SYSTEM_PROMPT,
  fitness: FITNESS_SYSTEM_PROMPT,
  physical: PHYSICAL_SYSTEM_PROMPT,
  finances: FINANCES_SYSTEM_PROMPT,
  social: SOCIAL_SYSTEM_PROMPT,
  spirituality: SPIRITUALITY_SYSTEM_PROMPT,
} as const;
