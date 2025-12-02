/**
 * AI Coach Message Generator
 * Uses CBT, habit formation principles, and motivational interviewing
 * to provide personalized, actionable coaching messages
 */

/**
 * Generate personalized coaching message based on pillar, score, and user state
 * @param {Object} params - Message generation parameters
 * @param {string} params.pillarName - Name of the pillar (e.g., 'Sleep', 'Diet')
 * @param {string} params.pillarId - Pillar identifier (e.g., 'sleep', 'diet')
 * @param {number} params.score - Current pillar score (0-100)
 * @param {Object} params.userState - User's current state and context
 * @param {number} params.userState.streak - Current streak days
 * @param {string} params.userState.timeOfDay - 'morning' | 'afternoon' | 'evening' | 'night'
 * @param {Array} params.userState.recentActivity - Recent user activity in this pillar
 * @param {Object} params.userState.barriers - Identified barriers from COM-B assessment
 * @param {number} params.previousScore - Previous score for comparison (optional)
 * @returns {Object} Coaching message with actions
 */
export const generateCoachingMessage = ({
  pillarName,
  pillarId,
  score,
  userState = {},
  previousScore = null,
}) => {
  const {
    streak = 0,
    timeOfDay = 'morning',
    recentActivity = [],
    barriers = {},
  } = userState;

  // Determine score category
  const scoreCategory = getScoreCategory(score);
  
  // Determine trend
  const trend = previousScore !== null ? getTrend(score, previousScore) : 'stable';

  // Generate contextual greeting
  const greeting = generateGreeting(timeOfDay, streak);

  // Generate main message based on pillar, score, and trend
  const mainMessage = generateMainMessage(pillarId, pillarName, score, scoreCategory, trend);

  // Generate CBT-based reframe if needed
  const cognitiveReframe = generateCognitiveReframe(pillarId, scoreCategory, barriers);

  // Generate micro-actions (habit formation principle: make it easy)
  const microActions = generateMicroActions(pillarId, scoreCategory, timeOfDay, barriers);

  // Generate motivational close
  const motivationalClose = generateMotivationalClose(scoreCategory, trend, streak);

  return {
    greeting,
    mainMessage,
    cognitiveReframe,
    microActions,
    motivationalClose,
    tone: getTone(scoreCategory),
    pillarId,
    pillarName,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Categorize score into performance bands
 */
const getScoreCategory = (score) => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'needs_improvement';
  return 'critical';
};

/**
 * Determine trend between current and previous score
 */
const getTrend = (current, previous) => {
  const diff = current - previous;
  if (diff >= 10) return 'improving_significantly';
  if (diff >= 5) return 'improving';
  if (diff <= -10) return 'declining_significantly';
  if (diff <= -5) return 'declining';
  return 'stable';
};

/**
 * Generate contextual greeting based on time and streak
 */
const generateGreeting = (timeOfDay, streak) => {
  const timeGreetings = {
    morning: ['Good morning', 'Morning', 'Rise and shine'],
    afternoon: ['Good afternoon', 'Hey there', 'Hello'],
    evening: ['Good evening', 'Evening', 'Hey'],
    night: ['Good evening', 'Hey night owl', 'Hello'],
  };

  const greetingOptions = timeGreetings[timeOfDay] || timeGreetings.morning;
  const greeting = greetingOptions[Math.floor(Math.random() * greetingOptions.length)];

  if (streak >= 7) {
    return `${greeting}! 🔥 ${streak} day streak - you're crushing it!`;
  } else if (streak >= 3) {
    return `${greeting}! Keep that ${streak} day momentum going!`;
  }
  
  return `${greeting}!`;
};

/**
 * Generate main coaching message
 */
const generateMainMessage = (pillarId, pillarName, score, category, trend) => {
  const messages = PILLAR_MESSAGES[pillarId] || PILLAR_MESSAGES.default;
  const categoryMessages = messages[category] || messages.fair;

  let baseMessage = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];

  // Add trend-specific context
  if (trend === 'improving_significantly') {
    baseMessage += " You've made impressive progress lately - that's real momentum! 📈";
  } else if (trend === 'improving') {
    baseMessage += " I'm seeing positive changes in your habits. Keep it up! ✨";
  } else if (trend === 'declining') {
    baseMessage += " I noticed a small dip. Let's explore what's getting in the way.";
  } else if (trend === 'declining_significantly') {
    baseMessage += " I see you're facing some challenges. That's okay - let's work through this together.";
  }

  return baseMessage;
};

