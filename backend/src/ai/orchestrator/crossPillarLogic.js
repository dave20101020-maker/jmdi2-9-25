/**
 * Cross-Pillar Logic Engine
 * 
 * Models relationships between pillars:
 * - Poor sleep → reduce fitness difficulty
 * - Financial stress → sleep disruption
 * - Anxiety → nutrition challenges
 * - Lack of sleep → social withdrawal
 * - And more
 * 
 * Used to:
 * 1. Adjust agent recommendations based on other pillars
 * 2. Identify root causes across domains
 * 3. Suggest coordination between agents
 */

import Entry from '../../models/Entry.js';
import Goal from '../../models/Goal.js';
import Habit from '../../models/Habit.js';
import { loadMemory, saveMemory } from './memoryStore.js';
import logger from '../../utils/logger.js';

/**
 * Cross-pillar impact matrix
 * Format: from_pillar -> to_pillar: [impact level, symptoms]
 */
const CROSS_PILLAR_IMPACTS = {
  sleep: {
    fitness: {
      level: 'high',
      impact: 'Poor sleep reduces exercise capacity, motivation, and recovery',
      adjustments: {
        difficulty: (score) => score > 60 ? Math.max(1, score - 20) : score,
        intensity: (intensity) => intensity > 0.7 ? 0.5 : intensity,
        recommendation: 'Focus on low-intensity movement until sleep improves'
      }
    },
    'mental-health': {
      level: 'high',
      impact: 'Sleep deprivation worsens mood and anxiety',
      adjustments: {
        priority: 'increase',
        checkInFrequency: 'daily',
        recommendation: 'Sleep is critical for mental wellbeing'
      }
    },
    nutrition: {
      level: 'medium',
      impact: 'Poor sleep increases cravings for sugar and caffeine',
      adjustments: {
        caution: 'Monitor caffeine intake',
        recommendation: 'Avoid processed foods when sleep-deprived'
      }
    },
    social: {
      level: 'medium',
      impact: 'Sleep debt reduces social motivation and patience',
      adjustments: {
        recommendation: 'Low-pressure social time preferred'
      }
    }
  },

  finances: {
    sleep: {
      level: 'high',
      impact: 'Financial stress disrupts sleep quality and causes insomnia',
      adjustments: {
        screeningPriority: 'increase',
        recommendation: 'Address financial anxiety with specialist'
      }
    },
    'mental-health': {
      level: 'high',
      impact: 'Money worries trigger anxiety and depression',
      adjustments: {
        priority: 'increase',
        recommendation: 'Coordinate with mental health support'
      }
    },
    fitness: {
      level: 'medium',
      impact: 'Financial stress reduces energy for exercise',
      adjustments: {
        recommendation: 'Free or low-cost exercise options recommended'
      }
    }
  },

  'mental-health': {
    nutrition: {
      level: 'high',
      impact: 'Anxiety and depression worsen eating patterns',
      adjustments: {
        difficulty: (score) => score > 60 ? Math.max(1, score - 25) : score,
        recommendation: 'Focus on simple, nourishing foods'
      }
    },
    fitness: {
      level: 'high',
      impact: 'Depression reduces exercise motivation',
      adjustments: {
        difficulty: (score) => score > 60 ? Math.max(1, score - 15) : score,
        recommendation: 'Light movement recommended for mood boost'
      }
    },
    sleep: {
      level: 'high',
      impact: 'Anxiety and depression disrupt sleep',
      adjustments: {
        recommendation: 'Sleep and mental health closely linked'
      }
    },
    social: {
      level: 'high',
      impact: 'Mental health struggles reduce social engagement',
      adjustments: {
        recommendation: 'Gentle, supportive social interactions preferred'
      }
    }
  },

  nutrition: {
    'mental-health': {
      level: 'medium',
      impact: 'Poor nutrition worsens mood and cognitive function',
      adjustments: {
        recommendation: 'Nutrient-dense foods support mental health'
      }
    },
    fitness: {
      level: 'medium',
      impact: 'Nutrition fuels fitness progress',
      adjustments: {
        recommendation: 'Coordinate nutrition with training schedule'
      }
    },
    sleep: {
      level: 'medium',
      impact: 'Heavy foods and caffeine disrupt sleep',
      adjustments: {
        recommendation: 'Avoid large meals and caffeine near bedtime'
      }
    }
  },

  'physical-health': {
    fitness: {
      level: 'high',
      impact: 'Chronic pain or illness limits exercise capacity',
      adjustments: {
        difficulty: (score) => Math.max(1, score - 30),
        recommendation: 'Low-impact, gentle movement recommended'
      }
    },
    sleep: {
      level: 'high',
      impact: 'Pain and illness disrupt sleep',
      adjustments: {
        recommendation: 'Pain management crucial for sleep'
      }
    },
    nutrition: {
      level: 'medium',
      impact: 'Chronic illness affects nutritional needs',
      adjustments: {
        recommendation: 'Medical dietary adjustments may be needed'
      }
    }
  }
};

