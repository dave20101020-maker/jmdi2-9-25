/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 11: Exercise Demo Videos Library for Fitness Pillar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Exercise video library with:
 * - Form demonstration videos
 * - Workout routines (5-45 min)
 * - Equipment-based and bodyweight exercises
 * - Progressive training programs
 * - Difficulty levels: Beginner, Intermediate, Advanced
 * - Body parts focused: Full body, Upper, Lower, Core, Cardio
 * 
 * Features:
 * - Linked to micro-actions for practice
 * - Workout history tracking
 * - Form quality feedback
 * - Calorie burn estimation
 * - Personal records tracking
 */

import Entry from "../models/Entry.js";
import User from "../models/User.js";

// Exercise video library
const exerciseLibrary = {
  "bodyweight-exercises": [
    {
      id: "bw-101",
      name: "Push-up Form Guide",
      description: "Learn proper push-up form to avoid injury and maximize effectiveness",
      duration: 3,
      difficulty: "Beginner",
      bodyPart: ["Chest", "Shoulders", "Triceps"],
      videoUrl: "https://example.com/video/bw-101.mp4",
      thumbnailUrl: "https://example.com/img/bw-101.jpg",
      instructor: "Coach Mike",
      tags: ["bodyweight", "upper-body", "strength"],
      caloriesBurn: 5,
      equipment: "None",
      sets: 3,
      reps: "8-12",
      rest: 60,
      tips: [
        "Keep body straight",
        "Lower chest to ground",
        "Push through hands",
        "Breathe in on way down, out on way up",
      ],
      commonMistakes: [
        "Elbows flaring out (should be 45 degrees from body)",
        "Sagging hips",
        "Only partial range of motion",
      ],
      rating: 4.9,
      views: 87000,
    },
    {
      id: "bw-102",
      name: "Bodyweight Squat Form",
      description: "Master the fundamental squat with perfect form",
      duration: 4,
      difficulty: "Beginner",
      bodyPart: ["Glutes", "Quads", "Hamstrings"],
      videoUrl: "https://example.com/video/bw-102.mp4",
      thumbnailUrl: "https://example.com/img/bw-102.jpg",
      instructor: "Coach Sarah",
      tags: ["bodyweight", "lower-body", "strength"],
      caloriesBurn: 8,
      equipment: "None",
      sets: 3,
      reps: "12-15",
      rest: 60,
      tips: [
        "Feet shoulder-width apart",
        "Weight in heels",
        "Chest up, core engaged",
        "Go as low as comfortable",
      ],
      commonMistakes: [
        "Knees caving inward",
        "Leaning too far forward",
        "Heels coming off ground",
      ],
      rating: 4.8,
      views: 92000,
    },
    {
      id: "bw-103",
      name: "Plank Hold - Core Strength",
      description: "Build core stability with proper plank technique",
      duration: 2,
      difficulty: "Beginner",
      bodyPart: ["Core", "Shoulders"],
      videoUrl: "https://example.com/video/bw-103.mp4",
      thumbnailUrl: "https://example.com/img/bw-103.jpg",
      instructor: "Coach Mike",
      tags: ["bodyweight", "core", "isometric"],
      caloriesBurn: 6,
      equipment: "None",
      sets: 3,
      duration_per_set: "30-60 seconds",
      rest: 45,
      tips: [
        "Body in straight line",
        "Shoulders over elbows",
        "Engage core",
        "Don't hold breath",
      ],
      commonMistakes: [
        "Hips sagging",
        "Shoulders shrugging",
        "Butt in the air",
      ],
      rating: 4.9,
      views: 115000,
    },
    {
      id: "bw-104",
      name: "Burpee - Full Body Explosive",
      description: "Complete full-body exercise combining cardio and strength",
      duration: 3,
      difficulty: "Intermediate",
      bodyPart: ["Full Body"],
      videoUrl: "https://example.com/video/bw-104.mp4",
      thumbnailUrl: "https://example.com/img/bw-104.jpg",
      instructor: "Coach Alex",
      tags: ["bodyweight", "cardio", "full-body", "explosive"],
      caloriesBurn: 15,
      equipment: "None",
      sets: 3,
      reps: "5-10",
      rest: 90,
      tips: [
        "Control all movements",
        "Full depth squat",
        "Jump power comes from legs",
        "Land softly",
      ],
      commonMistakes: [
        "Not going into full push-up",
        "Lack of jump height",
        "Poor landing form",
      ],
      rating: 4.7,
      views: 45000,
    },
  ],

  "dumbbell-exercises": [
    {
      id: "db-101",
      name: "Dumbbell Bicep Curl",
      description: "Isolate and build bicep strength",
      duration: 2,
      difficulty: "Beginner",
      bodyPart: ["Biceps"],
      videoUrl: "https://example.com/video/db-101.mp4",
      thumbnailUrl: "https://example.com/img/db-101.jpg",
      instructor: "Coach Sarah",
      tags: ["dumbbell", "upper-body", "isolation"],
      caloriesBurn: 3,
      equipment: "Dumbbells",
      sets: 3,
      reps: "8-12",
      rest: 60,
      tips: [
        "Keep elbows at sides",
        "No swinging",
        "Full range of motion",
        "Controlled descent",
      ],
      commonMistakes: [
        "Using momentum",
        "Partial range of motion",
        "Elbows moving forward",
      ],
      rating: 4.8,
      views: 65000,
    },
    {
      id: "db-102",
      name: "Dumbbell Shoulder Press",
      description: "Build shoulder strength and stability",
      duration: 3,
      difficulty: "Intermediate",
      bodyPart: ["Shoulders", "Triceps", "Chest"],
      videoUrl: "https://example.com/video/db-102.mp4",
      thumbnailUrl: "https://example.com/img/db-102.jpg",
      instructor: "Coach Mike",
      tags: ["dumbbell", "upper-body", "strength"],
      caloriesBurn: 8,
      equipment: "Dumbbells",
      sets: 3,
      reps: "6-10",
      rest: 90,
      tips: [
        "Start at shoulder height",
        "Press straight up",
        "Core engaged",
        "Controlled descent",
      ],
      commonMistakes: [
        "Leaning back too much",
        "Elbows too far forward",
        "Not full range of motion",
      ],
      rating: 4.8,
      views: 58000,
    },
  ],

  "cardio-routines": [
    {
      id: "cardio-101",
      name: "10-Minute HIIT Workout",
      description: "High intensity interval training for maximum calorie burn",
      duration: 10,
      difficulty: "Intermediate",
      bodyPart: ["Full Body"],
      videoUrl: "https://example.com/video/cardio-101.mp4",
      thumbnailUrl: "https://example.com/img/cardio-101.jpg",
      instructor: "Coach Alex",
      tags: ["cardio", "hiit", "high-intensity"],
      caloriesBurn: 120,
      equipment: "None",
      intervals: [
        { exercise: "Jumping jacks", duration: 30, rest: 10 },
        { exercise: "High knees", duration: 30, rest: 10 },
        { exercise: "Burpees", duration: 30, rest: 10 },
        { exercise: "Mountain climbers", duration: 30, rest: 10 },
      ],
      rounds: 3,
      rating: 4.9,
      views: 234000,
    },
    {
      id: "cardio-102",
      name: "20-Minute Steady Cardio",
      description: "Moderate intensity for building cardiovascular endurance",
      duration: 20,
      difficulty: "Beginner",
      bodyPart: ["Full Body"],
      videoUrl: "https://example.com/video/cardio-102.mp4",
      thumbnailUrl: "https://example.com/img/cardio-102.jpg",
      instructor: "Coach Sarah",
      tags: ["cardio", "steady-state", "endurance"],
      caloriesBurn: 180,
      equipment: "None or treadmill",
      intensity: "Moderate (60-70% max HR)",
      rating: 4.8,
      views: 156000,
    },
  ],

  "yoga-stretching": [
    {
      id: "yoga-101",
      name: "5-Minute Beginner Yoga",
      description: "Gentle yoga for flexibility and relaxation",
      duration: 5,
      difficulty: "Beginner",
      bodyPart: ["Full Body"],
      videoUrl: "https://example.com/video/yoga-101.mp4",
      thumbnailUrl: "https://example.com/img/yoga-101.jpg",
      instructor: "Instructor Emma",
      tags: ["yoga", "flexibility", "beginner"],
      caloriesBurn: 12,
      equipment: "Mat",
      poses: [
        "Child's pose",
        "Cat-cow",
        "Downward dog",
        "Warrior",
        "Savasana",
      ],
      rating: 4.9,
      views: 178000,
    },
    {
      id: "yoga-102",
      name: "Post-Workout Stretching",
      description: "Comprehensive stretching routine after exercise",
      duration: 8,
      difficulty: "Beginner",
      bodyPart: ["Full Body"],
      videoUrl: "https://example.com/video/yoga-102.mp4",
      thumbnailUrl: "https://example.com/img/yoga-102.jpg",
      instructor: "Instructor Emma",
      tags: ["stretching", "recovery", "flexibility"],
      caloriesBurn: 5,
      equipment: "Mat",
      rating: 4.9,
      views: 142000,
    },
  ],
};