/**
 * Generate cognitive reframe using CBT principles
 */
const generateCognitiveReframe = (pillarId, category, barriers) => {
  if (category === 'excellent' || category === 'good') return null;

  const reframes = COGNITIVE_REFRAMES[pillarId] || COGNITIVE_REFRAMES.default;
  
  // Check for specific barriers
  if (barriers.capability === 'low') {
    return reframes.capability[Math.floor(Math.random() * reframes.capability.length)];
  }
  if (barriers.opportunity === 'low') {
    return reframes.opportunity[Math.floor(Math.random() * reframes.opportunity.length)];
  }
  if (barriers.motivation === 'low') {
    return reframes.motivation[Math.floor(Math.random() * reframes.motivation.length)];
  }

  return reframes.general[Math.floor(Math.random() * reframes.general.length)];
};

/**
 * Generate micro-actions (tiny habits principle)
 */
const generateMicroActions = (pillarId, category, timeOfDay, barriers) => {
  const actions = MICRO_ACTIONS[pillarId] || MICRO_ACTIONS.default;
  
  // Select appropriate actions based on category and time
  let availableActions = actions[category] || actions.fair;
  
  // Filter by time-appropriate actions
  availableActions = availableActions.filter(action => {
    if (action.preferredTime) {
      return action.preferredTime.includes(timeOfDay);
    }
    return true;
  });

  // Prioritize based on barriers
  if (barriers.capability === 'low') {
    availableActions = availableActions.filter(a => a.complexity === 'very_easy' || a.complexity === 'easy');
  }

  // Return 2-3 micro-actions
  const selectedCount = category === 'critical' ? 2 : 3;
  return shuffleArray(availableActions).slice(0, selectedCount);
};

/**
 * Generate motivational closing statement
 */
const generateMotivationalClose = (category, trend, streak) => {
  if (category === 'excellent') {
    return "You're an inspiration! Keep setting that example. 🌟";
  }
  
  if (category === 'good' && trend === 'improving') {
    return "You're building something real here. One day at a time. 💪";
  }

  if (category === 'fair') {
    return "Small steps lead to big changes. You've got this! 🚀";
  }

  if (streak >= 3) {
    return "Your consistency is your superpower. Keep showing up! ⭐";
  }

  return "Progress isn't linear, but you're moving forward. I believe in you! 💙";
};

/**
 * Get tone based on score category
 */
const getTone = (category) => {
  const tones = {
    excellent: 'celebratory',
    good: 'encouraging',
    fair: 'supportive',
    needs_improvement: 'compassionate',
    critical: 'gentle',
  };
  return tones[category] || 'supportive';
};

/**
 * Pillar-specific messages by category
 */
