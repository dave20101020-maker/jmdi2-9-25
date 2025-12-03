/**
 * Screening Engine with Scoring & AI Follow-ups
 * 
 * Manages all screening questionnaires across pillars:
 * - Insomnia Severity Index (Sleep)
 * - STOP-BANG (Sleep Apnea)
 * - Epworth Sleepiness Scale (Sleep)
 * - PHQ-9 (Mental Health - Depression)
 * - GAD-7 (Mental Health - Anxiety)
 * - WHO-5 (Wellbeing)
 * - DAST-10 (Substance Use)
 * - And more per pillar
 * 
 * Features:
 * - Automatic scoring
 * - Result categorization (Normal, Mild, Moderate, Severe)
 * - AI-generated follow-ups and recommendations
 * - Historical tracking
 */

import Entry from '../../models/Entry.js';
import { loadMemory, saveMemory } from './memoryStore.js';
import { selectOptimalModel } from './modelRouter.js';
import logger from '../../utils/logger.js';

/**
 * Screening catalog with scoring logic
 */
const SCREENINGS = {
  // Sleep Screenings
  ISI: {
    name: 'Insomnia Severity Index',
    pillar: 'sleep',
    type: 'screening',
    questions: 7,
    maxScore: 28,
    scoring: (responses) => {
      return responses.reduce((sum, r) => sum + (r || 0), 0);
    },
    categories: {
      '0-7': { category: 'Normal', severity: 'none', recommendation: 'Sleep health looks good!' },
      '8-14': { category: 'Subthreshold', severity: 'mild', recommendation: 'Monitor sleep patterns' },
      '15-21': { category: 'Moderate Insomnia', severity: 'moderate', recommendation: 'Consider CBT-I' },
      '22-28': { category: 'Severe Insomnia', severity: 'severe', recommendation: 'Seek professional sleep medicine' }
    }
  },

  STOPBANG: {
    name: 'STOP-BANG Sleep Apnea Screen',
    pillar: 'sleep',
    type: 'screening',
    questions: 8,
    maxScore: 8,
    scoring: (responses) => {
      return responses.filter(r => r === true).length;
    },
    categories: {
      '0-2': { category: 'Low Risk', severity: 'none', recommendation: 'Sleep apnea unlikely' },
      '3-4': { category: 'Intermediate Risk', severity: 'mild', recommendation: 'Consider sleep study' },
      '5-8': { category: 'High Risk', severity: 'severe', recommendation: 'Urgent sleep study needed' }
    }
  },

  ESS: {
    name: 'Epworth Sleepiness Scale',
    pillar: 'sleep',
    type: 'screening',
    questions: 8,
    maxScore: 24,
    scoring: (responses) => {
      return responses.reduce((sum, r) => sum + (r || 0), 0);
    },
    categories: {
      '0-10': { category: 'Normal', severity: 'none', recommendation: 'Alertness is normal' },
      '11-14': { category: 'Mild Sleepiness', severity: 'mild', recommendation: 'Increase sleep duration' },
      '15-17': { category: 'Moderate Sleepiness', severity: 'moderate', recommendation: 'Address underlying sleep issues' },
      '18-24': { category: 'Severe Sleepiness', severity: 'severe', recommendation: 'Seek sleep specialist' }
    }
  },

  // Mental Health Screenings
  PHQ9: {
    name: 'Patient Health Questionnaire (Depression)',
    pillar: 'mental-health',
    type: 'screening',
    questions: 9,
    maxScore: 27,
    scoring: (responses) => {
      return responses.reduce((sum, r) => sum + (r || 0), 0);
    },
    categories: {
      '0-4': { category: 'Minimal', severity: 'none', recommendation: 'No depressive symptoms detected' },
      '5-9': { category: 'Mild', severity: 'mild', recommendation: 'Monitor mood and coping strategies' },
      '10-14': { category: 'Moderate', severity: 'moderate', recommendation: 'Consider therapy or counseling' },
      '15-19': { category: 'Moderately Severe', severity: 'severe', recommendation: 'Seek mental health professional' },
      '20-27': { category: 'Severe', severity: 'severe', recommendation: 'Urgent mental health support needed' }
    }
  },

  GAD7: {
    name: 'Generalized Anxiety Disorder 7-item',
    pillar: 'mental-health',
    type: 'screening',
    questions: 7,
    maxScore: 21,
    scoring: (responses) => {
      return responses.reduce((sum, r) => sum + (r || 0), 0);
    },
    categories: {
      '0-4': { category: 'Minimal', severity: 'none', recommendation: 'Anxiety level is normal' },
      '5-9': { category: 'Mild', severity: 'mild', recommendation: 'Practice relaxation techniques' },
      '10-14': { category: 'Moderate', severity: 'moderate', recommendation: 'Consider mindfulness or therapy' },
      '15-21': { category: 'Severe', severity: 'severe', recommendation: 'Seek professional mental health care' }
    }
  },

  WHO5: {
    name: 'WHO-5 Wellbeing Index',
    pillar: 'mental-health',
    type: 'screening',
    questions: 5,
    maxScore: 25,
    scoring: (responses) => {
      return responses.reduce((sum, r) => sum + (r || 0), 0) * 4; // Scale to 0-100
    },
    categories: {
      '0-32': { category: 'Low Wellbeing', severity: 'severe', recommendation: 'Focus on mood and wellbeing' },
      '33-50': { category: 'Moderate Wellbeing', severity: 'mild', recommendation: 'Build daily positive habits' },
      '51-75': { category: 'Good Wellbeing', severity: 'none', recommendation: 'Maintain your wellbeing practices' },
      '76-100': { category: 'Excellent Wellbeing', severity: 'none', recommendation: 'Thriving!' }
    }
  },

  // Substance Use
  DAST10: {
    name: 'Drug Abuse Screening Test (DAST-10)',
    pillar: 'physical-health',
    type: 'screening',
    questions: 10,
    maxScore: 10,
    scoring: (responses) => {
      return responses.filter(r => r === true).length;
    },
    categories: {
      '0': { category: 'No Problems', severity: 'none', recommendation: 'Substance use screening normal' },
      '1-2': { category: 'Low Concern', severity: 'mild', recommendation: 'Monitor substance use patterns' },
      '3-5': { category: 'Moderate Concern', severity: 'moderate', recommendation: 'Seek professional assessment' },
      '6-10': { category: 'Substantial Problems', severity: 'severe', recommendation: 'Urgent professional support needed' }
    }
  }
};

