/**
 * Journal Prompt Templates
 * Used for journal entry generation and guided journaling
 */

export const journalPrompts = {
  guidedEntry: `Generate a guided journaling prompt that helps someone explore their thoughts and feelings.

The prompt should:
- Be open-ended and reflective
- Encourage deeper self-awareness
- Feel safe and non-judgmental
- Lead to meaningful writing

Return a single, powerful question.`,

  emotionalProcessing: `Help someone process their emotions through journaling.

Ask them to:
1. Name the emotion they're experiencing
2. Explore where it comes from
3. Understand what it's telling them
4. Decide on a response or action

Create 3-4 sequential journaling prompts.`,

  gratitudeJournal: `Generate a gratitude journaling prompt that goes beyond surface-level appreciation.

The prompt should:
- Encourage depth of gratitude
- Connect to larger life themes
- Be emotionally resonant
- Feel genuine, not forced

Return 2-3 reflection prompts.`,

  stressRelief: `Create journaling prompts for stress relief and emotional regulation.

Include:
- Acknowledgment of stress
- Exploration of root causes
- Identification of what's in/out of control
- Action steps for relief

Return 4 guided prompts.`,

  goalReflection: (
    goal
  ) => `Create journaling prompts for reflecting on progress toward this goal:
"${goal}"

Help the user:
1. Assess current progress
2. Identify obstacles faced
3. Celebrate wins (big and small)
4. Plan next steps

Return 3-4 reflection questions.`,

  weeklyReview: () => `Generate a weekly review journaling template.

Guide the user to reflect on:
- Wins and successes
- Challenges and learning
- Progress on goals
- Intentions for next week
- One key insight

Return a structured journaling framework.`,
};
