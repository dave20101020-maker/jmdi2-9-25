/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 11: Relationship Mapping & Social Network for Social Pillar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Map and visualize user's social relationships:
 * - Family tree structure
 * - Social circles (friend groups)
 * - Support circles (who provides support for what)
 * - Relationship health tracking
 * - Communication frequency monitoring
 * - Relationship quality metrics
 * 
 * Features:
 * - Network visualization (graph-based)
 * - Relationship type classification
 * - Interaction tracking
 * - Support role mapping
 * - Relationship goals
 * - Connection health scoring
 */

import User from "../models/User.js";
import Entry from "../models/Entry.js";

// Relationship types
const relationshipTypes = [
  { id: "family", name: "Family", emoji: "👨‍👩‍👧‍👦", color: "#FF6B6B" },
  { id: "close-friend", name: "Close Friend", emoji: "👯", color: "#4ECDC4" },
  { id: "friend", name: "Friend", emoji: "🤝", color: "#45B7D1" },
  { id: "colleague", name: "Colleague", emoji: "💼", color: "#96CEB4" },
  { id: "mentor", name: "Mentor", emoji: "🧑‍🏫", color: "#FFEAA7" },
  {
    id: "mentee",
    name: "Mentee",
    emoji: "📚",
    color: "#DFE6E9",
  },
  { id: "romantic", name: "Romantic Partner", emoji: "💕", color: "#FF7675" },
  { id: "acquaintance", name: "Acquaintance", emoji: "👋", color: "#B0BEC5" },
];

// Support role types
const supportRoles = [
  {
    id: "emotional",
    name: "Emotional Support",
    emoji: "💙",
    examples: ["listening", "advice", "comfort"],
  },
  {
    id: "practical",
    name: "Practical Support",
    emoji: "🤲",
    examples: ["help", "resources", "time"],
  },
  {
    id: "health",
    name: "Health Support",
    emoji: "🏥",
    examples: ["fitness", "nutrition", "wellness"],
  },
  {
    id: "financial",
    name: "Financial Support",
    emoji: "💰",
    examples: ["advice", "resources"],
  },
  {
    id: "professional",
    name: "Professional Support",
    emoji: "💼",
    examples: ["career", "mentoring", "opportunities"],
  },
  {
    id: "social",
    name: "Social Support",
    emoji: "🎉",
    examples: ["events", "activities", "companionship"],
  },
];

/**
 * Add person to user's relationship map
 * @param {string} userId - User ID
 * @param {Object} personData - {name, relationship, supportRoles, notes}
 * @returns {Promise<Object>} Created relationship
 */
export async function addPerson(userId, personData) {
  const {
    name,
    relationship, // From relationshipTypes
    supportRoles = [],
    notes = "",
    lastContact = null,
    frequency = "weekly", // monthly, yearly, etc
  } = personData;

  try {
    // Validate relationship type
    const validRelationship = relationshipTypes.find(
      (r) => r.id === relationship
    );
    if (!validRelationship)
      throw new Error("Invalid relationship type");

    // Create relationship
    const person = {
      id: `person_${Date.now()}`,
      name,
      relationship,
      relationshipLabel: validRelationship.name,
      relationshipEmoji: validRelationship.emoji,
      supportRoles,
      notes,
      lastContact: lastContact || new Date(),
      frequency,
      contactCount: 0,
      createdAt: new Date(),
      healthScore: 5, // 0-10 scale
    };

    // Add to user's relationship map
    const updated = await User.findByIdAndUpdate(
      userId,
      {
        $push: { "profile.relationshipMap": person },
      },
      { new: true }
    );

    // Log as entry
    await Entry.create({
      userId,
      pillar: "social",
      type: "relationship-added",
      content: `Added ${name} (${validRelationship.name}) to your support network`,
      score: 5,
      data: person,
    });

    return person;
  } catch (error) {
    console.error("Error adding person:", error);
    throw error;
  }
}

/**
 * Record interaction with person
 * @param {string} userId - User ID
 * @param {string} personId - Person ID
 * @param {Object} interactionData - {type, duration, quality, notes}
 * @returns {Promise<Object>} Created interaction
 */
