/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 11: AI-Powered Nutrition Recipe Generator for Diet Pillar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Generates personalized recipes based on:
 * - Dietary restrictions (vegetarian, vegan, gluten-free, etc.)
 * - User preferences and dislikes
 * - Available ingredients
 * - Nutritional goals
 * - Preparation time
 * - Skill level
 * 
 * Features:
 * - AI generates unique recipes
 * - Detailed nutritional information
 * - Step-by-step instructions
 * - Shopping list generation
 * - Meal plan creation
 * - Recipe history and favorites
 */

import { openaiClient } from "../config/openai.js";
import User from "../models/User.js";
import Entry from "../models/Entry.js";

// Common dietary restrictions
const dietaryRestrictions = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut-free",
  "Keto",
  "Paleo",
  "Low-sodium",
  "Halal",
  "Kosher",
];

// Recipe difficulty levels
const skillLevels = ["Beginner", "Intermediate", "Advanced"];

// Meal types
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Smoothie"];

/**
 * Generate a personalized recipe
 * @param {string} userId - User ID
 * @param {Object} preferences - {dietary, ingredients, mealType, prepTime, skillLevel, servings, calories}
 * @returns {Promise<Object>} Generated recipe
 */
export async function generateRecipe(userId, preferences) {
  const {
    dietary = "None",
    ingredients = [],
    mealType = "Breakfast",
    prepTime = 30,
    skillLevel = "Intermediate",
    servings = 2,
    calories = 500,
  } = preferences;

  const prompt = `
Generate a detailed recipe with the following requirements:
- Dietary restriction: ${dietary}
- Meal type: ${mealType}
- Preferred ingredients: ${ingredients.join(", ") || "any healthy ingredients"}
- Preparation time: ${prepTime} minutes or less
- Skill level: ${skillLevel}
- Servings: ${servings}
- Target calories: ~${calories} per serving

Format your response as:
{
  "title": "Recipe name",
  "description": "1-2 sentence description",
  "prepTime": minutes,
  "cookTime": minutes,
  "servings": number,
  "difficulty": "level",
  "ingredients": [
    {"item": "name", "amount": "quantity", "unit": "cups/tbsp/etc", "calories": number}
  ],
  "instructions": [
    "Step 1: ...",
    "Step 2: ..."
  ],
  "nutrition": {
    "caloriesPerServing": number,
    "protein": "Xg",
    "carbs": "Xg",
    "fat": "Xg",
    "fiber": "Xg"
  },
  "tips": ["Tip 1", "Tip 2"],
  "variations": ["Variation 1", "Variation 2"],
  "tags": ["tag1", "tag2"]
}

Make sure it's realistic, delicious, and fits all requirements exactly.
  `;

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional chef and nutritionist. Generate detailed, delicious, and practical recipes.
          Always respond with valid JSON. Ensure recipes are realistic and can be made by ${skillLevel} cooks.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 2000,
    });

    const recipeText = response.choices[0].message.content;
    const recipe = JSON.parse(recipeText);

    // Enhance with additional data
    recipe.generatedAt = new Date();
    recipe.userId = userId;
    recipe.dietary = dietary;
    recipe.mealType = mealType;

    // Save to user's recipe collection
    await User.findByIdAndUpdate(userId, {
      $push: { "profile.generatedRecipes": recipe },
    });

    // Log as entry
    await Entry.create({
      userId,
      pillar: "diet",
      type: "recipe-generated",
      content: `Generated recipe: ${recipe.title}`,
      score: 8,
      data: recipe,
    });

    return recipe;
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw error;
  }
}

/**
 * Generate a weekly meal plan
 * @param {string} userId - User ID
 * @param {Object} mealPlanPrefs - {dietary, skillLevel, prepTime, calories}
 * @returns {Promise<Array>} 7-day meal plan
 */
export async function generateMealPlan(userId, mealPlanPrefs) {
  const meals = [];

  for (let day = 1; day <= 7; day++) {
    const mealTypes = ["Breakfast", "Lunch", "Dinner"];

    for (const mealType of mealTypes) {
      const recipe = await generateRecipe(userId, {
        ...mealPlanPrefs,
        mealType,
      });

      meals.push({
        day,
        dayName: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ][day - 1],
        mealType,
        recipe,
      });
    }
  }

  const mealPlan = {
    userId,
    meals,
    generatedAt: new Date(),
    preferences: mealPlanPrefs,
  };

  // Save meal plan
  await User.findByIdAndUpdate(userId, {
    "profile.currentMealPlan": mealPlan,
  });

  return mealPlan;
}

