/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 11: Meditation Audio Library for Spirituality Pillar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Curated meditation audio library with:
 * - Guided meditations (5-20 min)
 * - Breathing exercises
 * - Ambient/nature sounds
 * - Sleep meditations
 * - Anxiety relief sessions
 * - Chakra/energy work
 * 
 * Features:
 * - User progress tracking
 * - Favorite marking
 * - Playback history
 * - Recommended based on time/mood
 * - Integration with pillar scoring
 */

import Entry from "../models/Entry.js";
import User from "../models/User.js";

// Meditation library database
const meditationLibrary = {
  "guided-meditation": [
    {
      id: "med-101",
      title: "Beginner's Mindfulness - 5 Minutes",
      description:
        "Simple introduction to mindfulness meditation for beginners",
      duration: 5,
      instructor: "Sarah Chen",
      level: "Beginner",
      category: "Mindfulness",
      audioUrl: "https://example.com/audio/med-101.mp3",
      imageUrl: "https://example.com/img/med-101.jpg",
      tags: ["beginner", "short", "mindfulness"],
      benefits: [
        "Reduces stress",
        "Improves focus",
        "Increases awareness",
      ],
      rating: 4.8,
      downloads: 15420,
    },
    {
      id: "med-102",
      title: "Body Scan Relaxation - 10 Minutes",
      description: "Relax your entire body by scanning from head to toe",
      duration: 10,
      instructor: "James Liu",
      level: "Beginner",
      category: "Relaxation",
      audioUrl: "https://example.com/audio/med-102.mp3",
      imageUrl: "https://example.com/img/med-102.jpg",
      tags: ["beginner", "relaxation", "body-scan"],
      benefits: ["Releases tension", "Improves sleep", "Body awareness"],
      rating: 4.9,
      downloads: 12340,
    },
    {
      id: "med-103",
      title: "Loving Kindness Meditation - 15 Minutes",
      description: "Open your heart with compassion toward yourself and others",
      duration: 15,
      instructor: "Emma Johnson",
      level: "Intermediate",
      category: "Compassion",
      audioUrl: "https://example.com/audio/med-103.mp3",
      imageUrl: "https://example.com/img/med-103.jpg",
      tags: ["intermediate", "compassion", "kindness"],
      benefits: [
        "Increases compassion",
        "Reduces negativity",
        "Improves relationships",
      ],
      rating: 4.7,
      downloads: 9876,
    },
    {
      id: "med-104",
      title: "Anxiety Relief - 8 Minutes",
      description: "Calm your anxious mind with grounding techniques",
      duration: 8,
      instructor: "Dr. Michael Park",
      level: "Beginner",
      category: "Anxiety Relief",
      audioUrl: "https://example.com/audio/med-104.mp3",
      imageUrl: "https://example.com/img/med-104.jpg",
      tags: ["anxiety", "grounding", "short"],
      benefits: ["Reduces anxiety", "Grounds mind", "Quick relief"],
      rating: 4.9,
      downloads: 21500,
    },
  ],

  "breathing-exercises": [
    {
      id: "breath-101",
      title: "Box Breathing - 5 Minutes",
      description:
        "4-4-4-4 breathing pattern for instant calm (great before bed)",
      duration: 5,
      instructor: "Yoga Master Alex",
      level: "Beginner",
      category: "Breathing",
      audioUrl: "https://example.com/audio/breath-101.mp3",
      imageUrl: "https://example.com/img/breath-101.jpg",
      tags: ["breathing", "sleep-prep", "calming"],
      benefits: ["Calms nervous system", "Sleep preparation", "Stress relief"],
      rating: 4.8,
      downloads: 18900,
    },
    {
      id: "breath-102",
      title: "4-7-8 Breathing for Sleep - 10 Minutes",
      description:
        "Ancient yogic breathing technique specifically for sleep onset",
      duration: 10,
      instructor: "Sleep Coach Diana",
      level: "Intermediate",
      category: "Sleep",
      audioUrl: "https://example.com/audio/breath-102.mp3",
      imageUrl: "https://example.com/img/breath-102.jpg",
      tags: ["sleep", "breathing", "bedtime"],
      benefits: ["Facilitates sleep", "Reduces insomnia", "Relaxation"],
      rating: 4.9,
      downloads: 24100,
    },
    {
      id: "breath-103",
      title: "Energizing Breath - 7 Minutes",
      description:
        "Invigorate your mind and body with stimulating breath work",
      duration: 7,
      instructor: "Yoga Master Alex",
      level: "Beginner",
      category: "Energy",
      audioUrl: "https://example.com/audio/breath-103.mp3",
      imageUrl: "https://example.com/img/breath-103.jpg",
      tags: ["energy", "morning", "breathing"],
      benefits: ["Increases energy", "Mental clarity", "Wakefulness"],
      rating: 4.6,
      downloads: 11200,
    },
  ],

  "ambient-sounds": [
    {
      id: "ambient-101",
      title: "Forest Ambience - 30 Minutes",
      description: "Peaceful forest sounds with birds and gentle wind",
      duration: 30,
      instructor: "Nature Sounds Co.",
      level: "Beginner",
      category: "Nature",
      audioUrl: "https://example.com/audio/ambient-101.mp3",
      imageUrl: "https://example.com/img/ambient-101.jpg",
      tags: ["nature", "ambient", "relaxation"],
      benefits: ["Connection to nature", "Deep relaxation", "Focus aid"],
      rating: 4.7,
      downloads: 45000,
    },
    {
      id: "ambient-102",
      title: "Ocean Waves - 45 Minutes",
      description: "Soothing ocean waves perfect for sleep or study",
      duration: 45,
      instructor: "Nature Sounds Co.",
      level: "Beginner",
      category: "Nature",
      audioUrl: "https://example.com/audio/ambient-102.mp3",
      imageUrl: "https://example.com/img/ambient-102.jpg",
      tags: ["ocean", "sleep", "ambient"],
      benefits: ["Sleep aid", "Stress relief", "Study focus"],
      rating: 4.9,
      downloads: 67000,
    },
    {
      id: "ambient-103",
      title: "Rain Meditation - 20 Minutes",
      description: "Gentle rain sounds with distant thunder",
      duration: 20,
      instructor: "Nature Sounds Co.",
      level: "Beginner",
      category: "Nature",
      audioUrl: "https://example.com/audio/ambient-103.mp3",
      imageUrl: "https://example.com/img/ambient-103.jpg",
      tags: ["rain", "relaxation", "ambient"],
      benefits: ["Calming", "Sleep quality", "Anxiety relief"],
      rating: 4.8,
      downloads: 52300,
    },
  ],

  "sleep-meditations": [
    {
      id: "sleep-101",
      title: "Bedtime Story - 20 Minutes",
      description: "Calming narrative to guide you gently into sleep",
      duration: 20,
      instructor: "Storyteller Emma",
      level: "Beginner",
      category: "Sleep",
      audioUrl: "https://example.com/audio/sleep-101.mp3",
      imageUrl: "https://example.com/img/sleep-101.jpg",
      tags: ["sleep", "story", "relaxation"],
      benefits: ["Sleep onset", "Relaxation", "Dreams"],
      rating: 4.9,
      downloads: 34000,
    },
    {
      id: "sleep-102",
      title: "Hypnotic Sleep Journey - 30 Minutes",
      description: "Deep relaxation journey for deep, restorative sleep",
      duration: 30,
      instructor: "Hypnotherapist Dr. Stone",
      level: "Intermediate",
      category: "Sleep",
      audioUrl: "https://example.com/audio/sleep-102.mp3",
      imageUrl: "https://example.com/img/sleep-102.jpg",
      tags: ["sleep", "hypnosis", "deep-sleep"],
      benefits: [
        "Deep sleep",
        "Sleep quality",
        "Insomnia relief",
      ],
      rating: 4.8,
      downloads: 28900,
    },
  ],
};

