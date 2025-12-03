/**
 * AI Coach Message Generator
 * Generates personalized coaching messages based on pillar score
 */

const getScoreCategory = (score) => {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 25) return 'needs_improvement';
  return 'critical';
};

export const generateCoachingMessage = (pillarId, score = 50) => {
  const category = getScoreCategory(score);
  const categoryMessages = {
    excellent: 'Keep this momentum going!',
    good: 'You are doing well, aim higher!',
    fair: 'You can do better, try one small thing today.',
    needs_improvement: 'Struggling? That is okay, start with one tiny action.',
    critical: 'You need support. Please reach out to someone you trust.'
  };

  const defaultActions = {
    excellent: 'Continue your great progress!',
    good: 'Maintain your current habits.',
    fair: 'Try one small action today.',
    needs_improvement: 'Take one tiny step forward.',
    critical: 'Reach out for support.'
  };

  return {
    actionItem: defaultActions[category] || defaultActions.fair,
    encouragement: categoryMessages[category],
    category,
  };
};

export const generateQuickTip = (pillarId, score) => {
  const tips = [
    'One small action today compounds into big results.',
    'Progress over perfection every time.',
    'You are doing better than you think.',
    'Be kind to yourself in this moment.',
    'What is one thing you can do right now?'
  ];
  return tips[Math.floor(Math.random() * tips.length)];
};

export const generateCelebrationMessage = (achievementType, pillarName, streak) => {
  const celebrations = {
    streak_milestone: `Great work! ${streak} day streak in ${pillarName}!`,
    score_improvement: `Your ${pillarName} score improved! Growth is happening!`,
    completion: `Crushed that ${pillarName} goal! Celebrate this win!`,
  };
  return celebrations[achievementType] || celebrations.completion;
};

export default {
  generateCoachingMessage,
  generateQuickTip,
  generateCelebrationMessage,
};