/**
 * Get all exercises or filtered by type
 * @param {string} category - Optional: 'bodyweight-exercises', 'dumbbell-exercises', etc
 * @param {string} difficulty - Optional: 'Beginner', 'Intermediate', 'Advanced'
 * @param {string} bodyPart - Optional: 'Chest', 'Legs', 'Full Body', etc
 * @returns {Array} Exercise items
 */
export function getExercises(category = null, difficulty = null, bodyPart = null) {
  let result = [];

  if (category && exerciseLibrary[category]) {
    result = exerciseLibrary[category];
  } else {
    // Return all
    Object.values(exerciseLibrary).forEach((items) => {
      result.push(...items);
    });
  }

  if (difficulty) {
    result = result.filter((e) => e.difficulty === difficulty);
  }

  if (bodyPart) {
    result = result.filter((e) =>
      e.bodyPart.includes(bodyPart)
    );
  }

  return result;
}

/**
 * Get exercises for a specific micro-action
 * @param {string} microActionTitle - Micro-action title (e.g., "10-minute walk")
 * @returns {Array} Related exercises
 */
export function getExercisesForMicroAction(microActionTitle) {
  const title = microActionTitle.toLowerCase();
  const all = getExercises();

  // Match by keyword
  if (title.includes("stretch"))
    return getExercises("yoga-stretching", "Beginner");
  if (title.includes("walk") || title.includes("cardio"))
    return getExercises("cardio-routines");
  if (title.includes("push") || title.includes("upper"))
    return getExercises(null, "Beginner").filter((e) =>
      e.bodyPart.some((p) =>
        ["Chest", "Shoulders", "Biceps", "Triceps"].includes(p)
      )
    );
  if (title.includes("leg") || title.includes("squat"))
    return getExercises(null, "Beginner").filter((e) =>
      e.bodyPart.some((p) =>
        ["Glutes", "Quads", "Hamstrings", "Legs"].includes(p)
      )
    );

  return getExercises(null, "Beginner");
}