/**
 * Get all meditations or filtered by category
 * @param {string} category - Optional: 'guided-meditation', 'breathing-exercises', etc
 * @param {string} level - Optional: 'Beginner', 'Intermediate', 'Advanced'
 * @returns {Array} Meditation items
 */
export function getMeditations(category = null, level = null) {
  let result = [];

  if (category && meditationLibrary[category]) {
    result = meditationLibrary[category];
  } else {
    // Return all
    Object.values(meditationLibrary).forEach((items) => {
      result.push(...items);
    });
  }

  if (level) {
    result = result.filter((m) => m.level === level);
  }

  return result;
}

/**
 * Get recommended meditations based on time available and user mood
 * @param {number} timeAvailableMinutes - Minutes user has available
 * @param {string} mood - 'anxious', 'stressed', 'tired', 'energyless', 'unfocused'
 * @returns {Array} Recommended meditations
 */
export function getRecommendedMeditations(timeAvailableMinutes, mood) {
  let all = getMeditations();

  // Filter by time
  all = all.filter((m) => m.duration <= timeAvailableMinutes);

  // Filter by mood
  const moodFilters = {
    anxious: ["anxiety", "grounding", "breathing"],
    stressed: ["breathing", "relaxation", "mindfulness"],
    tired: ["sleep", "relaxation", "ambient"],
    energyless: ["energy", "morning", "invigorating"],
    unfocused: ["focus", "mindfulness", "concentration"],
  };

  const tags = moodFilters[mood] || [];
  if (tags.length > 0) {
    all = all.filter((m) =>
      tags.some((tag) => m.tags.includes(tag))
    );
  }

  // Sort by rating
  all.sort((a, b) => b.rating - a.rating);

  return all.slice(0, 5); // Top 5 recommendations
}