const PILLAR_MESSAGES = {
  sleep: {
    excellent: [
      "Your sleep routine is stellar! Quality rest is fueling everything else you do.",
      "You're sleeping like a champion. This is the foundation for peak performance.",
    ],
    good: [
      "Your sleep is on track. Let's fine-tune it to unlock even more energy.",
      "Solid sleep habits! A few tweaks could make this even better.",
    ],
    fair: [
      "Your sleep could use some attention. Let's build a routine that works for you.",
      "Sleep is the ultimate recovery tool. Let's explore what's disrupting yours.",
    ],
    needs_improvement: [
      "I know sleep can be tough. Let's start with one small change tonight.",
      "Poor sleep affects everything. Let's tackle this together, one night at a time.",
    ],
    critical: [
      "Sleep deprivation is serious. Let's focus on the most essential step first.",
      "Your body needs rest. Let's create a simple plan you can start tonight.",
    ],
  },
  
  diet: {
    excellent: [
      "Your nutrition is outstanding! You're fueling your body like a pro.",
      "Your food choices are powering your wellbeing. Keep nourishing yourself!",
    ],
    good: [
      "You're making healthy choices! Let's explore how to make them even more sustainable.",
      "Your diet is pretty solid. Small tweaks can amplify the benefits.",
    ],
    fair: [
      "Your nutrition needs some love. Let's start with one meal at a time.",
      "Healthy eating doesn't have to be perfect. Let's find what works for you.",
    ],
    needs_improvement: [
      "I see nutrition is challenging right now. Let's focus on just one simple upgrade.",
      "Food is medicine. Let's start with tiny, doable changes.",
    ],
    critical: [
      "Let's address the basics first. Even small nutrition improvements matter.",
      "Your diet needs attention. Let's start with the easiest win today.",
    ],
  },

  exercise: {
    excellent: [
      "Your movement practice is inspiring! Your body is thanking you.",
      "You're crushing your fitness goals! This consistency is powerful.",
    ],
    good: [
      "You're staying active - that's huge! Let's optimize for sustainability.",
      "Great movement habits! Let's keep this momentum going long-term.",
    ],
    fair: [
      "Movement is medicine, and you're making progress. Let's make it easier to maintain.",
      "Exercise doesn't have to be intense to count. Let's find your sustainable rhythm.",
    ],
    needs_improvement: [
      "Moving your body is hard when motivation is low. Let's start tiny.",
      "Any movement is better than none. What feels doable today?",
    ],
    critical: [
      "Let's get you moving again, even if it's just 5 minutes. Baby steps count.",
      "Your body wants to move. Let's start with the smallest possible action.",
    ],
  },

  physical_health: {
    excellent: [
      "Your physical health is thriving! You're taking great care of yourself.",
      "You're in great physical shape. Keep prioritizing your wellbeing!",
    ],
    good: [
      "Your body is doing well! Let's maintain this and prevent issues.",
      "You're taking care of yourself. Consistency here pays huge dividends.",
    ],
    fair: [
      "Your physical health needs some attention. Let's focus on prevention.",
      "Small health investments now prevent big problems later. Let's start.",
    ],
    needs_improvement: [
      "I notice some physical concerns. Let's address the most important one first.",
      "Your body is telling you something. Let's listen and respond gently.",
    ],
    critical: [
      "Your health needs immediate attention. Let's focus on the most urgent step.",
      "Please prioritize your physical wellbeing. Let's start with one action today.",
    ],
  },

  mental_health: {
    excellent: [
      "Your mental health is flourishing! You're doing the inner work beautifully.",
      "Your emotional wellbeing is strong. This is the foundation of everything.",
    ],
    good: [
      "Your mental health is solid. Let's keep nurturing your emotional resilience.",
      "You're managing your inner world well. Consistency is key here.",
    ],
    fair: [
      "Mental health needs care just like physical health. Let's strengthen yours.",
      "I see you're working through some challenges. That takes real courage.",
    ],
    needs_improvement: [
      "Mental health struggles are real. Let's focus on one coping tool today.",
      "You're not alone in this. Let's take the tiniest step toward feeling better.",
    ],
    critical: [
      "I'm concerned about your mental health. Please reach out for professional support.",
      "Your wellbeing matters. Let's connect you with resources and start small.",
    ],
  },

  finances: {
    excellent: [
      "Your financial health is excellent! This security supports everything else.",
      "You're managing money wisely. Financial peace of mind is priceless.",
    ],
    good: [
      "Your finances are on track. Let's optimize and plan for the future.",
      "You're making smart money moves. Keep building that security.",
    ],
    fair: [
      "Financial wellness is a journey. Let's strengthen your foundation.",
      "Money stress is real. Let's create a simple plan you can stick with.",
    ],
    needs_improvement: [
      "Financial challenges are overwhelming. Let's focus on one small action.",
      "Money can feel scary, but small steps add up. Let's start today.",
    ],
    critical: [
      "Financial stress affects everything. Let's address the most urgent issue first.",
      "You need financial support. Let's connect you with resources and take action.",
    ],
  },

  social: {
    excellent: [
      "Your social connections are thriving! Relationships are your superpower.",
      "You're nurturing meaningful connections. This is vital to wellbeing.",
    ],
    good: [
      "Your social life is healthy! Let's maintain these valuable relationships.",
      "You're connecting well with others. Keep investing in these bonds.",
    ],
    fair: [
      "Social connection needs attention. Let's explore ways to deepen relationships.",
      "Humans need community. Let's find your people and strengthen those ties.",
    ],
    needs_improvement: [
      "Loneliness is tough. Let's take one small step toward connection today.",
      "Social anxiety is real, but you deserve connection. Let's start tiny.",
    ],
    critical: [
      "Isolation affects health deeply. Let's create one small connection opportunity.",
      "You need support and connection. Let's start with the easiest first step.",
    ],
  },

  spirituality: {
    excellent: [
      "Your spiritual life is rich and meaningful. This purpose guides everything.",
      "You're deeply connected to your values and purpose. Beautiful work.",
    ],
    good: [
      "Your spiritual practice is solid. Let's deepen this connection to purpose.",
      "You're living with intention. Keep nurturing this meaningful foundation.",
    ],
    fair: [
      "Spiritual connection needs cultivation. Let's explore what brings you meaning.",
      "Purpose and values guide wellbeing. Let's clarify yours together.",
    ],
    needs_improvement: [
      "Feeling disconnected from purpose is hard. Let's explore what matters most to you.",
      "Spiritual wellness is personal. Let's discover what brings you meaning.",
    ],
    critical: [
      "A sense of purpose is vital. Let's start by exploring your core values.",
      "Meaning-making is essential to wellbeing. Let's take the first tiny step.",
    ],
  },

  default: {
    excellent: ["You're doing amazing work here!"],
    good: ["You're making great progress!"],
    fair: ["Let's work on this together."],
    needs_improvement: ["Let's start with one small step."],
    critical: ["Let's address this with care and compassion."],
  },
};

