import { z } from "zod";

/**
 * Validation Middleware
 *
 * Uses Zod for runtime type validation of request data.
 * Validates req.body, req.query, and req.params against provided schemas.
 */

/**
 * Create validation middleware from Zod schemas
 * @param {Object} schemas - Object containing body, query, params schemas
 * @returns {Function} Express middleware
 */
export const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      // Validate request body
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      // Validate URL parameters
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
};

// ==================== COMMON VALIDATION SCHEMAS ====================

// User validation schemas
export const userSchemas = {
  register: z.object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name too long"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username too long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      )
      .optional(),
  }),

  login: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),

  updateProfile: z.object({
    name: z.string().min(2).max(50).optional(),
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),
    avatar: z.string().url().optional(),
    settings: z
      .object({
        notifications: z
          .object({
            email: z.boolean().optional(),
            push: z.boolean().optional(),
            sms: z.boolean().optional(),
            frequency: z
              .enum(["realtime", "daily", "weekly", "never"])
              .optional(),
            quietHours: z
              .object({
                start: z
                  .string()
                  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
                  .optional(),
                end: z
                  .string()
                  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
                  .optional(),
              })
              .optional(),
          })
          .optional(),
        privacy: z
          .object({
            profileVisibility: z
              .enum(["public", "friends", "private"])
              .optional(),
            activitySharing: z.boolean().optional(),
            allowFriendRequests: z.boolean().optional(),
          })
          .optional(),
        preferences: z
          .object({
            theme: z.enum(["light", "dark", "system"]).optional(),
            language: z.string().length(2).optional(),
            timezone: z.string().optional(),
            measurementSystem: z.enum(["metric", "imperial"]).optional(),
          })
          .optional(),
        aiCoaching: z
          .object({
            enabled: z.boolean().optional(),
            frequency: z.enum(["realtime", "daily", "weekly"]).optional(),
            focusAreas: z.array(z.string()).optional(),
          })
          .optional(),
      })
      .optional(),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),

  resetPassword: z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),

  forgotPassword: z.object({
    email: z.string().email("Invalid email address"),
  }),
};

// Pillar validation schemas
export const pillarSchemas = {
  create: z.object({
    pillar: z.enum([
      "sleep",
      "diet",
      "exercise",
      "physical_health",
      "mental_health",
      "finances",
      "social",
      "spirituality",
    ]),
    score: z
      .number()
      .min(0, "Score must be at least 0")
      .max(100, "Score cannot exceed 100"),
    trend: z.enum(["improving", "stable", "declining"]).optional(),
    notes: z.string().max(500, "Notes too long").optional(),
  }),

  update: z.object({
    score: z.number().min(0).max(100).optional(),
    trend: z.enum(["improving", "stable", "declining"]).optional(),
    notes: z.string().max(500).optional(),
  }),

  idParam: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid pillar ID"),
  }),
};

// Entry (check-in) validation schemas
export const entrySchemas = {
  create: z.object({
    pillar: z.enum([
      "sleep",
      "diet",
      "exercise",
      "physical_health",
      "mental_health",
      "finances",
      "social",
      "spirituality",
    ]),
    score: z.number().min(0).max(100),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    notes: z.string().max(1000, "Notes too long").optional(),
    mood: z.number().min(1).max(5).optional(),
    activities: z.array(z.string()).max(20, "Too many activities").optional(),
  }),

  update: z.object({
    score: z.number().min(0).max(100).optional(),
    notes: z.string().max(1000).optional(),
    mood: z.number().min(1).max(5).optional(),
    activities: z.array(z.string()).max(20).optional(),
  }),

  query: z.object({
    pillar: z
      .enum([
        "sleep",
        "diet",
        "exercise",
        "physical_health",
        "mental_health",
        "finances",
        "social",
        "spirituality",
      ])
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

// Habit validation schemas
export const habitSchemas = {
  create: z.object({
    pillarId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid pillar ID"),
    name: z.string().min(1, "Habit name is required").max(100, "Name too long"),
    description: z.string().max(500, "Description too long").optional(),
    frequency: z.enum(["daily", "weekly", "custom"]),
    customDays: z
      .array(z.number().min(0).max(6))
      .max(7, "Invalid days array")
      .optional(),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
      .optional(),
    targetCount: z.number().min(1).optional(),
  }),

  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    frequency: z.enum(["daily", "weekly", "custom"]).optional(),
    customDays: z.array(z.number().min(0).max(6)).max(7).optional(),
    reminderTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
    targetCount: z.number().min(1).optional(),
    isActive: z.boolean().optional(),
    completed: z.boolean().optional(),
  }),

  idParam: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid habit ID"),
  }),
};

