import { api } from "@/utils/apiClient";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl, getPillarsArray } from "@/utils";
import {
  Target,
  ChevronRight,
  Calendar,
  Sparkles,
  X,
  Loader2,
  TrendingUp,
  CheckCircle2,
  ArrowLeft,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AIThinkingOverlay from "@/ai/AIThinkingOverlay";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  PlanChecklistSchema,
  PlanSchema,
  SmartGoalSchema,
  UserSchema,
  type PlanChecklist,
  type PlanProps,
  type SmartGoalProps,
  type UserProps,
} from "@/models";
import { arrayFromPayload, parseArrayAs, parseAs } from "@/models/runtime";
import { sanitizeText } from "@/utils/security";

const PILLAR_QUESTIONS = {
  sleep: [
    "What are your main sleep challenges?",
    "What time do you typically go to bed?",
    "How many hours would you like to sleep?",
  ],
  diet: [
    "What are your nutrition goals?",
    "What dietary habits would you like to change?",
    "Any specific foods you want to include or avoid?",
  ],
  exercise: [
    "What's your current fitness level?",
    "What type of exercise do you enjoy?",
    "How many days per week can you commit to exercise?",
  ],
  physical_health: [
    "What health goals are most important to you?",
    "Any specific health concerns?",
    "What wellness practices interest you?",
  ],
  mental_health: [
    "What mental wellness goals do you have?",
    "What helps you manage stress?",
    "What self-care practices interest you?",
  ],
  finances: [
    "What are your main financial goals?",
    "What spending habits would you like to change?",
    "What's your timeline for financial goals?",
  ],
  social: [
    "What social connection goals do you have?",
    "What types of relationships would you like to strengthen?",
    "How often would you like meaningful social interactions?",
  ],
  spirituality: [
    "What does spirituality mean to you?",
    "What spiritual practices interest you?",
    "What gives you a sense of purpose?",
  ],
};
type PillarOption = ReturnType<typeof getPillarsArray>[number];

type CreatePlanModalProps = {
  pillar: PillarOption;
  onClose: () => void;
  onSuccess: (plan: PlanProps) => void;
  user: UserProps | null;
};

type GoalAnswerMap = Record<number, string>;

const safeText = (value: unknown, fallback = "") =>
  sanitizeText(value, fallback);