/**
 * Analyze cross-pillar impacts for a user
 */
export async function analyzeImpacts(userId, targetPillar) {
  try {
    // Get latest screening results for all pillars
    const screenings = await getLatestScreenings(userId);
    const impacts = [];

    // Check which pillars have poor health
    for (const [sourcePillar, sourceImpacts] of Object.entries(CROSS_PILLAR_IMPACTS)) {
      if (sourceImpacts[targetPillar]) {
        const screening = screenings[sourcePillar];
        
        // Only flag if this pillar has concerning scores
        if (screening && isScoreHighRisk(screening.score, screening.maxScore)) {
          impacts.push({
            from: sourcePillar,
            to: targetPillar,
            level: sourceImpacts[targetPillar].level,
            impact: sourceImpacts[targetPillar].impact,
            score: screening.score,
            category: screening.category,
            adjustments: sourceImpacts[targetPillar].adjustments
          });
        }
      }
    }

    return {
      ok: true,
      targetPillar,
      activeImpacts: impacts,
      recommendation: buildImpactRecommendation(impacts)
    };
  } catch (error) {
    logger.error(`Error analyzing impacts: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

/**
 * Apply adjustments to agent recommendations based on impacts
 */
export function applyImpactAdjustments(baseDifficulty, impacts) {
  let adjustedDifficulty = baseDifficulty;

  impacts.forEach(impact => {
    if (impact.adjustments?.difficulty) {
      if (typeof impact.adjustments.difficulty === 'function') {
        adjustedDifficulty = impact.adjustments.difficulty(adjustedDifficulty);
      }
    }
  });

  // Ensure within bounds [1, 5]
  return Math.max(1, Math.min(5, adjustedDifficulty));
}

/**
 * Get recommended agents/pillars to coordinate with
 */
export function getCoordinationSuggestions(impacts) {
  const suggestions = [];

  impacts.forEach(impact => {
    suggestions.push({
      agentPillar: impact.from,
      reason: `${impact.from} has ${impact.category} status affecting your ${impact.to}`,
      action: `Coordinate with agent for ${impact.from} first`,
      urgency: impact.level === 'high' ? 'urgent' : 'recommended'
    });
  });

  return suggestions.sort((a, b) => 
    (a.urgency === 'urgent' ? -1 : 1) - (b.urgency === 'urgent' ? -1 : 1)
  );
}

/**
 * Check if a screening score indicates high risk
 */
function isScoreHighRisk(score, maxScore) {
  const percentile = (score / maxScore) * 100;
  
  // High risk = top 40% (>60th percentile)
  return percentile > 60;
}

/**
 * Build human-readable recommendation from impacts
 */
function buildImpactRecommendation(impacts) {
  if (impacts.length === 0) {
    return 'No concerning cross-pillar impacts detected.';
  }

  const highPriority = impacts.filter(i => i.level === 'high');
  if (highPriority.length > 0) {
    const sources = highPriority.map(i => i.from).join(', ');
    return `Important: ${sources} needs attention first - it's significantly affecting your progress.`;
  }

  return `Note: A few other areas might be affecting your progress. Address them for better results.`;
}

/**
 * Get latest screening for each pillar
 */
async function getLatestScreenings(userId) {
  try {
    const pillars = ['sleep', 'fitness', 'mental-health', 'nutrition', 'finances', 'physical-health', 'social', 'spirituality'];
    const results = {};

    for (const pillar of pillars) {
      const latest = await Entry.findOne({
        userId,
        pillar,
        type: 'screening'
      }).sort({ createdAt: -1 });

      if (latest) {
        results[pillar] = {
          score: latest.score,
          maxScore: latest.data?.maxScore || 100,
          category: latest.data?.category || 'Unknown',
          date: latest.createdAt
        };
      }
    }

    return results;
  } catch (error) {
    logger.error(`Error fetching screenings: ${error.message}`);
    return {};
  }
}

export { CROSS_PILLAR_IMPACTS };