// Goal validation schemas
export const goalSchemas = {
  create: z.object({
    pillarId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid pillar ID"),
    title: z
      .string()
      .min(1, "Goal title is required")
      .max(200, "Title too long"),
    description: z.string().max(1000, "Description too long").optional(),
    target: z.number().min(0, "Target must be positive"),
    current: z.number().min(0, "Current value must be positive").optional(),
    unit: z.string().max(50, "Unit too long").optional(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    target: z.number().min(0).optional(),
    current: z.number().min(0).optional(),
    unit: z.string().max(50).optional(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    status: z.enum(["active", "completed", "abandoned"]).optional(),
  }),
};

// Onboarding validation schemas
export const onboardingSchemas = {
  save: z.object({
    responses: z.record(z.union([z.string(), z.number(), z.boolean()])),
    scores: z.record(z.number().min(0).max(100)).optional(),
    metadata: z
      .object({
        completionTime: z.number().optional(),
        deviceType: z.string().optional(),
      })
      .optional(),
  }),

  update: z.object({
    responses: z
      .record(z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
    scores: z.record(z.number().min(0).max(100)).optional(),
  }),
};

// AI validation schemas
export const aiSchemas = {
  coachRequest: z.object({
    prompt: z.string().min(1, "Prompt is required").max(500, "Prompt too long"),
    pillarId: z
      .enum([
        "sleep",
        "diet",
        "exercise",
        "physical_health",
        "mental_health",
        "finances",
        "social",
        "spirituality",
      ])
      .optional(),
    userContext: z
      .object({
        email: z.string().email().optional(),
        score: z.number().min(0).max(100).optional(),
        recentEntries: z.array(z.any()).optional(),
      })
      .optional(),
  }),

  insightsParam: z.object({
    pillarId: z.enum([
      "sleep",
      "diet",
      "exercise",
      "physical_health",
      "mental_health",
      "finances",
      "social",
      "spirituality",
    ]),
  }),
};

// Challenge validation schemas
export const challengeSchemas = {
  create: z.object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    description: z.string().max(1000, "Description too long"),
    pillar: z.enum([
      "sleep",
      "diet",
      "exercise",
      "physical_health",
      "mental_health",
      "finances",
      "social",
      "spirituality",
    ]),
    duration: z
      .number()
      .min(1, "Duration must be at least 1 day")
      .max(365, "Duration too long"),
    difficulty: z.enum(["easy", "medium", "hard"]),
    isPublic: z.boolean().optional(),
    maxParticipants: z.number().min(1).max(1000).optional(),
  }),

  join: z.object({
    challengeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid challenge ID"),
  }),
};

// Friend/Social validation schemas
export const friendSchemas = {
  sendRequest: z.object({
    recipientId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID"),
  }),

  respondRequest: z.object({
    requestId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid request ID"),
    action: z.enum(["accept", "decline"]),
  }),
};

// Message validation schemas
export const messageSchemas = {
  send: z.object({
    recipientId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID"),
    content: z
      .string()
      .min(1, "Message cannot be empty")
      .max(2000, "Message too long"),
    type: z.enum(["text", "system"]).optional(),
  }),

  query: z.object({
    conversationId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

// Subscription validation schemas
export const subscriptionSchemas = {
  create: z.object({
    tier: z.enum(["free", "premium", "referral"]),
    referralCode: z.string().max(64).optional(),
    durationDays: z
      .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
      .optional(),
  }),

  update: z.object({
    tier: z.enum(["basic", "premium"]).optional(),
    status: z.enum(["active", "cancelled", "paused"]).optional(),
  }),
};

// Generic MongoDB ID parameter validation
export const idParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format"),
});

// Generic pagination query validation
export const paginationQuery = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

/**
 * Usage example:
 *
 * import { validate, userSchemas } from '../middleware/validate.js';
 *
 * router.post('/register',
 *   validate({ body: userSchemas.register }),
 *   userController.register
 * );
 *
 * router.get('/entries',
 *   validate({ query: entrySchemas.query }),
 *   entriesController.getEntries
 * );
 *
 * router.put('/habits/:id',
 *   validate({
 *     params: habitSchemas.idParam,
 *     body: habitSchemas.update
 *   }),
 *   habitController.updateHabit
 * );
 */
