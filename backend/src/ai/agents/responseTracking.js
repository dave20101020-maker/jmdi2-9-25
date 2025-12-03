/**
 * Response Tracking System
 * 
 * Track: AI response completions, user feedback sentiment,
 * AI confidence scores, escalation events for quality metrics
 * 
 * File: backend/src/ai/agents/responseTracking.js
 */

import Entry from '../../models/Entry.js';

/**
 * Response feedback categories
 */
const feedbackCategories = {
  HELPFUL: {
    score: 5,
    label: 'Very Helpful',
    icon: '😄',
  },
  SOMEWHAT_HELPFUL: {
    score: 3,
    label: 'Somewhat Helpful',
    icon: '🙂',
  },
  NEUTRAL: {
    score: 2,
    label: 'Neutral',
    icon: '😐',
  },
  NOT_HELPFUL: {
    score: 1,
    label: 'Not Helpful',
    icon: '😕',
  },
  CONFUSED: {
    score: 0,
    label: 'Confused Me',
    icon: '😕',
  },
};

/**
 * Create response tracking entry
 * @param {String} userId - User ID
 * @param {String} pillar - Pillar
 * @param {Object} response - Agent response data
 * @returns {Object} Tracking entry
 */
export const trackResponse = async (userId, pillar, response) => {
  try {
    const trackingEntry = await Entry.create({
      userId,
      type: 'ai-response',
      pillar,
      date: new Date(),
      score: 0, // Not applicable
      metadata: {
        responseId: response.id || undefined,
        agent: response.agent || undefined,
        model: response.model || 'gpt-4',
        tokensUsed: response.tokensUsed || 0,
        responseLength: response.text?.length || 0,
        responseDuration: response.duration || 0, // ms
        createdAt: new Date().toISOString(),
        status: 'completed',
      },
    });

    return {
      ok: true,
      trackingEntry,
      trackingId: trackingEntry._id,
    };
  } catch (error) {
    console.error('Track response error:', error);
    return {
      ok: false,
      error: error.message,
    };
  }
};

/**
 * Record user feedback on AI response
 * @param {String} userId - User ID
 * @param {String} trackingId - ID of response tracking entry
 * @param {String} feedback - Feedback category (HELPFUL, NOT_HELPFUL, etc)
 * @param {String} comment - Optional comment from user
 * @returns {Object} Updated tracking entry
 */
export const recordFeedback = async (userId, trackingId, feedback, comment = '') => {
  try {
    const Entry = (await import('../../models/Entry.js')).default;

    const entry = await Entry.findByIdAndUpdate(
      trackingId,
      {
        $set: {
          'metadata.feedback': {
            category: feedback,
            score: feedbackCategories[feedback]?.score || 0,
            sentiment: getSentimentFromFeedback(feedback),
            comment,
            recordedAt: new Date().toISOString(),
          },
          'metadata.status': 'feedback-received',
        },
      },
      { new: true }
    );

    return {
      ok: true,
      entry,
      feedbackScore: feedbackCategories[feedback]?.score || 0,
    };
  } catch (error) {
    console.error('Record feedback error:', error);
    return {
      ok: false,
      error: error.message,
    };
  }
};

/**
 * Calculate AI confidence score based on response characteristics
 * @param {Object} response - Agent response data
 * @param {Object} context - User context (habits, scores, etc)
 * @returns {Number} Confidence score 0-100
 */
