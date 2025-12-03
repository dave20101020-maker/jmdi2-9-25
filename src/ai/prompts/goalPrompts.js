/**
 * Goal Prompt Templates
 * Used in GoalCreator.jsx for transforming user goals into SMART goals
 */

export const goalPrompts = {
  smartGoal: `You are a goal-setting expert. Help transform this goal into a SMART goal framework.

The goal should be:
- Specific: Clear and well-defined
- Measurable: Quantifiable success metrics
- Achievable: Realistic within timeframe
- Relevant: Aligned with user's values
- Time-bound: Has a specific deadline

Return JSON:
{
  "original": "...",
  "smartGoal": "...",
  "specific": "...",
  "measurable": "...",
  "achievable": "...",
  "relevant": "...",
  "timeBound": "...",
  "actionSteps": ["step1", "step2", "step3"],
  "successCriteria": "...",
  "potentialObstacles": ["obstacle1", "obstacle2"],
  "resources": ["resource1", "resource2"]
}`,

  breakDown: (goal) => `Break down this goal into 4-6 weekly milestones:
"${goal}"

Each milestone should be:
- Measurable
- Achievable in one week
- Building toward the larger goal

Return JSON:
{
  "goal": "${goal}",
  "milestones": [
    {
      "week": 1,
      "milestone": "...",
      "deliverable": "..."
    }
  ],
  "successMetrics": ["metric1", "metric2"]
}`,

  habitCreation: (goal) => `Create a daily habit that supports this goal:
"${goal}"

The habit should be:
- Tiny (takes <10 minutes)
- Specific (clear trigger and action)
- Trackable

Return JSON:
{
  "habit": "...",
  "trigger": "...",
  "action": "...",
  "reward": "...",
  "frequency": "daily",
  "duration": "2 weeks",
  "success_rate_target": 80
}`,

  motivation: (goal) => `Create a personalized motivation statement for this goal:
"${goal}"

Include:
- Why this matters (deep motivation)
- How it connects to larger values
- A powerful affirmation

Return JSON:
{
  "whyItMatters": "...",
  "valueConnection": "...",
  "affirmation": "..."
}`,
};
