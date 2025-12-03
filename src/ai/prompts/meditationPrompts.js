/**
 * Meditation Prompt Templates
 * Used for guided meditation generation and meditation sessions
 */

export const meditationPrompts = {
  guidedMeditation: (duration = 10) => `Create a ${duration}-minute guided meditation script.

Structure:
1. Opening/grounding (1-2 min)
2. Main practice (6-8 min for 10min session)
3. Integration/closing (1-2 min)

Focus on relaxation and present moment awareness.
Use calming, supportive language.
Include timing indicators in brackets.`,

  breathingExercise: `Generate a breathing exercise for stress relief.

Include:
- Inhale count
- Hold count
- Exhale count
- Number of repetitions
- When to use it
- Expected benefits

Return JSON:
{
  "name": "...",
  "inhale": 4,
  "hold": 4,
  "exhale": 6,
  "repetitions": 5,
  "duration": "3-5 minutes",
  "benefits": ["benefit1", "benefit2"],
  "instructions": "..."
}`,

  bodyScan: `Create a body scan meditation script for progressive relaxation.

Guide the user through:
1. Feet and legs
2. Abdomen and lower back
3. Chest and upper back
4. Arms and shoulders
5. Neck and head

Use soothing language.
Include relaxation techniques for each area.
Total duration: 15 minutes.`,

  sleepMeditation: (duration = 20) => `Create a sleep meditation script for falling asleep.

Features:
- Deeply relaxing tone
- Progressive body relaxation
- Calming visualizations
- Minimal mental engagement
- Duration: ${duration} minutes
- Goal: Help listener fall asleep naturally`,

  focusMeditation: `Create a meditation for improving focus and concentration.

Include:
- Breath awareness practice
- Mental clarity visualization
- Focus strengthening technique
- Grounding in the present moment

Duration: 10-15 minutes.
Use energizing but calm language.`,

  anxietyRelief: `Create a guided meditation for anxiety relief.

Focus on:
1. Grounding techniques (5-senses)
2. Breathing for calm (slow, deep)
3. Safe place visualization
4. Affirmations for peace
5. Gentle closing

Total duration: 12 minutes.
Emphasize safety and control.`,

  customMeditation: (theme) => `Create a meditation themed around: "${theme}"

The meditation should:
- Last 15 minutes
- Include opening, main practice, and closing
- Be specific to the theme
- Use appropriate visualizations
- Feel personally meaningful

Return the full meditation script with timing.`,
};