function CreatePlanModal({
  pillar,
  onClose,
  onSuccess,
  user,
}: CreatePlanModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<GoalAnswerMap>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<PlanChecklist | null>(
    null
  );
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [goalSearchQuery, setGoalSearchQuery] = useState("");

  const questions = PILLAR_QUESTIONS[pillar.id] || [];

  // Fetch user's existing SmartGoals for this pillar
  const { data: availableGoals = [] } = useQuery<ReadonlyArray<SmartGoalProps>>(
    {
      queryKey: ["smartGoals", pillar.id],
      queryFn: async () => {
        if (!user?.email) {
          return [];
        }
        const response = await api.getGoals({
          pillar: pillar.id,
          created_by: user.email,
        });
        const normalized = arrayFromPayload(response);
        return parseArrayAs(SmartGoalSchema, normalized);
      },
      enabled: !!user?.email && step === 2,
      initialData: [] as SmartGoalProps[],
    }
  );

  const filteredGoals = availableGoals.filter((goal) => {
    const normalizedQuery = goalSearchQuery.toLowerCase();
    const statement = goal.goalStatement?.toLowerCase() ?? "";
    const specific = goal.specific?.toLowerCase() ?? "";
    return (
      statement.includes(normalizedQuery) || specific.includes(normalizedQuery)
    );
  });

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers({ ...answers, [questionIndex]: value });
  };

  const handleNext = async () => {
    if (step === 1) {
      // Check if all questions are answered
      const allAnswered = questions.every((_, idx) => answers[idx]?.trim());
      if (allAnswered) {
        setStep(2);
      } else {
        toast.error("Please answer all questions before proceeding.");
      }
    } else if (step === 2) {
      await generatePlan();
    }
  };

  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const generatePlan = async () => {
    setIsGenerating(true);

    try {
      const answersText = Object.entries(answers)
        .map(([idx, ans]) => `Q: ${questions[idx]}\nA: ${ans}`)
        .join("\n\n");

      const userContext = user?.bio
        ? `
User Profile:
- Age: ${user.bio.age || "unknown"}
- Activity Level: ${user.bio.activityLevel || "unknown"}
- Physical Energy: ${user.comb?.physicalCapability?.energy || "unknown"}/5
- Motivation Level: ${user.comb?.motivation?.motivationLevel || "unknown"}/5
`
        : "";

      const prompt = `You are an expert ${pillar.name} coach creating a personalized plan.

${userContext}

User's responses:
${answersText}

Selected Goals: ${selectedGoalIds.length} SmartGoals already linked

Create a comprehensive, actionable plan that is warm, supportive, and realistic. The user is building habits step by step.

CRITICAL: Respond with ONLY a valid JSON object. No text before/after. No markdown. No backticks.

JSON structure:
{
  "planTitle": "Compelling plan title (5-8 words)",
  "planDescription": "Brief inspiring description (2-3 sentences)",
  "dailyActions": ["action1", "action2", "action3", "action4"],
  "weeklyActions": ["action1", "action2"],
  "successMetrics": ["metric1", "metric2", "metric3"]
}

Make actions small, specific, and achievable. Focus on habit formation. Be encouraging and realistic.`;

      const response = await api.aiCoach({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            planTitle: { type: "string" },
            planDescription: { type: "string" },
            dailyActions: { type: "array", items: { type: "string" } },
            weeklyActions: { type: "array", items: { type: "string" } },
            successMetrics: { type: "array", items: { type: "string" } },
          },
          required: ["planTitle", "planDescription", "dailyActions"],
        },
      });

      const aiPayload = (response as { output?: unknown })?.output ?? response;
      const normalizedPlan = parseAs(PlanChecklistSchema, aiPayload);
      setGeneratedPlan(normalizedPlan);
      setStep(3);
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error("Failed to generate plan");
    }

    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!generatedPlan) return;

    setIsGenerating(true);

    try {
      const today = format(new Date(), "yyyy-MM-dd");

      // Create the LifePlan with linked SmartGoal IDs
      const planResponse = await api.createPlan({
        pillar: pillar.id,
        planTitle: generatedPlan.planTitle,
        planDescription: generatedPlan.planDescription,
        smartGoalIds: selectedGoalIds,
        goals: [], // Empty for new plans (legacy support, smart goals are now preferred)
        dailyActions: generatedPlan.dailyActions || [],
        weeklyActions: generatedPlan.weeklyActions || [],
        successMetrics: generatedPlan.successMetrics || [],
        isActive: true,
        startDate: today,
        linkedGoalsCount: selectedGoalIds.length,
      });
      const createdPlan = parseAs(PlanSchema, planResponse);

      // Update selected SmartGoals to link back to this plan
      if (selectedGoalIds.length > 0) {
        await Promise.all(
          selectedGoalIds.map((goalId) =>
            api.updateGoal(goalId, { linkedPlanId: createdPlan.id })
          )
        );
      }

      // Create habits from daily actions
      if (generatedPlan.dailyActions && generatedPlan.dailyActions.length > 0) {
        const habitPromises = generatedPlan.dailyActions.map((action) =>
          api.createHabit({
            userId: user.email,
            habitText: action,
            pillar: pillar.id,
            linkedPlanId: createdPlan.id,
            frequency: "daily",
            reminderTime: "09:00",
            streakCount: 0,
            isActive: true,
          })
        );
        await Promise.all(habitPromises);
      }

      queryClient.invalidateQueries(["lifePlans"]);
      queryClient.invalidateQueries(["habits"]);
      queryClient.invalidateQueries(["smartGoals", pillar.id]); // Invalidate smart goals query too

      toast.success("Plan created! 🎉");
      onSuccess(createdPlan);
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan");
      setIsGenerating(false);
    }
  };

  return (
    <>
      <AIThinkingOverlay
        isVisible={isGenerating}
        message="NorthStar is crafting your personalized plan..."
      />

      <div className="fixed inset-0 z-50 bg-[#0A1628]/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto animate-in fade-in duration-200">
        <div
          className="bg-[#1a1f35] border border-white/20 rounded-2xl p-6 max-w-2xl w-full my-8"
          style={{ boxShadow: `0 0 40px ${pillar.color}60` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: `${pillar.color}20`,
                  boxShadow: `0 0 15px ${pillar.color}40`,
                }}
              >
                {pillar.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Create {pillar.name} Plan
                </h2>
                <p className="text-white/60 text-sm">Step {step} of 3</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Step 1: Answer Questions */}
          {step === 1 && (
            <div className="space-y-6">
              <p className="text-white/80 mb-6">
                Answer a few questions to help us create the perfect plan for
                you.
              </p>

              {questions.map((question, idx) => (
                <div key={idx}>
                  <Label className="text-white mb-2 block font-bold">
                    {idx + 1}. {question}
                  </Label>
                  <Textarea
                    value={answers[idx] || ""}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder="Your answer..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    rows={3}
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg disabled:opacity-50"
                  disabled={
                    Object.keys(answers).length < questions.length ||
                    isGenerating
                  }
                  style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
                >
                  Next: Select Goals
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Select Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Link Existing Goals (Optional)
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  Select SmartGoals to link to this plan. Progress will be
                  tracked automatically.
                </p>

                {availableGoals.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          type="text"
                          placeholder="Search goals..."
                          value={goalSearchQuery}
                          onChange={(e) => setGoalSearchQuery(e.target.value)}
                          className="bg-white/10 border-white/20 text-white pl-10"
                        />
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 bg-white/5 rounded-xl p-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                      {filteredGoals.map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => toggleGoalSelection(goal.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedGoalIds.includes(goal.id)
                              ? "bg-[#D4AF37]/20 border-[#D4AF37] ring-2 ring-[#D4AF37]/40"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                selectedGoalIds.includes(goal.id)
                                  ? "bg-[#D4AF37] border-[#D4AF37]"
                                  : "border-white/40"
                              }`}
                            >
                              {selectedGoalIds.includes(goal.id) && (
                                <CheckCircle2 className="w-3 h-3 text-[#0A1628]" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold text-sm italic leading-tight">
                                "{safeText(goal.goalStatement)}"
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]"
                                    style={{ width: `${goal.progress || 0}%` }}
                                  />
                                </div>
                                <span className="text-xs text-white/60">
                                  {goal.progress || 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <p className="text-xs text-white/40 mt-3">
                      {selectedGoalIds.length} goal
                      {selectedGoalIds.length !== 1 ? "s" : ""} selected
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8 bg-white/5 rounded-xl">
                    <Target className="w-12 h-12 mx-auto mb-3 text-white/40" />
                    <p className="text-white/60 text-sm">
                      No existing goals for this pillar yet.
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      You can create goals after your plan is ready.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  disabled={isGenerating}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg disabled:opacity-50"
                  disabled={isGenerating}
                  style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      Generate Plan
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review Generated Plan */}
          {step === 3 && generatedPlan && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {safeText(generatedPlan.planTitle)}
                </h3>
                <p className="text-white/80 leading-relaxed">
                  {safeText(generatedPlan.planDescription)}
                </p>
              </div>

              {selectedGoalIds.length > 0 && (
                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[#D4AF37]" />
                    <h4 className="font-semibold text-white">Linked Goals</h4>
                  </div>
                  <p className="text-white/70 text-sm">
                    {selectedGoalIds.length} SmartGoal
                    {selectedGoalIds.length !== 1 ? "s" : ""} will be linked to
                    this plan
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <h4 className="font-semibold text-white">Daily Actions</h4>
                  </div>
                  <ul className="space-y-2">
                    {generatedPlan.dailyActions.map((action, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-white/80 text-sm"
                      >
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{safeText(action)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {generatedPlan.weeklyActions &&
                  generatedPlan.weeklyActions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <h4 className="font-semibold text-white">
                          Weekly Actions
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {generatedPlan.weeklyActions.map((action, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-white/80 text-sm"
                          >
                            <span className="text-blue-400 mt-0.5">→</span>
                            <span>{safeText(action)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {generatedPlan.successMetrics &&
                  generatedPlan.successMetrics.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        <h4 className="font-semibold text-white">
                          Success Metrics
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {generatedPlan.successMetrics.map((metric, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-white/80 text-sm"
                          >
                            <span className="text-purple-400 mt-0.5">📊</span>
                            <span>{safeText(metric)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  disabled={isGenerating}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold hover:shadow-lg disabled:opacity-50"
                  disabled={isGenerating}
                  style={{ boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving Plan...
                    </>
                  ) : (
                    <>
                      Create Plan
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function MyPlans() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProps | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<PillarOption | null>(
    null
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const pillarsArray = useMemo(() => getPillarsArray(), []);

  useEffect(() => {
    let mounted = true;
    async function getUser() {
      try {
        const currentUser = await api.authMe();
        if (!mounted) return;
        setUser(parseAs(UserSchema, currentUser));
      } catch (error) {
        console.error("Error loading user profile", error);
        toast.error("Unable to load your profile");
      }
    }
    getUser();
    return () => {
      mounted = false;
    };
  }, []);

  const {
    data: plans = [],
    isLoading,
    isFetching,
  } = useQuery<ReadonlyArray<PlanProps>>({
    queryKey: ["lifePlans", user?.email],
    queryFn: async () => {
      if (!user?.email) {
        return [];
      }
      const response = await api.getPlans({ created_by: user.email });
      const normalized = arrayFromPayload(response);
      return parseArrayAs(PlanSchema, normalized);
    },
    enabled: !!user?.email,
    initialData: [] as PlanProps[],
  });

  const activePlans = plans.filter((p) => p.isActive);
  const completedPlans = plans.filter((p) => !p.isActive);

  const handlePillarSelect = (pillar: PillarOption) => {
    setSelectedPillar(pillar);
    setShowCreator(true);
  };

  const handleSuccess = (createdPlan: PlanProps) => {
    setShowCreator(false);
    setSelectedPillar(null);
    setShowSuccess(true);
    // Invalidation already handled in CreatePlanModal, but keep here for robustness if needed.
    // queryClient.invalidateQueries(['lifePlans']);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D4AF37]/20 animate-pulse" />
          <p className="text-white/60">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(createPageUrl("MyGrowth"))}
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-[#4CC9F0]" />
              My Plans
            </h1>
            <p className="text-white/60 text-sm">
              AI-powered transformation roadmaps
            </p>
          </div>
        </div>

        {/* Success message */}
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500/40 rounded-2xl p-4 text-center animate-in slide-in-from-top duration-300">
            <p className="text-green-400 font-bold">
              ✓ Plan created successfully!
            </p>
          </div>
        )}

        {plans.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 max-w-2xl mx-auto">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#4CC9F0]" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Create Your First Plan
              </h2>
              <p className="text-white/70 mb-8">
                Choose a life pillar to get started with AI-powered guidance
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {pillarsArray.map((pillar) => (
                  <button
                    key={pillar.id}
                    onClick={() => handlePillarSelect(pillar)}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all hover:-translate-y-1 group"
                    style={{ boxShadow: `0 0 15px ${pillar.color}30` }}
                  >
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center text-3xl"
                      style={{
                        backgroundColor: `${pillar.color}20`,
                        boxShadow: `0 0 10px ${pillar.color}40`,
                      }}
                    >
                      {pillar.icon}
                    </div>
                    <div className="text-white font-bold text-sm group-hover:text-[#D4AF37] transition-colors">
                      {pillar.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {activePlans.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  Active Plans ({activePlans.length})
                </h2>
                <div className="space-y-3">
                  {activePlans.map((plan) => {
                    const pillar = pillarsArray.find(
                      (p) => p.id === plan.pillar
                    );
                    if (!pillar) return null; // Should not happen if data is consistent
                    return (
                      <Link
                        key={plan.id}
                        to={createPageUrl("PlanDetail") + `?id=${plan.id}`}
                        className="block bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all hover:-translate-y-1 group"
                        style={{ boxShadow: `0 0 20px ${pillar.color}30` }}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                            style={{
                              backgroundColor: `${pillar.color}20`,
                              boxShadow: `0 0 15px ${pillar.color}40`,
                            }}
                          >
                            {pillar.icon}
                          </div>

                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#D4AF37] transition-colors">
                              {safeText(plan.planTitle)}
                            </h3>
                            <p className="text-white/70 text-sm mb-3 line-clamp-2">
                              {safeText(plan.planDescription)}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-white/60">
                              {plan.startDate && (
                                <>
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    Started{" "}
                                    {format(new Date(plan.startDate), "MMM d")}
                                  </span>
                                </>
                              )}
                              {plan.linkedGoalsCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#D4AF37]">
                                    {plan.linkedGoalsCount} linked goal
                                    {plan.linkedGoalsCount !== 1 ? "s" : ""}
                                  </span>
                                </>
                              )}
                              {plan.completionProgress > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-400">
                                    {plan.completionProgress}% complete
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0 mt-1 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">
                Create New Plan
                    key={pillar.id}
                    onClick={() => handlePillarSelect(pillar)}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all hover:-translate-y-1 group"
                    style={{ boxShadow: `0 0 15px ${pillar.color}30` }}
                  >
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center text-3xl"
                      style={{
                        backgroundColor: `${pillar.color}20`,
                        boxShadow: `0 0 10px ${pillar.color}40`,
                      }}
                    >
                      {pillar.icon}
                    </div>
                    <div className="text-white font-bold text-sm group-hover:text-[#D4AF37] transition-colors">
                      {pillar.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {completedPlans.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  Completed Plans ({completedPlans.length})
                </h2>
                <div className="space-y-3 opacity-60">
                  {completedPlans.map((plan) => {
                    const pillar = pillarsArray.find(
                      (p) => p.id === plan.pillar
                    );
                    if (!pillar) return null;
                    return (
                      <Link
                        key={plan.id}
                        to={createPageUrl("PlanDetail") + `?id=${plan.id}`}
                        className="block bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 grayscale"
                            style={{
                              backgroundColor: `${pillar.color}20`,
                            }}
                          >
                            {pillar.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-bold">
                              {safeText(plan.planTitle)}
                            </h3>
                            <p className="text-white/60 text-xs">Inactive</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/40" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreator && selectedPillar && (
        <CreatePlanModal
          pillar={selectedPillar}
          onClose={() => {
            setShowCreator(false);
            setSelectedPillar(null);
          }}
          onSuccess={handleSuccess}
          user={user}
        />
      )}
    </div>
  );
}
