import { z, ZodTypeAny } from "zod";

export type ReactSafe<T extends ZodTypeAny> = Readonly<z.infer<T>>;

const PILLAR_IDENTIFIERS = [
  "sleep",
  "diet",
  "exercise",
  "physical_health",
  "mental_health",
  "finances",
  "social",
  "spirituality",
] as const;

const AiAgentIdentifiers = [
  "coach",
  "daily-plan",
  "pillar-analysis",
  "weekly-reflection",
  "insights",
] as const;

const IsoDateTimeStringSchema = z
  .string()
  .datetime({ offset: true })
  .describe(
    "ISO-8601 timestamp with timezone information (e.g., 2024-06-30T12:34:56Z)."
  );

const DateOnlyStringSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
  .describe("Calendar date in YYYY-MM-DD format using UTC.");

const NullableNumberSchema = z
  .number()
  .finite()
  .nullable()
  .describe(
    "Optional numeric measurement that may be null when data is unavailable."
  );

export const PillarIdentifierSchema = z
  .enum(PILLAR_IDENTIFIERS)
  .describe(
    "Normalized identifier for one of the eight NorthStar wellness pillars."
  );

export type PillarIdentifier = z.infer<typeof PillarIdentifierSchema>;

const PillarResourceSchema = z
  .object({
    title: z
      .string()
      .describe("Human-friendly title for the supporting resource."),
    url: z
      .string()
      .url()
      .describe("HTTPS link that opens the external pillar resource."),
    type: z
      .enum(["article", "video", "tool", "course"])
      .describe("Media type classification used to sort resources."),
  })
  .describe("Supplemental learning material associated with a pillar.");

const NotificationSettingsSchema = z
  .object({
    email: z
      .boolean()
      .describe("Enable or disable email notifications for this user."),
    push: z
      .boolean()
      .describe("Enable or disable push notifications on supported devices."),
    sms: z
      .boolean()
      .describe("Enable or disable SMS notifications for urgent alerts."),
  })
  .describe("Channel-specific notification toggles under user settings.");

const PrivacySettingsSchema = z
  .object({
    profileVisibility: z
      .enum(["public", "friends", "private"])
      .describe(
        "Who can view the user's profile details inside the community."
      ),
    showActivity: z
      .boolean()
      .describe("Controls whether recent activity appears on timelines."),
    showStats: z
      .boolean()
      .describe("Controls whether overall stats appear on profile cards."),
  })
  .describe(
    "Privacy-related switches for controlling what the community can see."
  );

const PreferenceSettingsSchema = z
  .object({
    theme: z
      .enum(["light", "dark", "auto"])
      .describe("Preferred UI theme when rendering React views."),
    language: z
      .string()
      .describe("I18n locale code used for text translation."),
    timezone: z
      .string()
      .describe("IANA timezone identifier used for reminders and charts."),
    startOfWeek: z
      .enum(["sunday", "monday"])
      .describe("Week start preference that drives calendar visualizations."),
  })
  .describe("General UI and localization preferences captured for each user.");

const CoachingSettingsSchema = z
  .object({
    aiCoachEnabled: z
      .boolean()
      .describe("Enables proactive AI nudges for this account."),
    coachingFrequency: z
      .enum(["daily", "weekly", "asNeeded"])
      .describe("How often the user wants to hear from the AI coach."),
    focusAreas: z
      .array(PillarIdentifierSchema)
      .describe("Pillars the user explicitly asked the coach to prioritize."),
  })
  .describe("AI coaching configuration captured under user settings.");

const UserSettingsSchema = z
  .object({
    notifications: NotificationSettingsSchema.describe(
      "Per-channel notification preferences nested within settings."
    ),
    privacy: PrivacySettingsSchema.describe(
      "Privacy options governing what other users can see."
    ),
    preferences: PreferenceSettingsSchema.describe(
      "Localization and UX preferences configured by the user."
    ),
    coaching: CoachingSettingsSchema.describe(
      "AI coaching cadence and focus metadata."
    ),
  })
  .describe("Top-level container for every user-facing configuration option.");