/**
 * CBT-based cognitive reframes by barrier type
 */
const COGNITIVE_REFRAMES = {
  sleep: {
    capability: [
      "💡 Reframe: You may think 'I'm bad at sleeping,' but sleep is a skill you can learn. Your body wants to rest - let's work with it.",
    ],
    opportunity: [
      "💡 Reframe: 'I don't have time for sleep' often means we're prioritizing other things. What if sleep was your productivity superpower?",
    ],
    motivation: [
      "💡 Reframe: Notice how you feel after good sleep vs. poor sleep. Your future self will thank you for prioritizing rest tonight.",
    ],
    general: [
      "💡 Reframe: Sleep isn't lazy - it's when your body and brain do essential repair work.",
    ],
  },
  
  diet: {
    capability: [
      "💡 Reframe: You don't need to be a chef to eat well. Start with simple, whole foods you enjoy.",
    ],
    opportunity: [
      "💡 Reframe: 'Healthy food is too expensive' - but poor health is more expensive. Small investments in nutrition pay huge dividends.",
    ],
    motivation: [
      "💡 Reframe: You're not 'giving up' foods you love - you're adding foods that help you feel amazing.",
    ],
    general: [
      "💡 Reframe: Food is information for your body, not just calories. Choose messages of energy and vitality.",
    ],
  },

  exercise: {
    capability: [
      "💡 Reframe: You don't need to be athletic to move your body. Any movement counts.",
    ],
    opportunity: [
      "💡 Reframe: 'I don't have time to exercise' - but 10 minutes counts. What if you moved while doing other things?",
    ],
    motivation: [
      "💡 Reframe: Exercise isn't punishment for what you ate - it's celebration of what your body can do.",
    ],
    general: [
      "💡 Reframe: Your body was made to move. Find movement that feels good, not just what burns calories.",
    ],
  },

  mental_health: {
    capability: [
      "💡 Reframe: Mental health struggles don't mean you're broken. You're human, and you deserve support.",
    ],
    opportunity: [
      "💡 Reframe: 'I can't afford therapy' - but there are free resources, hotlines, and apps. Help is available.",
    ],
    motivation: [
      "💡 Reframe: Taking care of your mental health isn't selfish - it's essential. You can't pour from an empty cup.",
    ],
    general: [
      "💡 Reframe: You don't have to feel better to get better. Taking action, even when hard, creates change.",
    ],
  },

  finances: {
    capability: [
      "💡 Reframe: You don't need to be a finance expert. Basic money skills are learnable.",
    ],
    opportunity: [
      "💡 Reframe: 'I'll never get ahead' is a thought, not a fact. Small consistent actions compound over time.",
    ],
    motivation: [
      "💡 Reframe: Financial security isn't about being rich - it's about reducing stress and creating options.",
    ],
    general: [
      "💡 Reframe: Where you are financially today doesn't define where you'll be tomorrow. You have more power than you think.",
    ],
  },

  social: {
    capability: [
      "💡 Reframe: Social skills can be learned. Everyone feels awkward sometimes - you're not alone.",
    ],
    opportunity: [
      "💡 Reframe: 'No one wants to be my friend' is anxiety talking, not reality. People are often looking for connection too.",
    ],
    motivation: [
      "💡 Reframe: Vulnerability feels risky, but it's also the path to authentic connection. You're brave for trying.",
    ],
    general: [
      "💡 Reframe: Quality matters more than quantity in relationships. A few deep connections nourish more than many shallow ones.",
    ],
  },

  spirituality: {
    capability: [
      "💡 Reframe: You don't need religion to be spiritual. Meaning and purpose are personal discoveries.",
    ],
    opportunity: [
      "💡 Reframe: 'I don't have time for reflection' - but even 2 minutes of gratitude counts. Micro-moments matter.",
    ],
    motivation: [
      "💡 Reframe: Living with purpose isn't about grand gestures - it's about small daily choices aligned with your values.",
    ],
    general: [
      "💡 Reframe: Feeling lost is part of the journey of finding meaning. Exploration itself has value.",
    ],
  },

  default: {
    capability: ["💡 You have more capability than you think. Skills can be learned."],
    opportunity: ["💡 Opportunities exist - sometimes we need to look differently to see them."],
    motivation: ["💡 Motivation follows action. Start tiny, and feelings will follow."],
    general: ["💡 Your thoughts aren't facts. Challenge them with compassion."],
  },
};