/**
 * Record meditation completion
 * @param {string} userId - User ID
 * @param {string} meditationId - Meditation ID
 * @returns {Promise<Object>} Created entry
 */
export async function recordMeditationCompletion(userId, meditationId) {
  try {
    const meditation = getAllMeditations().find((m) => m.id === meditationId);
    if (!meditation) throw new Error("Meditation not found");

    // Create entry
    const entry = await Entry.create({
      userId,
      pillar: "spirit",
      type: "meditation",
      content: `Completed meditation: ${meditation.title}`,
      score: 10, // Full score for completing
      data: {
        meditationId,
        title: meditation.title,
        duration: meditation.duration,
        category: meditation.category,
        instructor: meditation.instructor,
        completedAt: new Date(),
      },
    });

    // Update user meditation stats
    await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          "stats.meditationsCompleted": 1,
          "stats.meditationMinutes": meditation.duration,
        },
        $addToSet: { "profile.meditationsCompleted": meditationId },
      },
      { new: true }
    );

    return entry;
  } catch (error) {
    console.error("Error recording meditation:", error);
    throw error;
  }
}

/**
 * Get user's meditation history
 * @param {string} userId - User ID
 * @param {number} days - Last N days (default 30)
 * @returns {Promise<Array>} User's meditation entries
 */
export async function getUserMeditationHistory(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await Entry.find({
      userId,
      pillar: "spirit",
      type: "meditation",
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });

    return entries;
  } catch (error) {
    console.error("Error retrieving meditation history:", error);
    return [];
  }
}

/**
 * Get all meditations (helper)
 */
function getAllMeditations() {
  let all = [];
  Object.values(meditationLibrary).forEach((items) => {
    all.push(...items);
  });
  return all;
}

/**
 * Mark meditation as favorite
 * @param {string} userId - User ID
 * @param {string} meditationId - Meditation ID
 * @returns {Promise<Object>} Updated user
 */
export async function markMeditationFavorite(userId, meditationId) {
  try {
    return await User.findByIdAndUpdate(
      userId,
      { $addToSet: { "profile.favoriteMeditations": meditationId } },
      { new: true }
    );
  } catch (error) {
    console.error("Error marking favorite:", error);
    throw error;
  }
}

/**
 * Get user's favorite meditations
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Favorite meditations
 */
export async function getUserFavoriteMeditations(userId) {
  try {
    const user = await User.findById(userId);
    const favoriteIds = user?.profile?.favoriteMeditations || [];

    return getAllMeditations().filter((m) =>
      favoriteIds.includes(m.id)
    );
  } catch (error) {
    console.error("Error retrieving favorites:", error);
    return [];
  }
}

export default {
  getMeditations,
  getRecommendedMeditations,
  recordMeditationCompletion,
  getUserMeditationHistory,
  markMeditationFavorite,
  getUserFavoriteMeditations,
  meditationLibrary,
};