const PillarProgressSchema = z
  .object({
    score: z
      .number()
      .min(0)
      .max(100)
      .describe("Latest normalized 0-100 score captured for the pillar."),
    lastUpdated: IsoDateTimeStringSchema.describe(
      "Timestamp of the most recent update applied to this pillar."
    ),
    isActive: z
      .boolean()
      .describe("Indicates whether the user is actively tracking this pillar."),
  })
  .describe("Per-pillar progress details stored on the user profile.");

const PillarProgressMapSchema = z
  .record(PillarIdentifierSchema, PillarProgressSchema)
  .describe("Map of pillar identifier to the user's latest progress snapshot.");

const UserBioSchema = z
  .object({
    age: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("Self-reported age that helps tailor plan intensity."),
    activityLevel: z
      .string()
      .optional()
      .describe("Short label describing how active the user is today."),
    focusAreas: z
      .array(PillarIdentifierSchema)
      .optional()
      .describe("Pillars that the user explicitly marked as focus areas."),
    occupation: z
      .string()
      .optional()
      .describe(
        "Optional occupation or life context text used for personalization."
      ),
  })
  .describe(
    "Optional biography data captured during onboarding and plan creation."
  );

const CombDimensionSchema = z
  .object({
    capability: z
      .number()
      .min(0)
      .max(10)
      .optional()
      .describe("Capability score (0-10) from COM-B onboarding."),
    opportunity: z
      .number()
      .min(0)
      .max(10)
      .optional()
      .describe("Opportunity score (0-10) from COM-B onboarding."),
    motivation: z
      .number()
      .min(0)
      .max(10)
      .optional()
      .describe("Motivation score (0-10) from COM-B onboarding."),
  })
  .describe("Subset of COM-B component scores used to rank priorities.");

const CombSchema = z
  .object({
    physicalCapability: CombDimensionSchema.optional().describe(
      "Physical capability metrics derived from onboarding questions."
    ),
    motivation: CombDimensionSchema.optional().describe(
      "Motivation-related COM-B scores guiding AI recommendations."
    ),
    opportunity: CombDimensionSchema.optional().describe(
      "Opportunity-related COM-B scores used to adjust action plans."
    ),
  })
  .describe("Full COM-B model snapshot stored on the user profile.");

const EntitlementSchema = z
  .object({
    plan: z
      .string()
      .describe("Commercial plan (free, basic, premium, nhs_referred, etc.)."),
    features: z
      .array(z.string())
      .describe("Flattened feature flags the user should have access to."),
  })
  .describe(
    "Resolved entitlement payload generated from subscription tier data."
  );

const AuthLockSchema = z
  .object({
    reason: z
      .string()
      .nullable()
      .describe(
        "Optional note detailing why the account is temporarily locked."
      ),
    lockedAt: IsoDateTimeStringSchema.nullable().describe(
      "Timestamp indicating when the lock began, if any."
    ),
    lockedUntil: IsoDateTimeStringSchema.nullable().describe(
      "Timestamp indicating when the lock automatically expires."
    ),
  })
  .describe("Metadata describing temporary authentication locks.");

const RefreshTokenRecordSchema = z
  .object({
    tokenId: z.string().describe("Opaque identifier for the refresh token."),
    expiresAt: IsoDateTimeStringSchema.describe(
      "When the refresh token will expire."
    ),
    createdAt: IsoDateTimeStringSchema.describe(
      "When the refresh token was issued."
    ),
    userAgent: z
      .string()
      .nullable()
      .describe("Recorded user agent string for the session."),
    ip: z
      .string()
      .nullable()
      .describe("Origin IP recorded for security auditing."),
  })
  .describe("Refresh token metadata used for revocation and auditing.");

