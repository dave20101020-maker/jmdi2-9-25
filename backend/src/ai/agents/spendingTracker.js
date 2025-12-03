/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 11: Spending Tracker for Finance Pillar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Track expenses and manage finances with:
 * - Expense categorization
 * - Budget setting and monitoring
 * - Spending patterns visualization
 * - Financial goals tracking
 * - Integration with finance pillar scoring
 * - Spending alerts and insights
 * 
 * Features:
 * - Manual entry and categorization
 * - Receipt scanning (image upload)
 * - Recurring expenses
 * - Budget vs actual comparison
 * - Monthly/yearly reports
 */

import User from "../models/User.js";
import Entry from "../models/Entry.js";

// Expense categories
const expenseCategories = [
  {
    id: "housing",
    name: "Housing",
    emoji: "🏠",
    color: "#FF6B6B",
    examples: ["Rent", "Mortgage", "Property tax"],
  },
  {
    id: "food",
    name: "Food & Groceries",
    emoji: "🍔",
    color: "#FFA500",
    examples: ["Groceries", "Restaurant", "Takeout"],
  },
  {
    id: "transportation",
    name: "Transportation",
    emoji: "🚗",
    color: "#4ECDC4",
    examples: ["Gas", "Public transit", "Car payment"],
  },
  {
    id: "utilities",
    name: "Utilities",
    emoji: "💡",
    color: "#95E1D3",
    examples: ["Electricity", "Water", "Internet"],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    emoji: "🏥",
    color: "#FF8B94",
    examples: ["Doctor", "Prescription", "Gym"],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    emoji: "🎬",
    color: "#A8E6CF",
    examples: ["Movies", "Games", "Concerts"],
  },
  {
    id: "shopping",
    name: "Shopping",
    emoji: "🛍️",
    color: "#FFD3B6",
    examples: ["Clothes", "Electronics", "Accessories"],
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    emoji: "🔄",
    color: "#FFAAA5",
    examples: ["Netflix", "Spotify", "Apps"],
  },
  {
    id: "personal-care",
    name: "Personal Care",
    emoji: "💅",
    color: "#FF8B94",
    examples: ["Hair", "Skincare", "Salon"],
  },
  {
    id: "education",
    name: "Education",
    emoji: "📚",
    color: "#AA96DA",
    examples: ["Tuition", "Books", "Courses"],
  },
  {
    id: "savings",
    name: "Savings",
    emoji: "🏦",
    color: "#FCBAD3",
    examples: ["Savings transfer", "Investment"],
  },
  {
    id: "other",
    name: "Other",
    emoji: "📌",
    color: "#D3D3D3",
    examples: ["Misc", "Gifts"],
  },
];

/**
 * Log an expense
 * @param {string} userId - User ID
 * @param {Object} expenseData - {amount, category, description, date, isRecurring, frequency}
 * @returns {Promise<Object>} Created expense entry
 */
export async function logExpense(userId, expenseData) {
  const {
    amount,
    category,
    description,
    date = new Date(),
    isRecurring = false,
    frequency = null, // 'weekly', 'monthly', 'yearly'
    tags = [],
  } = expenseData;

  try {
    // Validate amount
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    // Validate category
    const validCategory = expenseCategories.find((c) => c.id === category);
    if (!validCategory) throw new Error("Invalid category");

    // Create expense entry
    const entry = await Entry.create({
      userId,
      pillar: "finances",
      type: "expense",
      content: `${validCategory.emoji} ${description} - ${validCategory.name}`,
      score: -Math.min(Math.round(amount / 100), 10), // Negative score for spending
      data: {
        amount,
        category,
        categoryName: validCategory.name,
        description,
        date,
        isRecurring,
        frequency,
        tags,
        loggedAt: new Date(),
      },
    });

    // Update user spending stats
    await User.findByIdAndUpdate(userId, {
      $inc: {
        "finances.totalSpent": amount,
        [`finances.categorySpending.${category}`]: amount,
      },
      $addToSet: { "finances.expenses": entry._id },
    });

    // If recurring, set up future entries
    if (isRecurring && frequency) {
      await setupRecurringExpense(userId, expenseData);
    }

    return entry;
  } catch (error) {
    console.error("Error logging expense:", error);
    throw error;
  }
}

/**
 * Set up recurring expense
 * @param {string} userId - User ID
 * @param {Object} expenseData - Expense data
 * @returns {Promise<void>}
 */
async function setupRecurringExpense(userId, expenseData) {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        "finances.recurringExpenses": {
          ...expenseData,
          createdAt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Error setting up recurring expense:", error);
  }
}

/**
 * Set monthly budget for category
 * @param {string} userId - User ID
 * @param {string} category - Category ID
 * @param {number} amount - Budget amount
 * @returns {Promise<Object>} Updated user
 */
export async function setBudget(userId, category, amount) {
  try {
    return await User.findByIdAndUpdate(
      userId,
      {
        $set: { [`finances.budgets.${category}`]: amount },
      },
      { new: true }
    );
  } catch (error) {
    console.error("Error setting budget:", error);
    throw error;
  }
}

/**
 * Get spending summary for period
 * @param {string} userId - User ID
 * @param {string} period - 'week', 'month', 'year'
 * @returns {Promise<Object>} Spending summary
 */
