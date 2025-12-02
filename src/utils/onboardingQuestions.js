/**
 * Onboarding Questions - Based on CBT and COM-B (Capability, Opportunity, Motivation-Behavior) Model
 * Structured for comprehensive assessment across all 8 wellness pillars
 */

export const onboardingQuestions = {
  sleep: {
    pillarId: 'sleep',
    pillarName: 'Sleep',
    icon: '😴',
    color: '#4CC9F0',
    questions: [
      {
        id: 'sleep_duration',
        type: 'number',
        category: 'physiological',
        question: 'On average, how many hours do you sleep per night?',
        placeholder: '7.5',
        min: 0,
        max: 12,
        step: 0.5,
        unit: 'hours',
        weight: 0.3,
      },
      {
        id: 'sleep_quality',
        type: 'scale',
        category: 'psychological',
        question: 'How would you rate the quality of your sleep?',
        subtitle: '1 = Very Poor, 10 = Excellent',
        min: 1,
        max: 10,
        weight: 0.25,
      },
      {
        id: 'sleep_consistency',
        type: 'scale',
        category: 'behavioral',
        question: 'How consistent is your sleep schedule (same bedtime/wake time)?',
        subtitle: '1 = Never consistent, 10 = Always consistent',
        min: 1,
        max: 10,
        weight: 0.2,
      },
      {
        id: 'sleep_capability',
        type: 'scale',
        category: 'com_b',
        question: 'How capable do you feel to improve your sleep habits?',
        subtitle: 'Capability: Knowledge, skills, physical ability',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'sleep_opportunity',
        type: 'scale',
        category: 'com_b',
        question: 'How much opportunity do you have for better sleep?',
        subtitle: 'Opportunity: Environment, time, resources',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'sleep_motivation',
        type: 'scale',
        category: 'com_b',
        question: 'How motivated are you to improve your sleep?',
        subtitle: 'Motivation: Desire, intention, habits',
        min: 1,
        max: 10,
        weight: 0.15,
      },
    ],
  },

  diet: {
    pillarId: 'diet',
    pillarName: 'Diet & Nutrition',
    icon: '🥗',
    color: '#06D6A0',
    questions: [
      {
        id: 'diet_meals_per_day',
        type: 'number',
        category: 'behavioral',
        question: 'How many balanced meals do you eat per day on average?',
        min: 0,
        max: 6,
        step: 1,
        weight: 0.2,
      },
      {
        id: 'diet_hydration',
        type: 'scale',
        category: 'physiological',
        question: 'How would you rate your daily water intake?',
        subtitle: '1 = Very Poor, 10 = Excellent (8+ glasses)',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'diet_variety',
        type: 'scale',
        category: 'behavioral',
        question: 'How varied and balanced is your diet?',
        subtitle: 'Fruits, vegetables, proteins, whole grains',
        min: 1,
        max: 10,
        weight: 0.2,
      },
      {
        id: 'diet_mindful_eating',
        type: 'scale',
        category: 'psychological',
        question: 'How often do you practice mindful eating?',
        subtitle: 'Eating slowly, without distractions, listening to hunger cues',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'diet_capability',
        type: 'scale',
        category: 'com_b',
        question: 'How capable do you feel to make healthy food choices?',
        subtitle: 'Knowledge of nutrition, cooking skills',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'diet_opportunity',
        type: 'scale',
        category: 'com_b',
        question: 'How much opportunity do you have for healthy eating?',
        subtitle: 'Access to healthy food, time to prepare meals',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'diet_motivation',
        type: 'scale',
        category: 'com_b',
        question: 'How motivated are you to improve your diet?',
        min: 1,
        max: 10,
        weight: 0.1,
      },
    ],
  },

  exercise: {
    pillarId: 'exercise',
    pillarName: 'Exercise & Movement',
    icon: '💪',
    color: '#FF6B35',
    questions: [
      {
        id: 'exercise_frequency',
        type: 'number',
        category: 'behavioral',
        question: 'How many days per week do you exercise?',
        min: 0,
        max: 7,
        step: 1,
        unit: 'days',
        weight: 0.25,
      },
      {
        id: 'exercise_duration',
        type: 'number',
        category: 'behavioral',
        question: 'Average duration of each exercise session?',
        placeholder: '30',
        min: 0,
        max: 180,
        step: 5,
        unit: 'minutes',
        weight: 0.2,
      },
      {
        id: 'exercise_intensity',
        type: 'scale',
        category: 'physiological',
        question: 'What is your typical exercise intensity?',
        subtitle: '1 = Light (walking), 10 = Vigorous (HIIT, running)',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'exercise_enjoyment',
        type: 'scale',
        category: 'psychological',
        question: 'How much do you enjoy physical activity?',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'exercise_capability',
        type: 'scale',
        category: 'com_b',
        question: 'How capable do you feel to maintain an exercise routine?',
        subtitle: 'Physical fitness, knowledge of exercises',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'exercise_opportunity',
        type: 'scale',
        category: 'com_b',
        question: 'How much opportunity do you have for regular exercise?',
        subtitle: 'Time, facilities, equipment access',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'exercise_motivation',
        type: 'scale',
        category: 'com_b',
        question: 'How motivated are you to exercise regularly?',
        min: 1,
        max: 10,
        weight: 0.05,
      },
    ],
  },

  physical_health: {
    pillarId: 'physical_health',
    pillarName: 'Physical Health',
    icon: '🏥',
    color: '#EF476F',
    questions: [
      {
        id: 'physical_energy',
        type: 'scale',
        category: 'physiological',
        question: 'How would you rate your daily energy levels?',
        subtitle: '1 = Always exhausted, 10 = Always energized',
        min: 1,
        max: 10,
        weight: 0.25,
      },
      {
        id: 'physical_pain',
        type: 'scale',
        category: 'physiological',
        question: 'How often do you experience physical pain or discomfort?',
        subtitle: '1 = Daily/Severe, 10 = Never/None',
        min: 1,
        max: 10,
        weight: 0.2,
      },
      {
        id: 'physical_checkups',
        type: 'scale',
        category: 'behavioral',
        question: 'How regularly do you attend health check-ups and screenings?',
        subtitle: '1 = Never, 10 = Always on schedule',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'physical_recovery',
        type: 'scale',
        category: 'physiological',
        question: 'How well does your body recover from illness or exertion?',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'physical_capability',
        type: 'scale',
        category: 'com_b',
        question: 'How capable do you feel to manage your physical health?',
        subtitle: 'Knowledge, access to healthcare',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'physical_opportunity',
        type: 'scale',
        category: 'com_b',
        question: 'How much opportunity do you have for preventive care?',
        subtitle: 'Healthcare access, insurance, time',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'physical_motivation',
        type: 'scale',
        category: 'com_b',
        question: 'How motivated are you to prioritize your physical health?',
        min: 1,
        max: 10,
        weight: 0.05,
      },
    ],
  },

  mental_health: {
    pillarId: 'mental_health',
    pillarName: 'Mental Health',
    icon: '🧠',
    color: '#7C3AED',
    questions: [
      {
        id: 'mental_mood',
        type: 'scale',
        category: 'psychological',
        question: 'How would you rate your overall mood in recent weeks?',
        subtitle: '1 = Very low/depressed, 10 = Very positive/happy',
        min: 1,
        max: 10,
        weight: 0.25,
      },
      {
        id: 'mental_stress',
        type: 'scale',
        category: 'psychological',
        question: 'How would you rate your stress levels?',
        subtitle: '1 = Overwhelming stress, 10 = Completely calm',
        min: 1,
        max: 10,
        weight: 0.2,
      },
      {
        id: 'mental_anxiety',
        type: 'scale',
        category: 'psychological',
        question: 'How often do you experience anxiety or worry?',
        subtitle: '1 = Constantly, 10 = Never',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'mental_coping',
        type: 'scale',
        category: 'behavioral',
        question: 'How well do you cope with difficult emotions?',
        subtitle: 'Healthy coping strategies, emotional regulation',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'mental_mindfulness',
        type: 'scale',
        category: 'behavioral',
        question: 'How often do you practice mindfulness or meditation?',
        subtitle: '1 = Never, 10 = Daily practice',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'mental_capability',
        type: 'scale',
        category: 'com_b',
        question: 'How capable do you feel to manage your mental health?',
        subtitle: 'Coping skills, awareness, support',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'mental_opportunity',
        type: 'scale',
        category: 'com_b',
        question: 'How much opportunity do you have for mental health support?',
        subtitle: 'Access to therapy, time for self-care',
        min: 1,
        max: 10,
        weight: 0.05,
      },
    ],
  },

  finances: {
    pillarId: 'finances',
    pillarName: 'Financial Wellness',
    icon: '💰',
    color: '#FFD60A',
    questions: [
      {
        id: 'finance_stress',
        type: 'scale',
        category: 'psychological',
        question: 'How stressed do you feel about your finances?',
        subtitle: '1 = Extremely stressed, 10 = Not stressed at all',
        min: 1,
        max: 10,
        weight: 0.25,
      },
      {
        id: 'finance_budget',
        type: 'scale',
        category: 'behavioral',
        question: 'How well do you track and manage your budget?',
        subtitle: '1 = No tracking, 10 = Detailed tracking',
        min: 1,
        max: 10,
        weight: 0.2,
      },
      {
        id: 'finance_savings',
        type: 'scale',
        category: 'behavioral',
        question: 'How consistently do you save money?',
        subtitle: '1 = Never save, 10 = Save regularly',
        min: 1,
        max: 10,
        weight: 0.2,
      },
      {
        id: 'finance_security',
        type: 'scale',
        category: 'psychological',
        question: 'How financially secure do you feel?',
        subtitle: 'Emergency fund, stable income, manageable debt',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'finance_capability',
        type: 'scale',
        category: 'com_b',
        question: 'How capable do you feel to manage your finances?',
        subtitle: 'Financial literacy, planning skills',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'finance_opportunity',
        type: 'scale',
        category: 'com_b',
        question: 'How much opportunity do you have for financial growth?',
        subtitle: 'Income potential, investment opportunities',
        min: 1,
        max: 10,
        weight: 0.05,
      },
      {
        id: 'finance_motivation',
        type: 'scale',
        category: 'com_b',
        question: 'How motivated are you to improve your financial health?',
        min: 1,
        max: 10,
        weight: 0.05,
      },
    ],
  },

  social: {
    pillarId: 'social',
    pillarName: 'Social Connections',
    icon: '👥',
    color: '#06FFA5',
    questions: [
      {
        id: 'social_connections',
        type: 'scale',
        category: 'behavioral',
        question: 'How satisfied are you with your social connections?',
        subtitle: 'Quality and quantity of relationships',
        min: 1,
        max: 10,
        weight: 0.25,
      },
      {
        id: 'social_frequency',
        type: 'scale',
        category: 'behavioral',
        question: 'How often do you engage in meaningful social activities?',
        subtitle: '1 = Rarely/Never, 10 = Very frequently',
        min: 1,
        max: 10,
        weight: 0.2,
      },
      {
        id: 'social_loneliness',
        type: 'scale',
        category: 'psychological',
        question: 'How often do you feel lonely?',
        subtitle: '1 = Always lonely, 10 = Never lonely',
        min: 1,
        max: 10,
        weight: 0.2,
      },
      {
        id: 'social_support',
        type: 'scale',
        category: 'psychological',
        question: 'How supported do you feel by friends and family?',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'social_capability',
        type: 'scale',
        category: 'com_b',
        question: 'How capable do you feel to build and maintain relationships?',
        subtitle: 'Social skills, confidence',
        min: 1,
        max: 10,
        weight: 0.1,
      },
      {
        id: 'social_opportunity',
        type: 'scale',
        category: 'com_b',
        question: 'How much opportunity do you have for social connection?',
        subtitle: 'Time, social environments, communities',
        min: 1,
        max: 10,
        weight: 0.05,
      },
      {
        id: 'social_motivation',
        type: 'scale',
        category: 'com_b',
        question: 'How motivated are you to nurture your social life?',
        min: 1,
        max: 10,
        weight: 0.05,
      },
    ],
  },

  spirituality: {
    pillarId: 'spirituality',
    pillarName: 'Spirituality & Purpose',
    icon: '✨',
    color: '#C77DFF',
    questions: [
      {
        id: 'spiritual_purpose',
        type: 'scale',
        category: 'psychological',
        question: 'How clear are you about your life purpose and values?',
        subtitle: '1 = Very unclear, 10 = Very clear',
        min: 1,
        max: 10,
        weight: 0.25,
      },
      {
        id: 'spiritual_meaning',
        type: 'scale',
        category: 'psychological',
        question: 'How meaningful does your life feel?',
        subtitle: 'Sense of meaning and fulfillment',
        min: 1,
        max: 10,
        weight: 0.2,
      },
      {
        id: 'spiritual_gratitude',
        type: 'scale',
        category: 'behavioral',
        question: 'How often do you practice gratitude?',
        subtitle: '1 = Never, 10 = Daily practice',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'spiritual_reflection',
        type: 'scale',
        category: 'behavioral',
        question: 'How often do you engage in reflection or contemplation?',
        subtitle: 'Journaling, prayer, meditation, nature walks',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'spiritual_alignment',
        type: 'scale',
        category: 'psychological',
        question: 'How aligned are your daily actions with your core values?',
        min: 1,
        max: 10,
        weight: 0.15,
      },
      {
        id: 'spiritual_capability',
        type: 'scale',
        category: 'com_b',
        question: 'How capable do you feel to explore spiritual growth?',
        subtitle: 'Self-awareness, reflection skills',
        min: 1,
        max: 10,
        weight: 0.05,
      },
      {
        id: 'spiritual_opportunity',
        type: 'scale',
        category: 'com_b',
        question: 'How much opportunity do you have for spiritual practice?',
        subtitle: 'Time for reflection, supportive community',
        min: 1,
        max: 10,
        weight: 0.05,
      },
    ],
  },
};