export const UserSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Stable identifier returned as id/_id from the backend."),
    name: z.string().optional().describe("Optional display name or full name."),
    username: z
      .string()
      .min(3)
      .describe("Unique handle assigned to the user at signup."),
    email: z
      .string()
      .email()
      .describe(
        "Primary email address used for authentication and notifications."
      ),
    role: z
      .enum(["user", "admin", "nhs_referral_patient"])
      .describe("Authorization role that gates admin-only features."),
    subscriptionTier: z
      .enum(["free", "basic", "premium", "nhs_referred"])
      .describe("Commercial subscription tier currently applied to the user."),
    entitlements: EntitlementSchema.describe(
      "Derived feature entitlements computed from the subscription tier."
    ),
    allowedPillars: z
      .array(PillarIdentifierSchema)
      .describe(
        "Pillar identifiers unlocked for this user based on plan or referrals."
      ),
    selectedPillars: z
      .array(PillarIdentifierSchema)
      .optional()
      .describe(
        "Optional user-selected subset of pillars pinned on dashboards."
      ),
    pillars: PillarProgressMapSchema.describe(
      "Per-pillar progress map including score and last updated timestamp."
    ),
    settings: UserSettingsSchema.describe(
      "All notification, privacy, preference, and coaching settings."
    ),
    bio: UserBioSchema.optional().describe(
      "Optional onboarding biography used for personalization."
    ),
    comb: CombSchema.optional().describe(
      "Captured COM-B scores used by prioritization logic."
    ),
    currentStreak: z
      .number()
      .min(0)
      .describe("Most recent streak count across all logged entries."),
    longestStreak: z
      .number()
      .min(0)
      .describe("Historical longest streak captured for the user."),
    badges: z
      .array(z.string())
      .describe(
        "Badge identifiers earned through achievements and milestones."
      ),
    aiConsent: z
      .boolean()
      .describe(
        "Indicates whether user granted consent for AI personalization."
      ),
    consentTimestamp: IsoDateTimeStringSchema.nullable().describe(
      "When the latest AI consent was recorded, if applicable."
    ),
    consentVersion: z
      .string()
      .nullable()
      .describe("Version of the consent agreement the user accepted."),
    linkedProviders: z
      .array(z.string())
      .describe("List of OAuth provider identifiers linked to this account."),
    refreshTokens: z
      .array(RefreshTokenRecordSchema)
      .optional()
      .describe("Refresh token records that remain valid for this account."),
    authLock: AuthLockSchema.optional().describe(
      "Optional auth lock metadata when access is restricted."
    ),
    isActive: z
      .boolean()
      .describe("Indicates whether the account is currently active."),
    lastLoginAt: IsoDateTimeStringSchema.nullable().describe(
      "Timestamp for the most recent successful login."
    ),
    lastFailedLoginAt: IsoDateTimeStringSchema.nullable().describe(
      "Timestamp for the most recent failed login attempt."
    ),
    lastFailedOtpAt: IsoDateTimeStringSchema.nullable().describe(
      "Timestamp for the most recent failed OTP attempt."
    ),
    failedLoginAttempts: z
      .number()
      .min(0)
      .describe("Counter used for account lock heuristics when logins fail."),
    failedOtpAttempts: z
      .number()
      .min(0)
      .describe(
        "Counter used for OTP lock heuristics when verifications fail."
      ),
    createdAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the user record was created."
    ),
    updatedAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the user record was last updated."
    ),
  })
  .describe(
    "Complete shape for authenticated user objects returned by the API."
  );

export type User = z.infer<typeof UserSchema>;
export type UserProps = ReactSafe<typeof UserSchema>;

export const PillarSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Database identifier for the pillar record."),
    name: z
      .string()
      .describe("Human-readable name shown in the UI (e.g., Sleep)."),
    identifier: PillarIdentifierSchema.describe(
      "Normalized programmatic ID for the pillar."
    ),
    description: z
      .string()
      .describe(
        "Short marketing description explaining why the pillar matters."
      ),
    icon: z
      .string()
      .describe("Emoji or icon identifier representing the pillar."),
    color: z
      .string()
      .describe("HEX color used to theme cards for this pillar."),
    category: z
      .enum(["physical", "mental", "lifestyle"])
      .describe("High-level grouping for analytics and filtering."),
    order: z
      .number()
      .describe("Sort order used when rendering the pillar grid."),
    isActive: z
      .boolean()
      .describe("Controls whether the pillar is available to end users."),
    tips: z
      .array(z.string())
      .describe("Optional quick tips curated for the pillar."),
    resources: z
      .array(PillarResourceSchema)
      .describe("Optional list of learning resources attached to the pillar."),
    createdAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the pillar definition was created."
    ),
    updatedAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the pillar definition last changed."
    ),
  })
  .describe("Metadata used to render pillars across the experience.");