export async function recordInteraction(userId, personId, interactionData) {
  const {
    type = "call", // call, text, visit, email, etc
    duration = 30, // minutes
    quality = 5, // 1-10 scale
    notes = "",
    topics = [],
  } = interactionData;

  try {
    // Find person in relationship map
    const user = await User.findById(userId);
    const person = user.profile.relationshipMap.find((p) => p.id === personId);

    if (!person) throw new Error("Person not found");

    // Create interaction entry
    const interaction = {
      personId,
      personName: person.name,
      type,
      duration,
      quality,
      notes,
      topics,
      timestamp: new Date(),
    };

    // Update relationship map
    const updated = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          "profile.relationshipMap.$[elem].interactions": interaction,
        },
        $inc: { "profile.relationshipMap.$[elem].contactCount": 1 },
        $set: { "profile.relationshipMap.$[elem].lastContact": new Date() },
      },
      {
        arrayFilters: [{ "elem.id": personId }],
        new: true,
      }
    );

    // Log entry
    await Entry.create({
      userId,
      pillar: "social",
      type: "interaction",
      content: `${type} with ${person.name} (${duration} min)`,
      score: Math.round(quality),
      data: interaction,
    });

    // Update relationship health
    updateRelationshipHealth(userId, personId);

    return interaction;
  } catch (error) {
    console.error("Error recording interaction:", error);
    throw error;
  }
}

/**
 * Update relationship health score
 * @param {string} userId - User ID
 * @param {string} personId - Person ID
 * @returns {Promise<void>}
 */
async function updateRelationshipHealth(userId, personId) {
  try {
    const user = await User.findById(userId);
    const person = user.profile.relationshipMap.find((p) => p.id === personId);

    if (!person) return;

    // Calculate health score based on:
    // 1. Frequency of contact
    // 2. Quality of recent interactions
    // 3. Time since last contact

    const interactions = person.interactions || [];
    const recentInteractions = interactions.filter(
      (i) =>
        new Date(i.timestamp) >
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ); // Last 30 days

    let score = 5; // Base

    // Quality factor (last 3 interactions average)
    if (interactions.length > 0) {
      const last3Quality =
        interactions
          .slice(-3)
          .reduce((sum, i) => sum + i.quality, 0) / Math.min(3, interactions.length);
      score = score + (last3Quality - 5) / 2; // Adjust by half of quality difference
    }

    // Frequency factor
    const daysSinceContact = (new Date() - new Date(person.lastContact)) / (1000 * 60 * 60 * 24);

    if (daysSinceContact < 7) {
      score += 2; // Recent contact
    } else if (daysSinceContact < 30) {
      score += 1;
    } else if (daysSinceContact > 180) {
      score -= 2; // Long time without contact
    }

    score = Math.max(0, Math.min(10, score)); // Clamp 0-10

    // Update health score
    await User.findByIdAndUpdate(
      userId,
      {
        $set: { "profile.relationshipMap.$[elem].healthScore": Math.round(score) },
      },
      {
        arrayFilters: [{ "elem.id": personId }],
      }
    );
  } catch (error) {
    console.error("Error updating relationship health:", error);
  }
}

/**
 * Get relationship map with visualization data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Relationship map with graph data
 */
export async function getRelationshipMap(userId) {
  try {
    const user = await User.findById(userId);
    const relationships = user.profile?.relationshipMap || [];

    // Organize by relationship type
    const byType = {};
    const nodes = [];
    const links = [];

    relationshipTypes.forEach((type) => {
      byType[type.id] = [];
    });

    // Create nodes for graph
    relationships.forEach((person, index) => {
      byType[person.relationship].push(person);

      nodes.push({
        id: person.id,
        name: person.name,
        type: person.relationship,
        healthScore: person.healthScore,
        lastContact: person.lastContact,
      });

      // Create link to user (center node)
      links.push({
        source: "user",
        target: person.id,
        type: person.relationship,
      });
    });

    // Add user as center node
    nodes.unshift({
      id: "user",
      name: user.name,
      type: "self",
      healthScore: 10,
    });

    return {
      userId,
      summary: {
        totalRelationships: relationships.length,
        byType,
        averageHealthScore:
          relationships.length > 0
            ? Math.round(
                relationships.reduce((sum, p) => sum + p.healthScore, 0) /
                  relationships.length
              )
            : 0,
      },
      relationships,
      visualization: {
        nodes,
        links,
      },
    };
  } catch (error) {
    console.error("Error getting relationship map:", error);
    throw error;
  }
}