/**
 * Score a completed screening
 * 
 * Args: {
 *   screeningType: 'ISI' | 'STOPBANG' | 'ESS' | 'PHQ9' | etc,
 *   responses: [number, boolean, ...] // Responses in order
 * }
 */
export async function scoreScreening(userId, screeningType, responses) {
  try {
    const screening = SCREENINGS[screeningType];
    if (!screening) {
      throw new Error(`Unknown screening type: ${screeningType}`);
    }

    // Calculate score
    const score = screening.scoring(responses);

    // Find category
    let categoryData = null;
    for (const [range, data] of Object.entries(screening.categories)) {
      const [min, max] = range.split('-').map(Number);
      if (score >= min && score <= max) {
        categoryData = data;
        break;
      }
    }

    if (!categoryData) {
      categoryData = Object.values(screening.categories)[Object.values(screening.categories).length - 1];
    }

    // Create Entry for screening result
    const entry = await Entry.create({
      userId,
      pillar: screening.pillar,
      type: 'screening',
      date: new Date().toISOString().split('T')[0],
      score,
      data: {
        screeningType,
        screeningName: screening.name,
        responses,
        category: categoryData.category,
        severity: categoryData.severity,
        recommendation: categoryData.recommendation,
        maxScore: screening.maxScore,
        percentile: Math.round((score / screening.maxScore) * 100)
      }
    });

    logger.info(
      `Screening completed: ${userId} - ${screeningType} (score: ${score}/${screening.maxScore})`
    );

    // Generate AI follow-up
    const followUp = await generateScreeningFollowUp(
      userId,
      screening,
      score,
      categoryData,
      responses
    );

    return {
      ok: true,
      entryId: entry._id,
      score,
      category: categoryData.category,
      severity: categoryData.severity,
      percentile: Math.round((score / screening.maxScore) * 100),
      recommendation: categoryData.recommendation,
      followUp
    };
  } catch (error) {
    logger.error(`Error scoring screening: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

/**
 * Generate AI-powered follow-up recommendations
 */
async function generateScreeningFollowUp(userId, screening, score, categoryData, responses) {
  try {
    const modelConfig = await selectOptimalModel('counsel', {
      pillar: screening.pillar,
      contextString: `Screening: ${screening.name}\nScore: ${score}/${screening.maxScore}\nCategory: ${categoryData.category}`
    });

    const prompt = `You are a compassionate health professional. A user just completed the "${screening.name}" screening with a score of ${score}/${screening.maxScore}, placing them in the "${categoryData.category}" category.

The recommendation is: "${categoryData.recommendation}"

Based on this result, provide:
1. Validation of their experience (1-2 sentences)
2. 2-3 specific, actionable next steps
3. Encouragement about change possibility

Keep it concise (under 150 words) and warm.`;

    const response = await modelConfig.handler({
      prompt,
      systemPrompt: `You are a supportive health coach providing feedback on mental and physical health screenings. Be empathetic but clear about next steps.`,
      context: { pillar: screening.pillar }
    });

    return {
      text: response.text,
      model: modelConfig.modelName
    };
  } catch (error) {
    logger.error(`Error generating screening follow-up: ${error.message}`);
    return {
      text: categoryData.recommendation,
      model: 'fallback'
    };
  }
}

/**
 * Get screening history for a user/pillar
 */
export async function getScreeningHistory(userId, pillar = null) {
  try {
    const query = { userId, type: 'screening' };
    if (pillar) query.pillar = pillar;

    const screenings = await Entry.find(query).sort({ createdAt: -1 }).limit(20);

    return {
      ok: true,
      screenings: screenings.map(s => ({
        date: s.date,
        type: s.data?.screeningType,
        name: s.data?.screeningName,
        score: s.score,
        maxScore: s.data?.maxScore,
        category: s.data?.category,
        severity: s.data?.severity,
        pillar: s.pillar
      }))
    };
  } catch (error) {
    logger.error(`Error fetching screening history: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

/**
 * Get latest screening for each type
 */
export async function getLatestScreenings(userId) {
  try {
    const screenings = {};

    for (const [type, config] of Object.entries(SCREENINGS)) {
      const latest = await Entry.findOne({
        userId,
        type: 'screening',
        'data.screeningType': type
      }).sort({ createdAt: -1 });

      if (latest) {
        screenings[type] = {
          name: latest.data?.screeningName,
          score: latest.score,
          category: latest.data?.category,
          severity: latest.data?.severity,
          date: latest.createdAt,
          daysSinceTest: Math.floor((Date.now() - latest.createdAt) / (1000 * 60 * 60 * 24))
        };
      }
    }

    return {
      ok: true,
      screenings
    };
  } catch (error) {
    logger.error(`Error fetching latest screenings: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

export { SCREENINGS };