export type Pillar = z.infer<typeof PillarSchema>;
export type PillarProps = ReactSafe<typeof PillarSchema>;

export const PlanChecklistSchema = z
  .object({
    planTitle: z.string().describe("AI-generated or user-authored plan title."),
    planDescription: z
      .string()
      .describe("Inspirational description surfaced to the user."),
    dailyActions: z
      .array(z.string())
      .describe("List of recurring daily actions recommended by the plan."),
    weeklyActions: z
      .array(z.string())
      .describe("List of recurring weekly actions recommended by the plan."),
    successMetrics: z
      .array(z.string())
      .describe("Qualitative or quantitative metrics indicating success."),
  })
  .describe("Content payload returned from AI when generating a plan.");

export type PlanChecklist = z.infer<typeof PlanChecklistSchema>;

export const PlanSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Unique plan identifier used across routes."),
    userId: z
      .string()
      .optional()
      .describe("Identifier for the user that owns the plan, when available."),
    pillar: PillarIdentifierSchema.describe(
      "Pillar this plan targets for change."
    ),
    planTitle: z
      .string()
      .describe("Marketing-friendly plan name shown on cards."),
    planDescription: z
      .string()
      .describe("Supportive description summarizing the plan's intent."),
    smartGoalIds: z
      .array(z.string())
      .describe("IDs for SmartGoals linked to this plan for tracking.")
      .optional(),
    goals: z
      .array(z.string())
      .describe("Legacy free-form goals retained for backward compatibility."),
    dailyActions: z
      .array(z.string())
      .describe("Daily action checklist backing the habit widgets."),
    weeklyActions: z
      .array(z.string())
      .describe("Weekly action checklist backing the schedule widgets."),
    successMetrics: z
      .array(z.string())
      .describe("Outcome metrics the user can monitor for progress."),
    linkedGoalsCount: z
      .number()
      .min(0)
      .describe("Count of SmartGoals currently connected to this plan."),
    completionProgress: z
      .number()
      .min(0)
      .max(100)
      .describe("Overall completion percentage derived from linked goals."),
    startDate: DateOnlyStringSchema.optional().describe(
      "Date when the user activated the plan in YYYY-MM-DD format."
    ),
    endDate: DateOnlyStringSchema.optional().describe(
      "Optional date when the plan was archived or completed."
    ),
    isActive: z
      .boolean()
      .describe("True while the plan is actively being followed."),
    checklist: PlanChecklistSchema.optional().describe(
      "Most recent AI-generated content payload for the plan."
    ),
    linkedHabits: z
      .array(z.string())
      .optional()
      .describe("IDs of habits auto-created from plan daily actions."),
    createdAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the plan record was created."
    ),
    updatedAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the plan record last changed."
    ),
  })
  .describe("Normalized structure shared across plan-related pages and APIs.");

export type Plan = z.infer<typeof PlanSchema>;
export type PlanProps = ReactSafe<typeof PlanSchema>;

const PlanActionSchema = z
  .object({
    id: z
      .string()
      .optional()
      .describe("Optional identifier for the plan action."),
    text: z.string().describe("Action text rendered in plan summaries."),
    completed: z
      .boolean()
      .optional()
      .describe("Indicates whether the action has been completed."),
  })
  .describe("Atomic checklist entry associated with an action plan.");

export const ActionPlanSchema = z
  .object({
    id: z
      .string()
      .optional()
      .describe("Optional identifier for the action plan."),
    pillarId: PillarIdentifierSchema.optional().describe(
      "Pillar identifier that the plan focuses on."
    ),
    createdAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the action plan was generated."
    ),
    updatedAt: IsoDateTimeStringSchema.optional().describe(
      "Timestamp when the action plan last changed."
    ),
    actions: z
      .array(PlanActionSchema)
      .describe("List of actionable steps recommended to the user."),
  })
  .passthrough()
  .describe("Simplified action-plan payload returned from legacy APIs.");

export type ActionPlan = z.infer<typeof ActionPlanSchema>;
export type ActionPlanProps = ReactSafe<typeof ActionPlanSchema>;