export const calculateConfidenceScore = (response, context = {}) => {
  let confidence = 50; // Start at neutral

  // Response length (reasonable length = higher confidence)
  const length = response.text?.length || 0;
  if (length > 300 && length < 2000) confidence += 10;
  else if (length >= 2000) confidence += 5;

  // Model preference alignment
  if (response.model === 'gpt-4') confidence += 8; // GPT typically more confident
  else if (response.model === 'claude-3') confidence += 5; // Claude more cautious (which is good)

  // Response structure (if contains clear sections, examples, or structured advice)
  const hasStructure =
    (response.text?.includes('\n') && response.text?.split('\n').length > 5) ||
    response.text?.includes('1.') ||
    response.text?.includes('-');
  if (hasStructure) confidence += 12;

  // Context utilization (higher context usage = more personalized = higher confidence)
  if (context.habitsUsed) confidence += 8;
  if (context.screeningUsed) confidence += 10;
  if (context.priorMessagesUsed) confidence += 5;

  // Disclaimer presence (lower confidence if hedged too much)
  const disclaimers = (response.text?.match(/might|may|could|possibly|perhaps|unclear/gi) || []).length;
  if (disclaimers > 5) confidence -= 15;

  // Actionable items (more specific actions = higher confidence)
  const actionables = response.text?.match(/step|do this|try|action|implement|start/gi) || [];
  if (actionables.length > 3) confidence += 10;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, confidence));
};

/**
 * Get sentiment from feedback
 * @param {String} feedback - Feedback category
 * @returns {String} Sentiment (positive, neutral, negative)
 */
const getSentimentFromFeedback = (feedback) => {
  if (['HELPFUL', 'SOMEWHAT_HELPFUL'].includes(feedback)) return 'positive';
  if (feedback === 'NEUTRAL') return 'neutral';
  if (['NOT_HELPFUL', 'CONFUSED'].includes(feedback)) return 'negative';
  return 'unknown';
};

/**
 * Get quality metrics for a pillar or user
 * @param {String} userId - User ID
 * @param {String} pillar - Optional pillar filter
 * @param {Number} days - Number of days to analyze (default 30)
 * @returns {Object} Quality metrics
 */
export const getQualityMetrics = async (userId, pillar = null, days = 30) => {
  try {
    const Entry = (await import('../../models/Entry.js')).default;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = {
      userId,
      type: 'ai-response',
      createdAt: { $gte: startDate },
    };

    if (pillar) {
      query.pillar = pillar;
    }

    const responses = await Entry.find(query).lean();

    if (responses.length === 0) {
      return {
        ok: true,
        metrics: {
          totalResponses: 0,
          feedbackRate: 0,
          averageFeedbackScore: 0,
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
          averageConfidenceScore: 0,
          escalationRate: 0,
          averageResponseLength: 0,
          averageResponseTime: 0,
        },
      };
    }

    // Calculate metrics
    const respondedCount = responses.filter((r) => r.metadata?.feedback).length;
    const feedbackRate = (respondedCount / responses.length) * 100;

    const feedbackScores = responses
      .filter((r) => r.metadata?.feedback?.score !== undefined)
      .map((r) => r.metadata.feedback.score);
    const avgFeedbackScore =
      feedbackScores.length > 0 ? feedbackScores.reduce((a, b) => a + b, 0) / feedbackScores.length : 0;

    // Sentiment breakdown
    const sentiments = responses.reduce(
      (acc, r) => {
        const sentiment = r.metadata?.feedback?.sentiment || 'unknown';
        if (sentiment === 'positive') acc.positive++;
        else if (sentiment === 'neutral') acc.neutral++;
        else if (sentiment === 'negative') acc.negative++;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    // Average confidence (calculated at response time)
    const confidenceScores = responses
      .filter((r) => r.metadata?.confidenceScore !== undefined)
      .map((r) => r.metadata.confidenceScore);
    const avgConfidence =
      confidenceScores.length > 0 ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length : 0;

    // Response characteristics
    const lengths = responses.map((r) => r.metadata?.responseLength || 0);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

    const durations = responses.filter((r) => r.metadata?.responseDuration).map((r) => r.metadata.responseDuration);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return {
      ok: true,
      metrics: {
        totalResponses: responses.length,
        feedbackRate: feedbackRate.toFixed(1),
        averageFeedbackScore: avgFeedbackScore.toFixed(2),
        sentimentBreakdown: {
          positive: sentiments.positive,
          neutral: sentiments.neutral,
          negative: sentiments.negative,
          percentages: {
            positive: ((sentiments.positive / responses.length) * 100).toFixed(1),
            neutral: ((sentiments.neutral / responses.length) * 100).toFixed(1),
            negative: ((sentiments.negative / responses.length) * 100).toFixed(1),
          },
        },
        averageConfidenceScore: avgConfidence.toFixed(1),
        averageResponseLength: Math.round(avgLength),
        averageResponseTime: Math.round(avgDuration),
      },
      periodAnalyzed: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        days,
      },
    };
  } catch (error) {
    console.error('Get quality metrics error:', error);
    return {
      ok: false,
      error: error.message,
    };
  }
};

/**
 * Get escalation statistics
 * @param {String} userId - User ID
 * @param {Number} days - Number of days to analyze
 * @returns {Object} Escalation statistics
 */
export const getEscalationStats = async (userId, days = 30) => {
  try {
    const Entry = (await import('../../models/Entry.js')).default;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const escalations = await Entry.find({
      userId,
      type: 'escalation',
      createdAt: { $gte: startDate },
    }).lean();

    const byLevel = escalations.reduce(
      (acc, e) => {
        const level = e.metadata?.level || 'unknown';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      },
      {}
    );

    const byTrigger = escalations.reduce(
      (acc, e) => {
        const trigger = e.metadata?.trigger || 'unknown';
        acc[trigger] = (acc[trigger] || 0) + 1;
        return acc;
      },
      {}
    );

    return {
      ok: true,
      stats: {
        totalEscalations: escalations.length,
        byLevel,
        byTrigger,
        criticalEvents: escalations.filter((e) => e.metadata?.level === 'critical').length,
        escalationRate: ((escalations.length / 30) * 100).toFixed(2) + '% per day', // Rough estimate
      },
      periodAnalyzed: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        days,
      },
    };
  } catch (error) {
    console.error('Get escalation stats error:', error);
    return {
      ok: false,
      error: error.message,
    };
  }
};