/**
 * Micro-actions by pillar and difficulty
 */
const MICRO_ACTIONS = {
  sleep: {
    excellent: [
      { text: 'Track your sleep quality tonight', duration: '2 min', complexity: 'very_easy' },
      { text: 'Share your sleep routine with a friend', duration: '5 min', complexity: 'easy' },
      { text: 'Optimize your sleep environment (darker/cooler)', duration: '10 min', complexity: 'easy' },
    ],
    good: [
      { text: 'Go to bed 15 minutes earlier tonight', duration: '15 min', complexity: 'easy', preferredTime: ['evening', 'night'] },
      { text: 'Put your phone away 30 min before bed', duration: '30 min', complexity: 'medium', preferredTime: ['evening', 'night'] },
      { text: 'Do a 5-minute wind-down breathing exercise', duration: '5 min', complexity: 'easy', preferredTime: ['evening', 'night'] },
    ],
    fair: [
      { text: 'Set a bedtime alarm for tonight', duration: '1 min', complexity: 'very_easy' },
      { text: 'Remove screens from bedroom', duration: '5 min', complexity: 'easy' },
      { text: 'Write down 3 things on your mind before bed', duration: '3 min', complexity: 'very_easy', preferredTime: ['evening', 'night'] },
    ],
    needs_improvement: [
      { text: 'Commit to one consistent wake-up time', duration: '1 min', complexity: 'very_easy' },
      { text: 'Take a 10-minute walk today (helps sleep tonight)', duration: '10 min', complexity: 'easy', preferredTime: ['morning', 'afternoon'] },
      { text: 'Avoid caffeine after 2pm today', duration: 'all day', complexity: 'easy' },
    ],
    critical: [
      { text: 'Lie down for 10 minutes right now, even if you don't sleep', duration: '10 min', complexity: 'very_easy' },
      { text: 'Contact your doctor about sleep issues', duration: '10 min', complexity: 'medium' },
    ],
  },

  diet: {
    excellent: [
      { text: 'Try one new healthy recipe this week', duration: '30 min', complexity: 'medium' },
      { text: 'Prep one healthy snack for tomorrow', duration: '5 min', complexity: 'easy' },
      { text: 'Share your favorite healthy meal with someone', duration: '5 min', complexity: 'easy' },
    ],
    good: [
      { text: 'Add one serving of vegetables to lunch today', duration: '5 min', complexity: 'easy', preferredTime: ['morning', 'afternoon'] },
      { text: 'Drink a glass of water right now', duration: '1 min', complexity: 'very_easy' },
      { text: 'Plan tomorrow's meals for 5 minutes', duration: '5 min', complexity: 'easy', preferredTime: ['evening'] },
    ],
    fair: [
      { text: 'Replace one processed snack with fruit today', duration: '2 min', complexity: 'very_easy' },
      { text: 'Eat one meal without screens today', duration: '20 min', complexity: 'easy' },
      { text: 'Buy one new healthy food item at the store', duration: '5 min', complexity: 'easy' },
    ],
    needs_improvement: [
      { text: 'Eat breakfast tomorrow, anything counts', duration: '10 min', complexity: 'very_easy', preferredTime: ['morning'] },
      { text: 'Add protein to your next meal', duration: '5 min', complexity: 'easy' },
      { text: 'Set a reminder to drink water every 2 hours', duration: '2 min', complexity: 'very_easy' },
    ],
    critical: [
      { text: 'Eat one balanced meal today - just one', duration: '20 min', complexity: 'easy' },
      { text: 'Drink 3 glasses of water before bed', duration: '5 min', complexity: 'very_easy' },
    ],
  },

  exercise: {
    excellent: [
      { text: 'Try a new type of workout this week', duration: '30 min', complexity: 'medium' },
      { text: 'Do a 5-minute mobility flow right now', duration: '5 min', complexity: 'easy' },
      { text: 'Track your workout in your journal', duration: '3 min', complexity: 'very_easy' },
    ],
    good: [
      { text: 'Add 10 minutes to your next workout', duration: '10 min', complexity: 'easy' },
      { text: 'Do 20 squats right now', duration: '2 min', complexity: 'easy' },
      { text: 'Schedule your next 3 workouts in your calendar', duration: '5 min', complexity: 'easy' },
    ],
    fair: [
      { text: 'Take a 10-minute walk after your next meal', duration: '10 min', complexity: 'very_easy', preferredTime: ['morning', 'afternoon', 'evening'] },
      { text: 'Do 10 push-ups (modified is fine!)', duration: '2 min', complexity: 'easy' },
      { text: 'Dance to one song right now', duration: '3 min', complexity: 'very_easy' },
    ],
    needs_improvement: [
      { text: 'Stand up and stretch for 1 minute right now', duration: '1 min', complexity: 'very_easy' },
      { text: 'Take the stairs instead of elevator once today', duration: '2 min', complexity: 'very_easy' },
      { text: 'Walk around your home for 5 minutes', duration: '5 min', complexity: 'very_easy' },
    ],
    critical: [
      { text: 'Move your body for just 2 minutes - any movement', duration: '2 min', complexity: 'very_easy' },
      { text: 'Do 5 seated leg raises right now', duration: '1 min', complexity: 'very_easy' },
    ],
  },

  physical_health: {
    excellent: [
      { text: 'Schedule your annual check-up', duration: '5 min', complexity: 'easy' },
      { text: 'Do a body scan - notice how you feel physically', duration: '3 min', complexity: 'easy' },
      { text: 'Update your health journal', duration: '5 min', complexity: 'easy' },
    ],
    good: [
      { text: 'Take your vitamins/medications if you have them', duration: '1 min', complexity: 'very_easy' },
      { text: 'Stretch for 5 minutes to release tension', duration: '5 min', complexity: 'easy' },
      { text: 'Check in: any pain or discomfort to address?', duration: '2 min', complexity: 'very_easy' },
    ],
    fair: [
      { text: 'Make one healthcare appointment you've been avoiding', duration: '10 min', complexity: 'medium' },
      { text: 'Take 10 deep breaths right now', duration: '2 min', complexity: 'very_easy' },
      { text: 'Research one health concern you have', duration: '15 min', complexity: 'easy' },
    ],
    needs_improvement: [
      { text: 'List your current health concerns to discuss with a doctor', duration: '5 min', complexity: 'easy' },
      { text: 'Apply ice or heat to any area of pain', duration: '10 min', complexity: 'easy' },
      { text: 'Find a local clinic or health resource', duration: '10 min', complexity: 'medium' },
    ],
    critical: [
      { text: 'Call a doctor or urgent care today', duration: '10 min', complexity: 'medium' },
      { text: 'Ask someone for help with your health concern', duration: '5 min', complexity: 'medium' },
    ],
  },

  mental_health: {
    excellent: [
      { text: 'Practice gratitude - write 3 things you're thankful for', duration: '3 min', complexity: 'very_easy' },
      { text: 'Do a 10-minute meditation', duration: '10 min', complexity: 'easy' },
      { text: 'Journal about a recent positive experience', duration: '10 min', complexity: 'easy' },
    ],
    good: [
      { text: 'Take 5 mindful breaths right now', duration: '2 min', complexity: 'very_easy' },
      { text: 'Call or text someone who makes you smile', duration: '5 min', complexity: 'easy' },
      { text: 'Write down one worry, then challenge its truth', duration: '5 min', complexity: 'medium' },
    ],
    fair: [
      { text: 'Go outside for 5 minutes (nature helps mood)', duration: '5 min', complexity: 'very_easy' },
      { text: 'Listen to a calming song or sounds', duration: '5 min', complexity: 'very_easy' },
      { text: 'Name 3 emotions you're feeling right now (just notice)', duration: '2 min', complexity: 'easy' },
    ],
    needs_improvement: [
      { text: 'Text one person you trust: "I'm struggling today"', duration: '2 min', complexity: 'medium' },
      { text: 'Use a mental health app for 5 minutes', duration: '5 min', complexity: 'easy' },
      { text: 'Write down one small thing that went okay today', duration: '2 min', complexity: 'easy' },
    ],
    critical: [
      { text: 'Call a mental health hotline or text crisis line', duration: '10 min', complexity: 'medium' },
      { text: 'Find a therapist or counselor - just search, not book yet', duration: '15 min', complexity: 'medium' },
    ],
  },

  finances: {
    excellent: [
      { text: 'Review your investment accounts', duration: '10 min', complexity: 'medium' },
      { text: 'Update your budget with recent changes', duration: '15 min', complexity: 'medium' },
      { text: 'Plan one financial goal for next quarter', duration: '10 min', complexity: 'easy' },
    ],
    good: [
      { text: 'Check your account balances', duration: '3 min', complexity: 'very_easy' },
      { text: 'Transfer $5 to savings right now', duration: '2 min', complexity: 'very_easy' },
      { text: 'Review this week's spending', duration: '10 min', complexity: 'easy' },
    ],
    fair: [
      { text: 'List your monthly fixed expenses', duration: '10 min', complexity: 'easy' },
      { text: 'Cancel one subscription you don't use', duration: '5 min', complexity: 'easy' },
      { text: 'Set up one automatic payment to avoid late fees', duration: '10 min', complexity: 'medium' },
    ],
    needs_improvement: [
      { text: 'Open a basic checking or savings account if you don't have one', duration: '20 min', complexity: 'medium' },
      { text: 'Write down all your debts in one place', duration: '15 min', complexity: 'easy' },
      { text: 'Find one free financial literacy resource to read', duration: '10 min', complexity: 'easy' },
    ],
    critical: [
      { text: 'Contact a non-profit financial counselor (free)', duration: '15 min', complexity: 'medium' },
      { text: 'Call one creditor to discuss payment options', duration: '15 min', complexity: 'hard' },
    ],
  },

  social: {
    excellent: [
      { text: 'Plan a gathering with friends this month', duration: '10 min', complexity: 'medium' },
      { text: 'Send a heartfelt message to someone you appreciate', duration: '5 min', complexity: 'easy' },
      { text: 'Join a new social group or community', duration: '15 min', complexity: 'medium' },
    ],
    good: [
      { text: 'Reach out to one friend you haven't talked to recently', duration: '5 min', complexity: 'easy' },
      { text: 'Comment on a friend's social media post genuinely', duration: '2 min', complexity: 'very_easy' },
      { text: 'Schedule a call or hangout for this week', duration: '5 min', complexity: 'easy' },
    ],
    fair: [
      { text: 'Send a "thinking of you" text to one person', duration: '1 min', complexity: 'very_easy' },
      { text: 'Join one online community around your interest', duration: '10 min', complexity: 'easy' },
      { text: 'Smile and say hi to one stranger today', duration: '1 min', complexity: 'easy' },
    ],
    needs_improvement: [
      { text: 'List 3 people you'd like to connect with more', duration: '3 min', complexity: 'very_easy' },
      { text: 'Find one local meetup or event to attend', duration: '10 min', complexity: 'easy' },
      { text: 'Call one family member, even if brief', duration: '5 min', complexity: 'medium' },
    ],
    critical: [
      { text: 'Join one support group (online or in-person)', duration: '15 min', complexity: 'medium' },
      { text: 'Reach out to a crisis line if you feel isolated', duration: '10 min', complexity: 'medium' },
    ],
  },

  spirituality: {
    excellent: [
      { text: 'Spend 15 minutes in spiritual practice (prayer, meditation, nature)', duration: '15 min', complexity: 'easy' },
      { text: 'Journal about your life purpose and values', duration: '15 min', complexity: 'medium' },
      { text: 'Share your spiritual insights with someone', duration: '10 min', complexity: 'medium' },
    ],
    good: [
      { text: 'Practice gratitude - list 5 things right now', duration: '3 min', complexity: 'very_easy' },
      { text: 'Read something spiritually meaningful for 10 minutes', duration: '10 min', complexity: 'easy' },
      { text: 'Spend 5 minutes in silent reflection', duration: '5 min', complexity: 'easy' },
    ],
    fair: [
      { text: 'Write down your top 3 core values', duration: '5 min', complexity: 'easy' },
      { text: 'Spend 10 minutes in nature mindfully', duration: '10 min', complexity: 'easy' },
      { text: 'Ask yourself: What gives my life meaning?', duration: '5 min', complexity: 'medium' },
    ],
    needs_improvement: [
      { text: 'List 3 things that make you feel alive', duration: '3 min', complexity: 'easy' },
      { text: 'Watch or read something inspirational', duration: '15 min', complexity: 'easy' },
      { text: 'Try a 3-minute guided meditation (search YouTube)', duration: '3 min', complexity: 'easy' },
    ],
    critical: [
      { text: 'Reach out to a spiritual counselor or leader', duration: '15 min', complexity: 'medium' },
      { text: 'Write one sentence about what you want your life to mean', duration: '2 min', complexity: 'easy' },
    ],
  },

  default: {
    excellent: [
      { text: 'Keep up your great work today', duration: '1 min', complexity: 'very_easy' },
    ],
    good: [
      { text: 'Take one small action to maintain your progress', duration: '5 min', complexity: 'easy' },
    ],
    fair: [
      { text: 'Choose one small step forward today', duration: '5 min', complexity: 'easy' },
    ],
    needs_improvement: [
      { text: 'Take the tiniest action possible right now', duration: '2 min', complexity: 'very_easy' },
    ],
    critical: [
      { text: 'Reach out for help - you don't have to do this alone', duration: '10 min', complexity: 'medium' },
    ],
  },
};

/**
 * Utility: Shuffle array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate quick coaching tip (shorter version for notifications)
 */
export const generateQuickTip = (pillarId, score) => {
  const category = getScoreCategory(score);
  const messages = PILLAR_MESSAGES[pillarId] || PILLAR_MESSAGES.default;
  const options = messages[category] || messages.fair;
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Generate celebration message for achievements
 */
export const generateCelebrationMessage = (achievementType, pillarName, streak) => {
  const celebrations = {
    streak_milestone: [
      `🎉 ${streak} day streak in ${pillarName}! You're building something incredible!`,
      `🔥 ${streak} days strong! Your consistency is inspiring!`,
      `⭐ ${streak} day milestone! This is what transformation looks like!`,
    ],
    score_improvement: [
      `📈 Your ${pillarName} score improved! Growth is happening!`,
      `💪 Progress in ${pillarName}! Your efforts are paying off!`,
      `✨ ${pillarName} is trending up! Keep that momentum!`,
    ],
    completion: [
      `✅ ${pillarName} goal completed! You did it!`,
      `🎯 Crushed that ${pillarName} goal! Celebrate this win!`,
      `🏆 ${pillarName} achievement unlocked! You're amazing!`,
    ],
  };

  const options = celebrations[achievementType] || celebrations.completion;
  return options[Math.floor(Math.random() * options.length)];
};

export default {
  generateCoachingMessage,
  generateQuickTip,
  generateCelebrationMessage,
};