export const SmartGoalSchema = z
  .object({
    id: z.string().min(1).describe("Unique SmartGoal identifier."),
    pillar: PillarIdentifierSchema.describe(
      "Pillar that the SmartGoal contributes toward."
    ),
    goalStatement: z
      .string()
      .describe("Primary statement describing the desired outcome."),
    specific: z
      .string()
      .optional()
      .describe("Specific component of the SMART framework."),
    measurable: z
      .string()
      .optional()
      .describe("Measurable component of the SMART framework."),
    achievable: z
      .string()
      .optional()
      .describe("Achievable component of the SMART framework."),
    relevant: z
      .string()
      .optional()
      .describe("Relevant component of the SMART framework."),
    timeBound: z
      .string()
      .optional()
      .describe("Time-bound component of the SMART framework."),
    linkedPlanId: z
      .string()
      .optional()
      .describe("ID of the life plan the goal is linked to, if any."),
    progress: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe("Percent progress toward completion."),
    created_by: z
      .string()
      .optional()
      .describe("Owner identifier for the SmartGoal."),
    created_date: IsoDateTimeStringSchema.optional().describe(
      "Timestamp when the SmartGoal was created."
    ),
    updated_date: IsoDateTimeStringSchema.optional().describe(
      "Timestamp when the SmartGoal last changed."
    ),
    checklist: PlanChecklistSchema.optional().describe(
      "Optional AI-generated checklist backing the goal."
    ),
  })
  .passthrough()
  .describe("Normalized SmartGoal record shared across goal flows.");

export type SmartGoal = z.infer<typeof SmartGoalSchema>;
export type SmartGoalProps = ReactSafe<typeof SmartGoalSchema>;

export const HabitSchema = z
  .object({
    id: z.string().min(1).describe("Unique habit identifier."),
    userId: z
      .string()
      .describe("Owner of the habit, typically the user's email or ID."),
    pillar: PillarIdentifierSchema.describe(
      "Pillar that contextualizes the habit."
    ),
    habitText: z
      .string()
      .describe("User-facing habit description shown in UI lists."),
    name: z
      .string()
      .optional()
      .describe("Legacy habit name field kept for compatibility."),
    frequency: z
      .enum(["daily", "weekly", "custom"])
      .optional()
      .describe("Cadence describing how often the habit should be completed."),
    reminderTime: z
      .string()
      .optional()
      .describe("Preferred reminder time in HH:mm, if reminders are enabled."),
    linkedPlanId: z
      .string()
      .optional()
      .describe("ID of the plan that spawned this habit, when applicable."),
    isActive: z
      .boolean()
      .describe("Indicates whether the habit is currently trackable."),
    streakCount: z
      .number()
      .min(0)
      .describe("Current streak in days for this habit."),
    bestStreak: z
      .number()
      .min(0)
      .describe("Best historical streak achieved for this habit."),
    completionDates: z
      .array(DateOnlyStringSchema)
      .describe("Dates (YYYY-MM-DD) when the habit was marked complete."),
    totalCompletions: z
      .number()
      .min(0)
      .describe("Lifetime number of times the habit has been completed."),
    createdAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the habit was created."
    ),
    updatedAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the habit last changed."
    ),
  })
  .describe("Habits derived from plans or created manually by users.");

export type Habit = z.infer<typeof HabitSchema>;
export type HabitProps = ReactSafe<typeof HabitSchema>;

export const EntrySchema = z
  .object({
    id: z.string().min(1).describe("Unique entry identifier."),
    userId: z.string().describe("Owner of the entry."),
    pillar: PillarIdentifierSchema.describe(
      "Pillar the entry is associated with."
    ),
    date: DateOnlyStringSchema.describe(
      "Date the entry was logged (YYYY-MM-DD)."
    ),
    score: z
      .number()
      .min(0)
      .max(100)
      .describe("Normalized 0-100 score representing this entry."),
    notes: z
      .string()
      .nullable()
      .describe("Optional free-form notes saved with the entry."),
    metadata: z
      .record(z.string(), z.unknown())
      .describe("Flexible metadata blob for storing sensor data or tags."),
    createdAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the entry was created."
    ),
    updatedAt: IsoDateTimeStringSchema.describe(
      "Timestamp when the entry was last updated."
    ),
  })
  .describe("Daily pillar entry used for scoring, insights, and trends.");