export async function getSpendingSummary(userId, period = "month") {
  try {
    const startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Get expenses for period
    const entries = await Entry.find({
      userId,
      pillar: "finances",
      type: "expense",
      createdAt: { $gte: startDate },
    });

    // Group by category
    const byCategory = {};
    let totalSpent = 0;

    for (const entry of entries) {
      const category = entry.data.category;
      const amount = entry.data.amount;

      if (!byCategory[category]) {
        byCategory[category] = {
          category,
          categoryName: entry.data.categoryName,
          total: 0,
          count: 0,
          expenses: [],
        };
      }

      byCategory[category].total += amount;
      byCategory[category].count += 1;
      byCategory[category].expenses.push(entry.data);
      totalSpent += amount;
    }

    // Get budgets
    const user = await User.findById(userId);
    const budgets = user?.finances?.budgets || {};

    // Compare to budgets
    const categoryAnalysis = [];
    for (const [category, data] of Object.entries(byCategory)) {
      const budget = budgets[category] || 0;
      const spent = data.total;
      const remaining = budget - spent;
      const percentOfBudget = budget > 0 ? (spent / budget) * 100 : 0;

      categoryAnalysis.push({
        category: data.category,
        categoryName: data.categoryName,
        spent,
        budget,
        remaining,
        percentOfBudget: Math.round(percentOfBudget),
        isOverBudget: spent > budget,
        transactionCount: data.count,
      });
    }

    // Sort by spending
    categoryAnalysis.sort((a, b) => b.spent - a.spent);

    return {
      userId,
      period,
      startDate,
      endDate: new Date(),
      totalSpent,
      totalBudget: Object.values(budgets).reduce((a, b) => a + b, 0),
      byCategory: categoryAnalysis,
      insights: generateSpendingInsights(categoryAnalysis),
    };
  } catch (error) {
    console.error("Error getting spending summary:", error);
    throw error;
  }
}

/**
 * Generate spending insights
 * @param {Array} categoryAnalysis - Spending by category
 * @returns {Array} Insights and recommendations
 */
function generateSpendingInsights(categoryAnalysis) {
  const insights = [];

  // Find overspending
  const overspent = categoryAnalysis.filter((c) => c.isOverBudget);
  if (overspent.length > 0) {
    insights.push({
      type: "warning",
      message: `⚠️ Over budget in ${overspent.map((c) => c.categoryName).join(", ")}`,
      categories: overspent.map((c) => c.category),
    });
  }

  // Find highest spending
  const top3 = categoryAnalysis.slice(0, 3);
  const topSpent = top3.reduce((sum, c) => sum + c.spent, 0);
  const topPercent = Math.round((topSpent / categoryAnalysis.reduce((sum, c) => sum + c.spent, 0)) * 100);

  insights.push({
    type: "info",
    message: `💰 Top 3 categories account for ${topPercent}% of spending`,
    categories: top3.map((c) => c.category),
  });

  // Find savings opportunity
  const underBudget = categoryAnalysis.filter((c) => !c.isOverBudget && c.budget > 0);
  if (underBudget.length > 0) {
    insights.push({
      type: "positive",
      message: "✅ Great job staying under budget!",
      categories: underBudget.map((c) => c.category),
    });
  }

  return insights;
}

/**
 * Get budget vs actual comparison
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Budget comparison
 */
export async function getBudgetComparison(userId) {
  try {
    const user = await User.findById(userId);
    const budgets = user?.finances?.budgets || {};

    const summary = await getSpendingSummary(userId, "month");

    const comparison = {
      userId,
      budgets: Object.entries(budgets).map(([category, budget]) => {
        const categoryData = summary.byCategory.find((c) => c.category === category);
        return {
          category,
          categoryName:
            expenseCategories.find((c) => c.id === category)?.name || category,
          budget,
          spent: categoryData?.spent || 0,
          remaining: budget - (categoryData?.spent || 0),
          percentUsed: categoryData
            ? Math.round((categoryData.spent / budget) * 100)
            : 0,
        };
      }),
      totalBudget: Object.values(budgets).reduce((a, b) => a + b, 0),
      totalSpent: summary.totalSpent,
      totalRemaining:
        Object.values(budgets).reduce((a, b) => a + b, 0) - summary.totalSpent,
    };

    comparison.budgets.sort(
      (a, b) => b.percentUsed - a.percentUsed
    );

    return comparison;
  } catch (error) {
    console.error("Error getting budget comparison:", error);
    throw error;
  }
}

/**
 * Get expense history
 * @param {string} userId - User ID
 * @param {number} days - Last N days (default 30)
 * @returns {Promise<Array>} User's expense entries
 */
export async function getExpenseHistory(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await Entry.find({
      userId,
      pillar: "finances",
      type: "expense",
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });

    return entries;
  } catch (error) {
    console.error("Error retrieving expense history:", error);
    return [];
  }
}

/**
 * Calculate finance pillar score based on spending habits
 * @param {string} userId - User ID
 * @returns {Promise<number>} Finance score 0-10
 */
export async function calculateFinanceScore(userId) {
  try {
    const user = await User.findById(userId);
    const comparison = await getBudgetComparison(userId);

    // Score calculation:
    // 10 = perfect (no overspending, good savings)
    // 5 = moderate (some overspending, adequate savings)
    // 0 = poor (significant overspending)

    const totalBudget = comparison.totalBudget;
    const totalSpent = comparison.totalSpent;

    if (totalBudget === 0) return 5; // No budget set

    const spendingRatio = totalSpent / totalBudget;
    let score = 10;

    if (spendingRatio > 1) {
      // Over budget
      const overage = Math.min((spendingRatio - 1) * 10, 5);
      score -= overage;
    } else if (spendingRatio > 0.8) {
      // Close to budget
      score -= (spendingRatio - 0.8) * 5;
    } else {
      // Under budget (good)
      score = 10;
    }

    return Math.max(0, Math.round(score));
  } catch (error) {
    console.error("Error calculating finance score:", error);
    return 5;
  }
}

export default {
  logExpense,
  setBudget,
  getSpendingSummary,
  getBudgetComparison,
  getExpenseHistory,
  calculateFinanceScore,
  expenseCategories,
};