/**
 * Get all questions flattened
 */
export const getAllQuestions = () => {
  const allQuestions = [];
  Object.values(onboardingQuestions).forEach(pillar => {
    pillar.questions.forEach(q => {
      allQuestions.push({
        ...q,
        pillarId: pillar.pillarId,
        pillarName: pillar.pillarName,
      });
    });
  });
  return allQuestions;
};

/**
 * Get questions by pillar
 */
export const getQuestionsByPillar = (pillarId) => {
  return onboardingQuestions[pillarId] || null;
};

/**
 * Get COM-B questions only
 */
export const getCOMBQuestions = () => {
  const combQuestions = [];
  Object.values(onboardingQuestions).forEach(pillar => {
    const combs = pillar.questions.filter(q => q.category === 'com_b');
    combQuestions.push({
      pillarId: pillar.pillarId,
      pillarName: pillar.pillarName,
      questions: combs,
    });
  });
  return combQuestions;
};

/**
 * Calculate baseline score from onboarding responses
 */
export const calculateOnboardingScore = (pillarId, responses) => {
  const pillar = onboardingQuestions[pillarId];
  if (!pillar) return 0;

  let totalScore = 0;
  let totalWeight = 0;

  pillar.questions.forEach(question => {
    const response = responses[question.id];
    if (response !== undefined && response !== null) {
      const normalizedScore = (response / 10) * 100; // Convert to 0-100 scale
      totalScore += normalizedScore * question.weight;
      totalWeight += question.weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};

/**
 * Calculate all baseline scores
 */
export const calculateAllOnboardingScores = (allResponses) => {
  const scores = {};
  Object.keys(onboardingQuestions).forEach(pillarId => {
    scores[pillarId] = calculateOnboardingScore(pillarId, allResponses);
  });
  return scores;
};

export default onboardingQuestions;
