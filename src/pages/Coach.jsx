import { api } from "@/utils/apiClient";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Send,
  Loader2,
  Target,
  CheckCircle2,
  Calendar,
  TrendingUp,
  TrendingDown,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { differenceInCalendarDays, format, subDays } from "date-fns";
import ReactMarkdown from "react-markdown";
import AIThinkingOverlay from "@/ai/AIThinkingOverlay";
import { toast } from "sonner";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { computeComBRecommendations, createComBInput } from "@/engines/com-b";
import {
  buildAdaptiveCoachContext,
  buildAdaptiveCoachProfile,
} from "@/ai/adaptive";

const PILLARS = {
  sleep: {
    name: "Sleep",
    color: "#6B46C1",
    icon: "🌙",
    coach: "Dr. Luna",
    tone: "calm, soothing, science-focused",
    quickQuestions: [
      "Why am I tired?",
      "Improve sleep quality",
      "Create a sleep plan",
    ],
  },
  diet: {
    name: "Diet",
    color: "#52B788",
    icon: "🥗",
    coach: "Chef Nourish",
    tone: "encouraging, practical, non-judgmental",
    quickQuestions: [
      "Healthy meal ideas",
      "Nutrition tips",
      "Create a nutrition plan",
    ],
  },
  exercise: {
    name: "Exercise",
    color: "#FF5733",
    icon: "💪",
    coach: "Coach Phoenix",
    tone: "energetic, motivating, technical",
    quickQuestions: ["Workout plan", "Exercise form", "Create a fitness plan"],
  },
  physical_health: {
    name: "Physical Health",
    color: "#FF7F50",
    icon: "❤️",
    coach: "Dr. Vita",
    tone: "caring, preventative, medically-informed",
    quickQuestions: [
      "Health checkup tips",
      "Preventive care",
      "Create a wellness plan",
    ],
  },
  mental_health: {
    name: "Mental Health",
    color: "#4CC9F0",
    icon: "🧠",
    coach: "Dr. Serenity",
    tone: "empathetic, supportive, patient",
    quickQuestions: [
      "Reduce stress",
      "Improve mood",
      "Create a mental wellness plan",
    ],
  },
  finances: {
    name: "Finances",
    color: "#2E8B57",
    icon: "💰",
    coach: "Advisor Prosper",
    tone: "rational, strategic, confidence-building",
    quickQuestions: [
      "Budget help",
      "Savings strategies",
      "Create a financial plan",
    ],
  },
  social: {
    name: "Social",
    color: "#FFD700",
    icon: "👥",
    coach: "Coach Connect",
    tone: "warm, social-psychology-focused",
    quickQuestions: [
      "Improve relationships",
      "Social confidence",
      "Create a social plan",
    ],
  },
  spirituality: {
    name: "Spirituality",
    color: "#7C3AED",
    icon: "✨",
    coach: "Guide Zenith",
    tone: "thoughtful, philosophical, open-minded",
    quickQuestions: [
      "Find purpose",
      "Meditation guide",
      "Create a spiritual plan",
    ],
  },
};

const PILLAR_ARRAY = Object.values(PILLARS);

function SmartGoalDisplay({ goal, pillar }) {
  return (
    <div
      className="my-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
      style={{ boxShadow: `0 0 20px ${pillar.color}40` }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{
            backgroundColor: `${pillar.color}30`,
            boxShadow: `0 0 15px ${pillar.color}40`,
          }}
        >
          <Target className="w-6 h-6" style={{ color: pillar.color }} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">
            SMART Goal Created! 🎯
          </h3>
          <p className="text-white/80 text-sm italic">"{goal.goalStatement}"</p>
        </div>
      </div>

      <div className="space-y-3 ml-6">
        <div>
          <span className="text-green-400 font-semibold text-sm">
            Specific:
          </span>
          <p className="text-white/80 text-sm mt-1">{goal.specific}</p>
        </div>

        <div>
          <span className="text-blue-400 font-semibold text-sm">
            Measurable:
          </span>
          <p className="text-white/80 text-sm mt-1">{goal.measurable}</p>
        </div>

        {goal.achievable && (
          <div>
            <span className="text-purple-400 font-semibold text-sm">
              Achievable:
            </span>
            <p className="text-white/80 text-sm mt-1">{goal.achievable}</p>
          </div>
        )}

        {goal.relevant && (
          <div>
            <span className="text-yellow-400 font-semibold text-sm">
              Relevant:
            </span>
            <p className="text-white/80 text-sm mt-1">{goal.relevant}</p>
          </div>
        )}

        <div>
          <span className="text-orange-400 font-semibold text-sm">
            Time-bound:
          </span>
          <p className="text-white/80 text-sm mt-1">{goal.timeBound}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-white/40 flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-green-400" />
          Goal saved to {pillar.name}
        </p>
      </div>
    </div>
  );
}