/**
 * Generate shopping list from recipes or meal plan
 * @param {Array} recipes - Array of recipe objects
 * @returns {Object} Organized shopping list
 */
export function generateShoppingList(recipes) {
  const shoppingList = {
    produce: [],
    proteins: [],
    dairy: [],
    pantry: [],
    frozen: [],
    other: [],
  };

  const categoryMap = {
    produce: [
      "vegetable",
      "fruit",
      "herb",
      "spice",
      "lettuce",
      "tomato",
      "carrot",
    ],
    proteins: ["meat", "fish", "chicken", "tofu", "bean", "lentil", "egg"],
    dairy: ["milk", "cheese", "yogurt", "butter", "cream"],
    pantry: ["flour", "rice", "pasta", "oil", "sauce", "salt", "sugar"],
    frozen: ["frozen"],
    other: [],
  };

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const item = {
        name: ingredient.item,
        amount: ingredient.amount,
        unit: ingredient.unit,
      };

      let categorized = false;
      const itemLower = ingredient.item.toLowerCase();

      for (const [category, keywords] of Object.entries(categoryMap)) {
        if (keywords.some((kw) => itemLower.includes(kw))) {
          shoppingList[category].push(item);
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        shoppingList.other.push(item);
      }
    }
  }

  // Deduplicate and consolidate
  for (const category in shoppingList) {
    const items = shoppingList[category];
    const consolidated = {};

    for (const item of items) {
      const key = item.name.toLowerCase();
      if (consolidated[key]) {
        // Add quantities if same unit
        if (item.unit === consolidated[key].unit) {
          const num1 = parseFloat(consolidated[key].amount) || 1;
          const num2 = parseFloat(item.amount) || 1;
          consolidated[key].amount = (num1 + num2).toString();
        } else {
          consolidated[key].notes = "Add both types";
        }
      } else {
        consolidated[key] = item;
      }
    }

    shoppingList[category] = Object.values(consolidated);
  }

  return shoppingList;
}

/**
 * Rate a recipe
 * @param {string} userId - User ID
 * @param {string} recipeTitle - Recipe title
 * @param {number} rating - 1-5 stars
 * @param {string} feedback - User feedback
 * @returns {Promise<void>}
 */
export async function rateRecipe(userId, recipeTitle, rating, feedback = "") {
  try {
    await Entry.create({
      userId,
      pillar: "diet",
      type: "recipe-rating",
      content: `Rated "${recipeTitle}": ${rating}/5 stars. ${feedback}`,
      score: rating,
      data: {
        recipeTitle,
        rating,
        feedback,
        ratedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error rating recipe:", error);
    throw error;
  }
}

/**
 * Mark recipe as favorite
 * @param {string} userId - User ID
 * @param {string} recipeTitle - Recipe title
 * @returns {Promise<void>}
 */
export async function markRecipeFavorite(userId, recipeTitle) {
  try {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { "profile.favoriteRecipes": recipeTitle },
    });
  } catch (error) {
    console.error("Error marking favorite:", error);
    throw error;
  }
}

/**
 * Get user's recipe history
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User's recipes
 */
export async function getUserRecipeHistory(userId) {
  try {
    const user = await User.findById(userId);
    return user?.profile?.generatedRecipes || [];
  } catch (error) {
    console.error("Error retrieving recipes:", error);
    return [];
  }
}

/**
 * Get suggested recipes based on dietary pattern
 * @param {string} userId - User ID
 * @param {number} limit - Number of suggestions (default 5)
 * @returns {Promise<Array>} Suggested recipes
 */
export async function getSuggestedRecipes(userId, limit = 5) {
  try {
    const user = await User.findById(userId);
    const dietary = user?.profile?.dietary || "None";
    const preferences = user?.profile?.foodPreferences || [];

    const suggestions = [];
    for (let i = 0; i < limit; i++) {
      const mealType =
        mealTypes[Math.floor(Math.random() * mealTypes.length)];
      const recipe = await generateRecipe(userId, {
        dietary,
        ingredients: preferences,
        mealType,
        prepTime: 30,
      });
      suggestions.push(recipe);
    }

    return suggestions;
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return [];
  }
}

export default {
  generateRecipe,
  generateMealPlan,
  generateShoppingList,
  rateRecipe,
  markRecipeFavorite,
  getUserRecipeHistory,
  getSuggestedRecipes,
  dietaryRestrictions,
  skillLevels,
  mealTypes,
};