/**
 * Get social circles (grouped relationships)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Organized social circles
 */
export async function getSocialCircles(userId) {
  try {
    const map = await getRelationshipMap(userId);

    const circles = {
      innerCircle: {
        description: "Close, trusted relationships",
        members: [],
        healthScoreRequired: 8,
      },
      middleCircle: {
        description: "Regular, supportive relationships",
        members: [],
        healthScoreRequired: 5,
      },
      outerCircle: {
        description: "Acquaintances and newer relationships",
        members: [],
        healthScoreRequired: 0,
      },
    };

    // Categorize by health score and relationship type
    for (const person of map.relationships) {
      const member = {
        name: person.name,
        relationship: person.relationshipLabel,
        emoji: person.relationshipEmoji,
        healthScore: person.healthScore,
        lastContact: person.lastContact,
      };

      if (person.healthScore >= 8) {
        circles.innerCircle.members.push(member);
      } else if (person.healthScore >= 5) {
        circles.middleCircle.members.push(member);
      } else {
        circles.outerCircle.members.push(member);
      }
    }

    return circles;
  } catch (error) {
    console.error("Error getting social circles:", error);
    throw error;
  }
}

/**
 * Get support network (who provides what support)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Support mapped by role
 */
export async function getSupportNetwork(userId) {
  try {
    const user = await User.findById(userId);
    const relationships = user.profile?.relationshipMap || [];

    const supportNetwork = {};

    supportRoles.forEach((role) => {
      supportNetwork[role.id] = {
        name: role.name,
        emoji: role.emoji,
        providers: [],
      };
    });

    // Map people to support roles
    for (const person of relationships) {
      if (person.supportRoles && person.supportRoles.length > 0) {
        for (const roleId of person.supportRoles) {
          if (supportNetwork[roleId]) {
            supportNetwork[roleId].providers.push({
              name: person.name,
              relationship: person.relationshipLabel,
              emoji: person.relationshipEmoji,
              lastContact: person.lastContact,
            });
          }
        }
      }
    }

    // Remove empty roles
    Object.keys(supportNetwork).forEach((key) => {
      if (supportNetwork[key].providers.length === 0) {
        delete supportNetwork[key];
      }
    });

    return {
      userId,
      supportNetwork,
      gaps: findSupportGaps(supportNetwork),
    };
  } catch (error) {
    console.error("Error getting support network:", error);
    throw error;
  }
}

/**
 * Find gaps in support network
 * @param {Object} supportNetwork - Support network object
 * @returns {Array} Missing support types
 */
function findSupportGaps(supportNetwork) {
  const allRoles = supportRoles.map((r) => r.id);
  const coveredRoles = Object.keys(supportNetwork);
  const gaps = allRoles.filter((r) => !coveredRoles.includes(r));

  return gaps.map((roleId) => {
    const role = supportRoles.find((r) => r.id === roleId);
    return {
      roleId,
      name: role.name,
      emoji: role.emoji,
      recommendation: `Consider building a relationship for ${role.name}`,
    };
  });
}

/**
 * Calculate social pillar score based on relationship health
 * @param {string} userId - User ID
 * @returns {Promise<number>} Social score 0-10
 */
export async function calculateSocialScore(userId) {
  try {
    const map = await getRelationshipMap(userId);

    // Score based on:
    // 1. Number of relationships (target: 10+)
    // 2. Average health score
    // 3. Support network diversity

    const relationshipCount = map.relationships.length;
    const avgHealth = map.summary.averageHealthScore;

    const supportNetwork = await getSupportNetwork(userId);
    const supportDiversity = Object.keys(supportNetwork.supportNetwork).length;

    let score = 5; // Base

    // Relationship count factor
    if (relationshipCount > 15) score += 3;
    else if (relationshipCount > 10) score += 2;
    else if (relationshipCount > 5) score += 1;

    // Health factor
    score += (avgHealth - 5) / 2;

    // Support diversity (max +2)
    score += Math.min(2, supportDiversity / 3);

    return Math.max(0, Math.min(10, Math.round(score)));
  } catch (error) {
    console.error("Error calculating social score:", error);
    return 5;
  }
}

export default {
  addPerson,
  recordInteraction,
  getRelationshipMap,
  getSocialCircles,
  getSupportNetwork,
  calculateSocialScore,
  relationshipTypes,
  supportRoles,
};
