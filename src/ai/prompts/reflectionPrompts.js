/**
 * Reflection Prompt Templates
 * Used in ReflectionPrompt.jsx for daily, weekly, monthly, and custom reflections
 */

export const reflectionPrompts = {
  daily: "Create a thoughtful daily reflection prompt that helps someone review their day with gratitude, awareness, and intention for tomorrow.",
  
  weekly: "Create a weekly reflection prompt that encourages someone to review the past week's experiences, growth, and lessons learned.",
  
  monthly: "Create a monthly reflection prompt that invites deep contemplation of progress, patterns, and alignment with values over the past month.",
  
  custom: "Create a spiritual reflection prompt that explores meaning, purpose, and connection to something greater.",
  
  /**
   * Generate a complete reflection prompt request
   * @param {string} type - Type of reflection (daily, weekly, monthly, custom)
   * @returns {string} Complete prompt for API call
   */
  generate: (type) => {
    const basePrompt = reflectionPrompts[type] || reflectionPrompts.daily;
    return `${basePrompt}

Requirements:
- Single, open-ended question
- Emotionally resonant and introspective
- No more than 2 sentences
- Suitable for journaling

Return JSON:
{
  "prompt": "...",
  "category": "${type}"
}`;
  },
};
