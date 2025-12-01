import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Coach Agent - Provides personalized coaching and motivation
 * Accepts: { prompt, userContext?, pillarFocus? }
 * Returns: { coaching, encouragement, actionItems, nextSteps }
 */
export const coachAgent = async (req, res) => {
  try {
    const { prompt, userContext = {}, pillarFocus = 'general' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await openai.beta.messages.create({
      model: 'gpt-4-turbo',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are an empathetic wellness coach. The user is asking for coaching on the "${pillarFocus}" pillar of their life. Context: ${JSON.stringify(userContext)}. User's request: "${prompt}". Provide structured coaching with: 1) coaching advice, 2) encouragement, 3) specific action items (as array), 4) next steps.`,
        },
      ],
      betas: ['openai-beta.json-mode-latest'],
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from OpenAI');
    }

    let coachingData;
    try {
      coachingData = JSON.parse(content.text);
    } catch {
      // If not valid JSON, wrap the text response
      coachingData = {
        coaching: content.text,
        encouragement: 'You are making progress!',
        actionItems: [],
        nextSteps: 'Continue your wellness journey.',
      };
    }

    res.json({
      success: true,
      agent: 'coach',
      timestamp: new Date().toISOString(),
      data: coachingData,
    });
  } catch (error) {
    console.error('Coach agent error:', error);
    res.status(500).json({
      error: 'Failed to process coaching request',
      message: error.message,
    });
  }
};

/**
 * Daily Plan Agent - Creates structured daily plans
 * Accepts: { prompt, userGoals?, timeAvailable? }
 * Returns: { morningRoutine, mainTasks, eveningRoutine, estimatedTime, energyManagement }
 */
export const dailyPlanAgent = async (req, res) => {
  try {
    const { prompt, userGoals = [], timeAvailable = 16 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await openai.beta.messages.create({
      model: 'gpt-4-turbo',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are an expert productivity and wellness planner. Create a structured daily plan based on: "${prompt}". User has ${timeAvailable} hours of available time. Goals: ${JSON.stringify(userGoals)}. Return a JSON object with: morningRoutine (array of tasks with times), mainTasks (prioritized array with durations), eveningRoutine (array of tasks), estimatedTime (total hours needed), and energyManagement (tips for maintaining energy).`,
        },
      ],
      betas: ['openai-beta.json-mode-latest'],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from OpenAI');
    }

    let planData;
    try {
      planData = JSON.parse(content.text);
    } catch {
      planData = {
        morningRoutine: ['6:00 AM - Wake up', '6:30 AM - Exercise', '7:30 AM - Breakfast'],
        mainTasks: [{ task: prompt, duration: timeAvailable / 2 }],
        eveningRoutine: ['Evening wind-down', 'Prepare for tomorrow'],
        estimatedTime: timeAvailable,
        energyManagement: 'Take regular breaks and stay hydrated',
      };
    }

    res.json({
      success: true,
      agent: 'dailyPlan',
      timestamp: new Date().toISOString(),
      data: planData,
    });
  } catch (error) {
    console.error('Daily plan agent error:', error);
    res.status(500).json({
      error: 'Failed to create daily plan',
      message: error.message,
    });
  }
};

/**
 * Pillar Analysis Agent - Analyzes wellness across the 8 pillars
 * Accepts: { prompt, currentScores?, focusAreas? }
 * Returns: { pillarAnalysis: {pillarName: analysis}, recommendations: [], strengths: [], improvements: [] }
 */
export const pillarAnalysisAgent = async (req, res) => {
  try {
    const { prompt, currentScores = {}, focusAreas = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const pillars = ['sleep', 'diet', 'exercise', 'physical_health', 'mental_health', 'finances', 'social', 'spirituality'];
    const scoresContext = pillars.reduce((acc, pillar) => {
      acc[pillar] = currentScores[pillar] || 0;
      return acc;
    }, {});

    const response = await openai.beta.messages.create({
      model: 'gpt-4-turbo',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a holistic wellness analyst. Analyze the user's wellness across the 8 pillars: ${pillars.join(', ')}. Current pillar scores: ${JSON.stringify(scoresContext)}. User context: "${prompt}". Focus areas: ${JSON.stringify(focusAreas)}. Return a comprehensive JSON analysis with: 1) pillarAnalysis (object with detailed analysis for each pillar), 2) recommendations (array of actionable recommendations), 3) strengths (areas of strength), 4) improvements (priority areas for improvement).`,
        },
      ],
      betas: ['openai-beta.json-mode-latest'],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from OpenAI');
    }

    let analysisData;
    try {
      analysisData = JSON.parse(content.text);
    } catch {
      analysisData = {
        pillarAnalysis: pillars.reduce((acc, p) => {
          acc[p] = `Analysis for ${p}: Continue building healthy habits.`;
          return acc;
        }, {}),
        recommendations: ['Focus on consistency', 'Track your progress'],
        strengths: [],
        improvements: focusAreas,
      };
    }

    res.json({
      success: true,
      agent: 'pillarAnalysis',
      timestamp: new Date().toISOString(),
      data: analysisData,
    });
  } catch (error) {
    console.error('Pillar analysis agent error:', error);
    res.status(500).json({
      error: 'Failed to analyze pillars',
      message: error.message,
    });
  }
};

/**
 * Weekly Reflection Agent - Generates weekly reflections and insights
 * Accepts: { prompt, weeklyData?, pillarScores? }
 * Returns: { weeklyInsights, keyAccomplishments, lessonLearned, nextWeekGoals, motivationalMessage }
 */
export const weeklyReflectionAgent = async (req, res) => {
  try {
    const { prompt, weeklyData = {}, pillarScores = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await openai.beta.messages.create({
      model: 'gpt-4-turbo',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are a reflective wellness coach. Generate a comprehensive weekly reflection based on the user's week: "${prompt}". Weekly data: ${JSON.stringify(weeklyData)}. Pillar scores: ${JSON.stringify(pillarScores)}. Return a JSON object with: 1) weeklyInsights (summary of the week), 2) keyAccomplishments (array of wins), 3) lessonsLearned (array of insights), 4) nextWeekGoals (array of goals for next week), 5) motivationalMessage (encouraging message).`,
        },
      ],
      betas: ['openai-beta.json-mode-latest'],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from OpenAI');
    }

    let reflectionData;
    try {
      reflectionData = JSON.parse(content.text);
    } catch {
      reflectionData = {
        weeklyInsights: 'You had a productive week with good progress.',
        keyAccomplishments: ['Completed daily tasks', 'Maintained healthy habits'],
        lessonsLearned: ['Consistency is key', 'Small steps lead to big changes'],
        nextWeekGoals: ['Build on this week\'s momentum', 'Focus on areas needing improvement'],
        motivationalMessage: 'You are doing great! Keep up the excellent work.',
      };
    }

    res.json({
      success: true,
      agent: 'weeklyReflection',
      timestamp: new Date().toISOString(),
      data: reflectionData,
    });
  } catch (error) {
    console.error('Weekly reflection agent error:', error);
    res.status(500).json({
      error: 'Failed to generate weekly reflection',
      message: error.message,
    });
  }
};
