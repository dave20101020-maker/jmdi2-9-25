/**
 * Weekly Review Agent
 * 
 * Generates comprehensive weekly review with insights per pillar
 * Analyzes week's checkins, identifies patterns, celebrates wins, suggests improvements
 * 
 * File: backend/src/ai/agents/weeklyReviewAgent.js
 */

import OpenAI from 'openai';
import Entry from '../../models/Entry.js';
import Habit from '../../models/Habit.js';
import PillarScore from '../../models/PillarScore.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate weekly review for all pillars
 * @param {String} userId - User ID
 * @returns {Object} { weeklyReview, pillarReviews, wins, improvements }
 */
export const generateWeeklyReview = async (userId) => {
  try {
    // Get past 7 days of entries
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const entries = await Entry.find({
      userId,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });

    // Get all pillar scores
    const pillarScores = await PillarScore.find({ userId });

    // Get active habits
    const habits = await Habit.find({
      userId,
      isActive: true,
    });

    // Organize entries by pillar
    const entriesByPillar = {};
    entries.forEach((entry) => {
      if (!entriesByPillar[entry.pillar]) {
        entriesByPillar[entry.pillar] = [];
      }
      entriesByPillar[entry.pillar].push(entry);
    });

    // Calculate pillar statistics for the week
    const pillarStats = {};
    Object.keys(entriesByPillar).forEach((pillar) => {
      const pillarEntries = entriesByPillar[pillar];
      const scores = pillarEntries.map((e) => e.score);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const trend =
        scores[0] > avg ? 'improving' : scores[0] < avg ? 'declining' : 'stable';

      pillarStats[pillar] = {
        entriesCount: pillarEntries.length,
        averageScore: avg,
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        trend,
        entries: pillarEntries,
      };
    });

    // Generate individual pillar reviews
    const pillarReviews = {};
    for (const [pillar, stats] of Object.entries(pillarStats)) {
      const pillarScore = pillarScores.find((ps) => ps.pillar === pillar);
      const habitCount = habits.filter((h) => h.pillar === pillar).length;

      const prompt = `
        Generate a brief (2-3 sentences) weekly review for the ${pillar} pillar based on this data:
        - Weekly entries: ${stats.entriesCount}
        - Average score: ${stats.averageScore.toFixed(1)}/100
        - Trend: ${stats.trend}
        - Highest score: ${stats.highestScore}/100
        - Lowest score: ${stats.lowestScore}/100
        - Active habits: ${habitCount}
        - Overall score: ${pillarScore?.score.toFixed(1) || 'N/A'}/10
        
        Tone: Encouraging, specific, actionable. Include one celebration and one area for improvement.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a wellness coach providing weekly reviews. Be warm, encouraging, and specific.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      pillarReviews[pillar] = {
        review: response.choices[0].message.content,
        stats,
      };
    }

    // Find wins (improving pillars, streaks)
    const wins = [];
    Object.entries(pillarReviews).forEach(([pillar, data]) => {
      if (data.stats.trend === 'improving') {
        wins.push({
          type: 'improvement',
          pillar,
          message: `Your ${pillar} score is trending upward!`,
          value: data.stats.averageScore,
        });
      }
    });

    habits.forEach((habit) => {
      if (habit.streakCount >= 7) {
        wins.push({
          type: 'streak',
          pillar: habit.pillar,
          message: `${habit.streakCount}-day streak on "${habit.name}"! 🔥`,
          value: habit.streakCount,
        });
      }
    });

    // Find improvements (declining pillars, low scores)
    const improvements = [];
    Object.entries(pillarReviews).forEach(([pillar, data]) => {
      if (data.stats.trend === 'declining') {
        improvements.push({
          type: 'decline',
          pillar,
          message: `${pillar} score is declining. Let's create a recovery plan.`,
          value: data.stats.averageScore,
        });
      }
      if (data.stats.averageScore < 50) {
        improvements.push({
          type: 'lowScore',
          pillar,
          message: `${pillar} is below 50. Priority focus area.`,
          value: data.stats.averageScore,
        });
      }
    });

    // Generate overall summary
    const overallPrompt = `
      Summarize this week's wellness journey in 2-3 sentences. Use this data:
      
      Pillars reviewed: ${Object.keys(pillarReviews).join(', ')}
      
      ${Object.entries(pillarReviews)
        .map(
          ([pillar, data]) =>
            `${pillar}: ${data.stats.entriesCount} entries, avg score ${data.stats.averageScore.toFixed(1)}, trend ${data.stats.trend}`
        )
        .join('\n')}
      
      Tone: Motivating, holistic, empowering. Look at the big picture.
    `;

    const overallResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a wellness coach providing holistic weekly reviews.',
        },
        {
          role: 'user',
          content: overallPrompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return {
      ok: true,
      weeklyReview: {
        summary: overallResponse.choices[0].message.content,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
      },
      pillarReviews,
      wins: wins.sort((a, b) => b.value - a.value).slice(0, 5), // Top 5 wins
      improvements: improvements.sort((a, b) => a.value - b.value).slice(0, 5), // Top 5 improvements
      stats: pillarStats,
    };
  } catch (error) {
    console.error('Weekly review error:', error);
    throw error;
  }
};

/**
 * Store weekly review as entry
 * @param {String} userId - User ID
 * @param {Object} review - Review data from generateWeeklyReview
 * @returns {Object} Stored review document
 */
export const storeWeeklyReview = async (userId, review) => {
  try {
    const Entry = (await import('../../models/Entry.js')).default;

    const entry = await Entry.create({
      userId,
      type: 'weekly-review',
      pillar: 'holistic',
      date: new Date(),
      score: 0, // Not applicable
      metadata: {
        summary: review.weeklyReview.summary,
        pillarReviews: review.pillarReviews,
        wins: review.wins,
        improvements: review.improvements,
        stats: review.stats,
        period: review.weeklyReview.period,
      },
    });

    return entry;
  } catch (error) {
    console.error('Store weekly review error:', error);
    throw error;
  }
};

export default {
  generateWeeklyReview,
  storeWeeklyReview,
};