function PlanDisplay({ plan, pillar }) {
  return (
    <div
      className="my-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
      style={{ boxShadow: `0 0 20px ${pillar.color}40` }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{
            backgroundColor: `${pillar.color}30`,
            boxShadow: `0 0 15px ${pillar.color}40`,
          }}
        >
          <Target className="w-6 h-6" style={{ color: pillar.color }} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">
            {plan.planTitle}
          </h3>
          <p className="text-white/80 text-sm">{plan.planDescription}</p>
        </div>
      </div>

      {plan.goals && plan.goals.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#D4AF37]" />
            <h4 className="font-semibold text-white">Goals</h4>
          </div>
          <ul className="space-y-1 ml-6">
            {plan.goals.map((goal, i) => (
              <li
                key={i}
                className="text-white/80 text-sm flex items-start gap-2"
              >
                <span className="text-[#D4AF37]">•</span>
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.dailyActions && plan.dailyActions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <h4 className="font-semibold text-white">Daily Actions</h4>
          </div>
          <ul className="space-y-1 ml-6">
            {plan.dailyActions.map((action, i) => (
              <li
                key={i}
                className="text-white/80 text-sm flex items-start gap-2"
              >
                <span className="text-green-400">✓</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.weeklyActions && plan.weeklyActions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h4 className="font-semibold text-white">Weekly Actions</h4>
          </div>
          <ul className="space-y-1 ml-6">
            {plan.weeklyActions.map((action, i) => (
              <li
                key={i}
                className="text-white/80 text-sm flex items-start gap-2"
              >
                <span className="text-blue-400">→</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.successMetrics && plan.successMetrics.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h4 className="font-semibold text-white">Success Metrics</h4>
          </div>
          <ul className="space-y-1 ml-6">
            {plan.successMetrics.map((metric, i) => (
              <li
                key={i}
                className="text-white/80 text-sm flex items-start gap-2"
              >
                <span className="text-purple-400">📊</span>
                {metric}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Coach() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const pillarId = urlParams.get("pillar") || "sleep";
  const pillar = PILLARS[pillarId];

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const messagesEndRef = useRef(null);
  const [showAIThinking, setShowAIThinking] = useState(false);
  const [aiThinkingMessage, setAiThinkingMessage] = useState(
    "NorthStar is thinking..."
  );
  const { hasPremiumAccess } = useSubscriptionStatus();

  useEffect(() => {
    async function getUserAndSubscription() {
      const currentUser = await api.authMe();
      setUser(currentUser);

      // Count today's messages
      const today = format(new Date(), "yyyy-MM-dd");
      const todayInteractions = await api.getCoachInteractions({
        userId: currentUser.email,
        timestamp: { $gte: new Date(today).toISOString() },
      });
      setDailyMessageCount(todayInteractions.length);
    }
    getUserAndSubscription();
  }, []);

  // Fetch all user data for context
  const { data: allEntries = [] } = useQuery({
    queryKey: ["entries", user?.email],
    queryFn: () => api.getEntries({ created_by: user?.email }, "-date", 30),
    enabled: !!user,
    initialData: [],
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", user?.email],
    queryFn: () => api.getGoals({ created_by: user?.email, status: "active" }),
    enabled: !!user,
    initialData: [],
  });

  const { data: previousInteractions = [] } = useQuery({
    queryKey: ["coachHistory", user?.email, pillarId],
    queryFn: () =>
      api.getCoachInteractions(
        { userId: user?.email, pillar: pillarId },
        "-timestamp",
        20
      ),
    enabled: !!user,
    initialData: [],
  });

  const comBScores = useMemo(() => {
    const fallback = { motivation: 58, opportunity: 55, capability: 57 };
    if (!user) return fallback;
    const profile = user.behavior_profile || user.behaviorProfile || {};
    const onboarding = user.onboarding_profile || {};
    const stored = user.com_b_scores || user.comB || {};
    const parseScore = (value, fallbackValue) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : fallbackValue;
    };
    return {
      motivation: parseScore(
        stored.motivation ??
          profile.motivation ??
          onboarding.motivation ??
          user?.motivation_score,
        fallback.motivation
      ),
      opportunity: parseScore(
        stored.opportunity ??
          profile.opportunity ??
          onboarding.opportunity ??
          user?.opportunity_score,
        fallback.opportunity
      ),
      capability: parseScore(
        stored.capability ??
          profile.capability ??
          onboarding.capability ??
          user?.capability_score,
        fallback.capability
      ),
    };
  }, [user]);

  const comBPillarMetrics = useMemo(() => {
    const grouped = allEntries.reduce((acc, entry) => {
      if (!entry?.pillar) return acc;
      if (!acc[entry.pillar]) acc[entry.pillar] = [];
      acc[entry.pillar].push(entry);
      return acc;
    }, {});

    Object.values(grouped).forEach((list) =>
      list.sort((a, b) => new Date(b.date) - new Date(a.date))
    );

    const metrics = Object.entries(grouped).map(
      ([pillarKey, entriesForPillar]) => {
        const latest = entriesForPillar[0];
        const previous = entriesForPillar[1];
        const lastEntryDays = latest?.date
          ? differenceInCalendarDays(new Date(), new Date(latest.date))
          : null;
        const recentWindow = entriesForPillar.slice(0, 7);
        const habitConsistency = recentWindow.length
          ? Math.round((recentWindow.length / 7) * 100)
          : null;
        return {
          id: pillarKey,
          name: PILLARS[pillarKey]?.name || pillarKey,
          score: latest?.score ?? 0,
          trend: previous?.score ? latest.score - previous.score : 0,
          lastEntryDays:
            Number.isFinite(lastEntryDays) && lastEntryDays >= 0
              ? lastEntryDays
              : null,
          habitConsistency,
          blockers: [],
          focus: PILLARS[pillarKey]?.name,
        };
      }
    );

    if (!metrics.length && pillarId && PILLARS[pillarId]) {
      metrics.push({
        id: pillarId,
        name: PILLARS[pillarId].name,
        score: 50,
        trend: 0,
        lastEntryDays: null,
        habitConsistency: null,
        blockers: [],
        focus: PILLARS[pillarId].name,
      });
    }

    return metrics;
  }, [allEntries, pillarId]);

  const comBInput = useMemo(() => {
    if (!comBPillarMetrics.length) return null;
    return createComBInput({
      motivation: comBScores.motivation,
      opportunity: comBScores.opportunity,
      capability: comBScores.capability,
      pillarMetrics: comBPillarMetrics,
      focusPillarId: pillarId,
    });
  }, [
    comBPillarMetrics,
    comBScores.capability,
    comBScores.motivation,
    comBScores.opportunity,
    pillarId,
  ]);

  const comBInsights = useMemo(() => {
    if (!comBInput) return null;
    return computeComBRecommendations(comBInput, {
      limit: 4,
      focusPillarId: pillarId,
    });
  }, [comBInput, pillarId]);

  const adaptiveCoachProfile = useMemo(() => {
    if (!user) return null;
    return buildAdaptiveCoachProfile({
      user,
      comBInsights,
      accessiblePillars: PILLAR_ARRAY,
    });
  }, [user, comBInsights]);

  const adaptiveCoachContext = useMemo(
    () => buildAdaptiveCoachContext(adaptiveCoachProfile),
    [adaptiveCoachProfile]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const messageLimit = hasPremiumAccess ? 50 : 5;
  const messagesRemaining = messageLimit - dailyMessageCount;

  const buildUserContext = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const pillarEntries = allEntries.filter((e) => e.pillar === pillarId);
    const todayEntry = pillarEntries.find((e) => e.date === today);
    const last7Days = pillarEntries.slice(0, 7);
    const weekAgo = pillarEntries.find(
      (e) => e.date === format(subDays(new Date(), 7), "yyyy-MM-dd")
    );

    // Calculate trend
    const currentScore =
      todayEntry?.score ||
      (last7Days.length > 0
        ? Math.round(
            last7Days.reduce((sum, e) => sum + e.score, 0) / last7Days.length
          )
        : 0);
    const weekAgoScore = weekAgo?.score || 0;
    const trend = weekAgoScore > 0 ? currentScore - weekAgoScore : 0;
    const trendLabel =
      trend > 5 ? "improving" : trend < -5 ? "declining" : "steady";

    // Get pillar-specific goals
    const pillarGoals = goals.filter((g) => g.pillar === pillarId);

    // Get previous advice given (last 30 days)
    const recentAdvice = previousInteractions
      .filter((i) => i.adviceGiven && i.adviceGiven.length > 0)
      .flatMap((i) => i.adviceGiven)
      .slice(0, 10);

    return {
      currentScore,
      trend,
      trendLabel,
      last7DaysAvg:
        last7Days.length > 0
          ? Math.round(
              last7Days.reduce((sum, e) => sum + e.score, 0) / last7Days.length
            )
          : 0,
      recentEntries: last7Days.slice(0, 5),
      goals: pillarGoals,
      recentAdvice,
      userProfile: user?.bio || {},
      userCapability: user?.comb || {},
    };
  };

  const detectPlanRequest = (text) => {
    const planKeywords = [
      "create a plan",
      "make a plan",
      "plan for",
      "help me plan",
      "build a plan",
    ];
    return planKeywords.some((kw) => text.toLowerCase().includes(kw));
  };

  const detectGoalRequest = (text) => {
    const goalKeywords = [
      "set a goal",
      "create a goal",
      "my goal",
      "want to achieve",
      "help me",
    ];
    return goalKeywords.some((kw) => text.toLowerCase().includes(kw));
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    if (dailyMessageCount >= messageLimit) {
      toast.error(`Daily limit reached (${messageLimit} messages)`, {
        description: hasPremiumAccess
          ? "Try again tomorrow"
          : "Upgrade or start your trial for 50 messages/day",
      });
      return;
    }

    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowAIThinking(true);

    try {
      const context = buildUserContext();
      const isPlanRequest = detectPlanRequest(text);
      const isGoalRequest = detectGoalRequest(text);

      // Build rich context string
      const baseContextString = `
USER CONTEXT:
- Current ${pillar.name} score: ${context.currentScore}/100 (${
        context.trendLabel
  } trend, ${context.trend > 0 ? "+" : ""}${context.trend} vs last week)
- Last 7 days average: ${context.last7DaysAvg}/100
- Recent entries: ${
        context.recentEntries.length > 0
          ? context.recentEntries
              .map(
                (e) =>
                  `${e.date}: ${e.score}/100${e.notes ? " - " + e.notes : ""}`
              )
              .join("; ")
          : "No recent data"
      }
- Active goals: ${
        context.goals.length > 0
          ? context.goals.map((g) => g.goalStatement).join("; ")
          : "None"
      }
- Age: ${context.userProfile.age || "unknown"}
- Activity level: ${context.userProfile.activityLevel || "unknown"}
- Energy: ${context.userCapability.physicalCapability?.energy || "unknown"}/5
- Motivation: ${
        context.userCapability.motivation?.motivationLevel || "unknown"
      }/5

PREVIOUS ADVICE GIVEN (Do NOT repeat):

${
  context.recentAdvice.length > 0
    ? context.recentAdvice.map((adv, i) => `${i + 1}. ${adv}`).join("\n")
    : "None yet"
}

function formatAdaptiveContextSection(context, targetPillarId) {
  if (!context) return "";
  const priorityLine = (context.priorityPillars || [])
    .map((pillar) => {
      const descriptor = pillar.summary || `focus on ${pillar.focusArea}`;
      return `${pillar.name}: ${descriptor}`;
    })
    .join("; ");
  const alertLine = (context.watchouts || [])
    .map((alert) => `${alert.label} (${alert.severity || "elevated"})`)
    .join("; ");
  const target = (context.priorityPillars || []).find(
    (pillar) => pillar.id === targetPillarId
  );
  const lines = [
    "ADAPTIVE CONTEXT:",
    `- Persona: ${context.persona}${
      context.personaTagline ? ` — ${context.personaTagline}` : ""
    }`,
  ];
  if (context.focusAreaLabel) {
    lines.push(`- COM-B focus: ${context.focusAreaLabel}`);
  }
  if (priorityLine) {
    lines.push(`- Priority pillars: ${priorityLine}`);
  }
  if (alertLine) {
    lines.push(`- Psychometric alerts: ${alertLine}`);
  }
  if (target?.summary) {
    lines.push(`- Current pillar insight: ${target.summary}`);
  }
  return lines.join("\n");
}

CONVERSATION HISTORY:
${previousInteractions
  .slice(0, 3)
  .map(
    (i) => `User: ${i.userMessage}\nYou: ${i.aiResponse.substring(0, 200)}...`
  )
  .join("\n\n")}`;

      const adaptiveContextSnippet = formatAdaptiveContextSection(
        adaptiveCoachContext,
        pillarId
      );
      const contextString = adaptiveContextSnippet
        ? `${baseContextString}\n${adaptiveContextSnippet}`
        : baseContextString;

      if (isPlanRequest) {
        setAiThinkingMessage("Crafting your personalized plan...");

        const planPrompt = `You are ${pillar.coach}, a ${pillar.tone} ${pillar.name} coach.

${contextString}

User request: ${text}

Create a personalized, achievable plan. Make it specific to their data and situation. Avoid repeating advice already given.

Respond with ONLY valid JSON (no markdown, no text before/after):
{
  "planTitle": "5-8 word compelling title",
  "planDescription": "1-2 sentence description",
  "goals": ["2-4 specific, measurable goals"],
  "dailyActions": ["2-4 tiny daily actions they can do"],
  "weeklyActions": ["1-2 weekly check-ins or reviews"],
  "successMetrics": ["2-3 ways to measure progress"]
}`;

        const response = await api.aiCoach({
          prompt: planPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              planTitle: { type: "string" },
              planDescription: { type: "string" },
              goals: { type: "array", items: { type: "string" } },
              dailyActions: { type: "array", items: { type: "string" } },
              weeklyActions: { type: "array", items: { type: "string" } },
              successMetrics: { type: "array", items: { type: "string" } },
            },
          },
        });

        const planData = response.output || response;
        const today = format(new Date(), "yyyy-MM-dd");

        await api.createPlan({
          pillar: pillarId,
          planTitle: planData.planTitle,
          planDescription: planData.planDescription,
          goals: planData.goals || [],
          dailyActions: planData.dailyActions || [],
          weeklyActions: planData.weeklyActions || [],
          successMetrics: planData.successMetrics || [],
          isActive: true,
          startDate: today,
        });

        // Save interaction
        await api.createCoachInteraction({
          userId: user.email,
          pillar: pillarId,
          userMessage: text,
          aiResponse: JSON.stringify(planData),
          adviceGiven: [
            ...(planData.dailyActions || []),
            ...(planData.goals || []),
          ],
          contextData: context,
          timestamp: new Date().toISOString(),
        });

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: planData, isPlan: true },
        ]);
        setDailyMessageCount((prev) => prev + 1);
        toast.success("Plan created! 🎉");
      } else if (isGoalRequest) {
        setAiThinkingMessage("Creating your SMART goal...");

        const goalPrompt = `You are ${pillar.coach}, a ${pillar.tone} ${pillar.name} coach.

${contextString}

User wants to set a goal: ${text}

Create a SMART goal specific to their data. Be supportive and realistic.

Respond with ONLY valid JSON:
{
  "goalStatement": "User's goal in their words",
  "specific": "What exactly will be accomplished (1 sentence)",
  "measurable": "How to measure it (1 sentence, be specific with numbers if possible)",
  "achievable": "Why it's realistic for them (1 sentence)",
  "relevant": "Why it matters for their ${pillar.name} (1 sentence)",
  "timeBound": "Specific timeframe (e.g., '30 days', 'by Dec 15', '2 weeks')"
}`;

        const response = await api.aiCoach({
          prompt: goalPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              goalStatement: { type: "string" },
              specific: { type: "string" },
              measurable: { type: "string" },
              achievable: { type: "string" },
              relevant: { type: "string" },
              timeBound: { type: "string" },
            },
          },
        });

        const goalData = response.output || response;

        await api.createGoal({
          pillar: pillarId,
          goalStatement: goalData.goalStatement,
          specific: goalData.specific,
          measurable: goalData.measurable,
          achievable: goalData.achievable || "",
          relevant: goalData.relevant || "",
          timeBound: goalData.timeBound,
          status: "active",
          progress: 0,
        });

        await api.createCoachInteraction({
          userId: user.email,
          pillar: pillarId,
          userMessage: text,
          aiResponse: JSON.stringify(goalData),
          adviceGiven: [goalData.goalStatement],
          contextData: context,
          timestamp: new Date().toISOString(),
        });

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: goalData, isGoal: true },
        ]);
        setDailyMessageCount((prev) => prev + 1);
        toast.success("SMART goal created! 🎯");
      } else {
        setAiThinkingMessage(`${pillar.coach} is analyzing your data...`);

        const conversationPrompt = `You are ${pillar.coach}, a ${pillar.tone} ${pillar.name} coach.

${contextString}

User question: ${text}

CRITICAL INSTRUCTIONS:
1. Be SPECIFIC to their data - reference their scores, trends, and history
2. Give 1-3 CONCRETE actions they can do TODAY
3. Keep response to 2-3 sentences unless they ask for detail
4. Be encouraging but realistic
5. Do NOT repeat advice from "Previous Advice Given" section
6. If referencing previous conversations, acknowledge it: "Last time we talked about..."
7. Use science when relevant but briefly: "Research shows..." (1 sentence max)
8. Your tone should be ${pillar.tone}
9. End with a question or encouragement

Response format (use numbered list for multiple points):
1. Observation about their data
2. One specific action to try
3. Encouraging question

Keep it conversational and supportive.`;

        const response = await api.aiCoach({
          prompt: conversationPrompt,
        });

        const aiResponse = response.output || response;

        // Extract key advice points for tracking
        const advicePoints =
          aiResponse
            .match(/\d+\.\s+([^\n]+)/g)
            ?.map((line) => line.replace(/^\d+\.\s+/, "").substring(0, 100)) ||
          [];

        await api.createCoachInteraction({
          userId: user.email,
          pillar: pillarId,
          userMessage: text,
          aiResponse: aiResponse,
          adviceGiven: advicePoints,
          contextData: context,
          timestamp: new Date().toISOString(),
        });

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setDailyMessageCount((prev) => prev + 1);
      }

      queryClient.invalidateQueries(["coachHistory"]);
      setShowAIThinking(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I'm having trouble responding right now. Please try again.",
        },
      ]);
      setShowAIThinking(false);
      toast.error("Failed to get response");
    }

    setIsLoading(false);
  };

  const handleQuickQuestion = (question) => {
    sendMessage(question);
  };

  if (!pillar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-base">Coach not found</p>
      </div>
    );
  }

  return (
    <>
      <AIThinkingOverlay
        isVisible={showAIThinking}
        message={aiThinkingMessage}
      />

      <div className="flex flex-col h-screen">
        {/* Header */}
        <div
          className="bg-white/5 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center gap-4"
          style={{ boxShadow: `0 0 20px ${pillar.color}30` }}
        >
          <button
            onClick={() => navigate(createPageUrl("CoachSelect"))}
            className="text-white/60 hover:text-white transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Back to coach selection"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{
              backgroundColor: `${pillar.color}30`,
              boxShadow: `0 0 15px ${pillar.color}40`,
            }}
          >
            {pillar.icon}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{pillar.coach}</h1>
            <p className="text-sm text-white/60">Your {pillar.name} expert</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/60">Messages today</div>
            <div
              className={`text-sm font-bold ${
                messagesRemaining <= 1 ? "text-red-400" : "text-[#D4AF37]"
              }`}
            >
              {messagesRemaining}/{messageLimit}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
          <div className="max-w-3xl mx-auto space-y-4">
            {adaptiveCoachProfile && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex flex-col gap-1">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/40">
                    Adaptive Coach Persona
                  </div>
                  <div className="text-white font-semibold text-lg">
                    {adaptiveCoachProfile.persona}
                  </div>
                  {adaptiveCoachProfile.summary && (
                    <p className="text-white/70 text-sm">
                      {adaptiveCoachProfile.summary}
                    </p>
                  )}
                </div>
                {adaptiveCoachProfile.priorityPillars?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-white/70">
                    {adaptiveCoachProfile.priorityPillars.map((pillar) => (
                      <li key={pillar.id}>
                        <span className="text-white font-semibold">
                          {pillar.name}:
                        </span>{" "}
                        {pillar.summary}
                      </li>
                    ))}
                  </ul>
                )}
                {adaptiveCoachProfile.alerts?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                    {adaptiveCoachProfile.alerts.map((alert) => (
                      <span
                        key={alert.id}
                        className="px-2 py-1 rounded-full bg-white/5 border border-white/10"
                      >
                        {alert.label}: {alert.severityLabel || "elevated"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl mb-4"
                  style={{
                    backgroundColor: `${pillar.color}20`,
                    boxShadow: `0 0 30px ${pillar.color}40`,
                  }}
                >
                  {pillar.icon}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Hello! I'm {pillar.coach}
                </h2>
                <p className="text-white/60 mb-6 text-base">
                  Ask me anything about {pillar.name.toLowerCase()}
                </p>

                <div className="flex flex-wrap gap-2 justify-center">
                  {pillar.quickQuestions.map((question, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(question)}
                      className="px-4 py-3 bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/20 transition-all text-sm font-medium min-h-[48px]"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, i) => (
              <div key={i}>
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628]">
                      <p className="text-base leading-relaxed font-medium">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ) : message.isPlan ? (
                  <div className="flex justify-start">
                    <div className="max-w-[95%]">
                      <PlanDisplay plan={message.content} pillar={pillar} />
                    </div>
                  </div>
                ) : message.isGoal ? (
                  <div className="flex justify-start">
                    <div className="max-w-[95%]">
                      <SmartGoalDisplay
                        goal={message.content}
                        pillar={pillar}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div
                      className="max-w-[85%] rounded-2xl px-4 py-3 bg-white/10 backdrop-blur-md border border-white/10 text-white"
                      style={{ boxShadow: `0 0 15px ${pillar.color}30` }}
                    >
                      <ReactMarkdown
                        className="text-base prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                        components={{
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0 leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-2 ml-4 list-disc">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-2 ml-4 list-decimal space-y-1">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="my-1">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold text-[#D4AF37]">
                              {children}
                            </strong>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2"
                  style={{ boxShadow: `0 0 15px ${pillar.color}30` }}
                >
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span className="text-white/60 text-sm">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="fixed bottom-20 left-0 right-0 bg-[#0A1628]/95 backdrop-blur-lg border-t border-white/10 px-6 py-4 safe-bottom">
          <div className="max-w-3xl mx-auto">
            {messagesRemaining <= 1 && (
              <div className="mb-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-center">
                <p className="text-orange-400 text-sm font-medium">
                  {messagesRemaining === 0
                    ? "⚠️ Daily limit reached"
                    : "⚠️ Last message for today"}
                  {!hasPremiumAccess &&
                    " • Upgrade or start your trial for 50 messages/day"}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={`Message ${pillar.coach}...`}
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none text-base"
                rows={1}
                disabled={isLoading || messagesRemaining === 0}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim() || messagesRemaining === 0}
                className="btn-primary min-h-[56px] min-w-[56px]"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