/**
 * Record exercise completion
 * @param {string} userId - User ID
 * @param {string} exerciseId - Exercise ID
 * @param {Object} sessionData - {setsCompleted, repsCompleted, caloriesBurned}
 * @returns {Promise<Object>} Created entry
 */
export async function recordExerciseCompletion(
  userId,
  exerciseId,
  sessionData
) {
  try {
    const exercise = getAllExercises().find((e) => e.id === exerciseId);
    if (!exercise) throw new Error("Exercise not found");

    const { setsCompleted, repsCompleted, caloriesBurned } = sessionData;

    // Create entry
    const entry = await Entry.create({
      userId,
      pillar: "exercise",
      type: "exercise",
      content: `Completed: ${exercise.name}`,
      score: Math.min(10, setsCompleted / 3 * 10), // Score based on sets
      data: {
        exerciseId,
        name: exercise.name,
        duration: exercise.duration,
        setsCompleted,
        repsCompleted,
        caloriesBurned: caloriesBurned || exercise.caloriesBurn,
        difficulty: exercise.difficulty,
        completedAt: new Date(),
      },
    });

    // Update user exercise stats
    await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          "stats.exercisesCompleted": 1,
          "stats.minutesExercised": exercise.duration,
          "stats.caloriesBurned": caloriesBurned || exercise.caloriesBurn,
        },
        $addToSet: { "profile.exercisesCompleted": exerciseId },
      },
      { new: true }
    );

    return entry;
  } catch (error) {
    console.error("Error recording exercise:", error);
    throw error;
  }
}

/**
 * Get user's exercise history
 * @param {string} userId - User ID
 * @param {number} days - Last N days (default 30)
 * @returns {Promise<Array>} User's exercise entries
 */
export async function getUserExerciseHistory(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await Entry.find({
      userId,
      pillar: "exercise",
      type: "exercise",
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });

    return entries;
  } catch (error) {
    console.error("Error retrieving exercise history:", error);
    return [];
  }
}

/**
 * Get all exercises (helper)
 */
function getAllExercises() {
  let all = [];
  Object.values(exerciseLibrary).forEach((items) => {
    all.push(...items);
  });
  return all;
}

/**
 * Create a workout routine by combining exercises
 * @param {Object} params - {difficulty, duration, focus, equipment}
 * @returns {Array} Exercises for workout
 */
export function createCustomWorkout(params) {
  const { difficulty = "Beginner", duration = 30, focus = "Full Body", equipment = "None" } = params;

  let exercises = getExercises(null, difficulty);

  // Filter by focus
  if (focus && focus !== "Full Body") {
    exercises = exercises.filter((e) => e.bodyPart?.includes(focus));
  }

  // Calculate exercise order by duration
  let totalDuration = 0;
  const workout = [];

  for (const exercise of exercises) {
    if (totalDuration + exercise.duration <= duration) {
      workout.push(exercise);
      totalDuration += exercise.duration;
    }
    if (totalDuration >= duration * 0.8) break;
  }

  return workout;
}

/**
 * Rate exercise video
 * @param {string} userId - User ID
 * @param {string} exerciseId - Exercise ID
 * @param {number} rating - 1-5 stars
 * @returns {Promise<void>}
 */
export async function rateExercise(userId, exerciseId, rating) {
  try {
    await Entry.create({
      userId,
      pillar: "exercise",
      type: "exercise-rating",
      content: `Rated ${rating}/5 stars`,
      score: rating,
      data: {
        exerciseId,
        rating,
        ratedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error rating exercise:", error);
    throw error;
  }
}

export default {
  getExercises,
  getExercisesForMicroAction,
  recordExerciseCompletion,
  getUserExerciseHistory,
  createCustomWorkout,
  rateExercise,
  exerciseLibrary,
};