/**
 * Generate quality report
 * @param {String} userId - User ID
 * @param {Number} days - Days to analyze
 * @returns {Object} Comprehensive quality report
 */
export const generateQualityReport = async (userId, days = 30) => {
  try {
    const qualityMetrics = await getQualityMetrics(userId, null, days);
    const escalationStats = await getEscalationStats(userId, days);

    let overallRating = 'Good';
    let recommendation = '';

    if (qualityMetrics.ok) {
      const feedbackScore = parseFloat(qualityMetrics.metrics.averageFeedbackScore);
      const feedbackRate = parseFloat(qualityMetrics.metrics.feedbackRate);

      if (feedbackScore > 4 && feedbackRate > 60) {
        overallRating = 'Excellent';
        recommendation = 'AI responses are highly effective. Continue current approach.';
      } else if (feedbackScore > 3 && feedbackRate > 40) {
        overallRating = 'Good';
        recommendation = 'AI responses are helpful. Monitor for improvement areas.';
      } else if (feedbackScore > 2) {
        overallRating = 'Fair';
        recommendation = 'Consider adjusting AI approaches or increasing human coach involvement.';
      } else {
        overallRating = 'Needs Improvement';
        recommendation = 'Significant issues detected. Recommend human coach for personalized support.';
      }
    }

    return {
      ok: true,
      report: {
        overallRating,
        recommendation,
        qualityMetrics: qualityMetrics.ok ? qualityMetrics.metrics : null,
        escalationStats: escalationStats.ok ? escalationStats.stats : null,
        generatedAt: new Date().toISOString(),
        periodAnalyzed: {
          start: new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          days,
        },
      },
    };
  } catch (error) {
    console.error('Generate quality report error:', error);
    return {
      ok: false,
      error: error.message,
    };
  }
};

export default {
  trackResponse,
  recordFeedback,
  calculateConfidenceScore,
  getQualityMetrics,
  getEscalationStats,
  generateQualityReport,
  feedbackCategories,
};