export type Entry = z.infer<typeof EntrySchema>;
export type EntryProps = ReactSafe<typeof EntrySchema>;

export const ConnectionSchema = z
  .object({
    id: z.string().min(1).describe("Unique connection identifier."),
    userId: z.string().describe("Email or ID for the user who initiated."),
    friendEmail: z
      .string()
      .describe("Email for the invited or connected friend."),
    friendName: z
      .string()
      .nullable()
      .optional()
      .describe("Optional display name for the friend."),
    nickname: z
      .string()
      .nullable()
      .optional()
      .describe("User-defined nickname for the connection."),
    status: z
      .enum(["pending", "accepted", "blocked"])
      .describe("Current status of the connection."),
    created_date: IsoDateTimeStringSchema.describe(
      "Timestamp when the connection request was created."
    ),
    updated_date: IsoDateTimeStringSchema.optional().describe(
      "Timestamp when the connection last changed."
    ),
  })
  .passthrough()
  .describe("Friend or connection relationship between two users.");

export type Connection = z.infer<typeof ConnectionSchema>;
export type ConnectionProps = ReactSafe<typeof ConnectionSchema>;

const TimelineEventTypeSchema = z
  .enum([
    "check-in",
    "pillar-score",
    "action-plan",
    "challenge-start",
    "challenge-end",
    "ai-recommendation",
  ])
  .describe("Supported event types that can appear on the user timeline.");

export const TimelineItemSchema = z
  .object({
    id: z
      .string()
      .optional()
      .describe("Optional stable identifier for the timeline event."),
    type: TimelineEventTypeSchema.describe(
      "Event category used for iconography and grouping."
    ),
    date: IsoDateTimeStringSchema.describe(
      "Timestamp associated with the timeline event."
    ),
    pillarId: PillarIdentifierSchema.nullable().describe(
      "Pillar tied to the event, if the data is pillar-specific."
    ),
    value: NullableNumberSchema.describe(
      "Numeric metric (score, value, etc.) attached to the event."
    ),
    note: z
      .string()
      .nullable()
      .describe("Human-readable note or caption explaining the event."),
    sourceId: z
      .string()
      .optional()
      .describe(
        "Backend identifier that produced the event (check-in id, challenge id, etc.)."
      ),
    metadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Structured metadata payload for rendering advanced cards."),
  })
  .describe("Unified representation of events surfaced in the Timeline page.");

export type TimelineItem = z.infer<typeof TimelineItemSchema>;
export type TimelineItemProps = ReactSafe<typeof TimelineItemSchema>;

export const AIRecommendationSchema = z
  .object({
    id: z
      .string()
      .optional()
      .describe("Optional identifier for persisting the recommendation."),
    agent: z
      .enum(AiAgentIdentifiers)
      .describe("AI agent responsible for generating the recommendation."),
    focus: z
      .string()
      .describe(
        "Natural-language description of the focus area (e.g., Sleep Recovery)."
      ),
    primaryPillars: z
      .array(PillarIdentifierSchema)
      .describe("Pillars that the AI determined should be prioritized."),
    summary: z
      .string()
      .describe("High-level summary of what the user should pay attention to."),
    encouragement: z
      .string()
      .optional()
      .describe("Supportive motivational message delivered by the AI."),
    actionItems: z
      .array(z.string())
      .describe("List of concrete actions recommended by the AI."),
    nextSteps: z
      .string()
      .optional()
      .describe("Optional follow-up guidance for the next check-in."),
    reason: z
      .string()
      .optional()
      .describe("Explanation of why the AI chose these pillars or actions."),
    generatedAt: IsoDateTimeStringSchema.describe(
      "Timestamp indicating when the AI response was generated."
    ),
    metadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        "Raw auxiliary data (scores, context) attached to the recommendation."
      ),
    raw: z
      .unknown()
      .optional()
      .describe("Unparsed AI payload retained for debugging or auditing."),
  })
  .describe(
    "Normalized payload representing AI coaching or insight recommendations."
  );

export type AIRecommendation = z.infer<typeof AIRecommendationSchema>;
export type AIRecommendationProps = ReactSafe<typeof AIRecommendationSchema>;
