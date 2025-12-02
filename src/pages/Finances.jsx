
import { api } from "@/utils/apiClient";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PillarPage from "@/components/shared/PillarPage";
import ActionCard from "@/components/shared/ActionCard";
import DataCard from "@/components/shared/DataCard";
import PillarAtAGlance from "@/components/shared/PillarAtAGlance";
import RecentActivity from "@/components/shared/RecentActivity";
import LogDetailModal from "@/components/shared/LogDetailModal";
import LinearProgress from "@/components/shared/LinearProgress";
import MilestonesSection from "@/components/shared/MilestonesSection"; // NEW IMPORT
import PillarTip from "@/components/shared/PillarTip"; // NEW IMPORT
import { getTipsForPillar } from "@/utils/pillarTips"; // NEW IMPORT
import ExpenseLogger from "@/components/shared/ExpenseLogger";
import BudgetManager from "@/components/shared/BudgetManager";
import SavingsGoalCard from "@/components/shared/SavingsGoalCard";
import SavingsGoalForm from "@/components/shared/SavingsGoalForm";
import { PILLARS } from '@/utils';
import {
  DollarSign, TrendingUp, PiggyBank, Plus, Receipt, Target,
  AlertCircle, CheckCircle2, Calendar, CreditCard,
  Award, TrendingDown, Zap, BarChart // NEW ICONS & BarChart from outline
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, differenceInHours, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'; // NEW RECHARTS IMPORTS

const PILLAR = PILLARS.finances;

const CATEGORIES = [
  { value: "housing", label: "Housing", emoji: "🏠", color: "#6B46C1" },
  { value: "food", label: "Food", emoji: "🍕", color: "#52B788" },
  { value: "transportation", label: "Transportation", emoji: "🚗", color: "#4CC9F0" },
  { value: "utilities", label: "Utilities", emoji: "💡", color: "#FFD700" },
  { value: "healthcare", label: "Healthcare", emoji: "❤️", color: "#FF5733" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬", color: "#FF69B4" },
  { value: "shopping", label: "Shopping", emoji: "🛍️", color: "#9370DB" },
  { value: "education", label: "Education", emoji: "📚", color: "#4169E1" },
  { value: "personal", label: "Personal", emoji: "💅", color: "#FF1493" },
  { value: "savings", label: "Savings", emoji: "💰", color: "#2E8B57" },
  { value: "other", label: "Other", emoji: "📦", color: "#708090" }
];

export default function Finances() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [showExpenseLogger, setShowExpenseLogger] = useState(false);
  const [showBudgetManager, setShowBudgetManager] = useState(false);
  const [showSavingsGoalForm, setShowSavingsGoalForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null); // Preserve from current_file_code
  const [editingBudget, setEditingBudget] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null); // Preserve from current_file_code
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalType, setDetailModalType] = useState(null);

  useEffect(() => {
    async function getUser() {
      const currentUser = await api.authMe();
      setUser(currentUser);
    }
    getUser();
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', user?.email],
    queryFn: () => api.getExpenses({ userId: user?.email }, '-date', 200),
    enabled: !!user,
    initialData: []
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', user?.email],
    queryFn: () => api.getBudgets({ userId: user?.email }),
    enabled: !!user,
    initialData: [] // Preserve initialData
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals', user?.email],
    queryFn: () => api.getSavingsGoals({ userId: user?.email }, '-created_date'),
    enabled: !!user,
    initialData: [] // Preserve initialData
  });

  const saveExpenseMutation = useMutation({
    mutationFn: (data) => {
      if (editingExpense) {
        return api.updateExpense(editingExpense.id, data);
      }
      return api.createExpense({ userId: user.email, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.email] });
      setShowExpenseLogger(false);
      setEditingExpense(null);
      toast.success('Expense saved!');
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', user?.email] });
      toast.success('Expense deleted');
    }
  });

  const saveBudgetMutation = useMutation({
    mutationFn: (data) => {
      if (editingBudget) {
        return api.updateBudget(editingBudget.id, data);
      }
      return api.createBudget({ userId: user.email, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.email] });
      setShowBudgetManager(false);
      setEditingBudget(null);
      toast.success('Budget saved!');
    }
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id) => api.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.email] });
      toast.success('Budget removed');
    }
  });

  const saveSavingsGoalMutation = useMutation({
    mutationFn: (data) => {
      if (editingGoal) {
        return api.updateSavingsGoal(editingGoal.id, data);
      }
      return api.createSavingsGoal({
        userId: user.email,
        contributions: [],
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals', user?.email] });
      setShowSavingsGoalForm(false);
      setEditingGoal(null);
      toast.success('Savings goal saved!');
    }
  });

  const addContributionMutation = useMutation({
    mutationFn: ({ goalId, amount }) => {
      const goal = savingsGoals.find(g => g.id === goalId);
      const newContributions = [
        ...(goal.contributions || []),
        { date: today, amount, note: "" }
      ];
      const newCurrent = (goal.currentAmount || 0) + amount;
      const isCompleted = newCurrent >= goal.targetAmount;

      return api.updateSavingsGoal(goalId, {
        currentAmount: newCurrent,
        contributions: newContributions,
        isCompleted
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals', user?.email] });
      toast.success('Contribution added! 💰');
    }
  });

  const deleteSavingsGoalMutation = useMutation({
    mutationFn: (id) => api.deleteSavingsGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals', user?.email] });
      toast.success('Savings goal deleted');
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full animate-pulse"
            style={{
              backgroundColor: `${PILLAR.color}20`,
              boxShadow: `0 0 30px ${PILLAR.color}40`
            }}
          />
          <p className="text-white/60">Loading financial data...</p>
        </div>
      </div>
    );
  }

  // --- Calculations for "At a Glance" and updated stats ---
  const thisMonthExpenses = expenses.filter(e => e.date >= monthStart);
  const monthlySpend = thisMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0); // Preserve (e.amount || 0)

  const expensesByCategory = {}; // Preserve from current_file_code
  CATEGORIES.forEach(cat => {
    expensesByCategory[cat.value] = thisMonthExpenses
      .filter(e => e.category === cat.value)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  });

  const activeBudgets = budgets.filter(b => b.isActive);
  const budgetPerformance = activeBudgets.map(budget => {
    const spent = expensesByCategory[budget.category] || 0; // Use expensesByCategory
    const percentage = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
    return { ...budget, spent, percentage };
  });

  const overBudget = budgetPerformance.filter(b => b.percentage > 100).length;
  const onTrack = budgetPerformance.filter(b => b.percentage <= 80).length;
  const nearLimit = budgetPerformance.filter(b => b.percentage > 80 && b.percentage <= 100).length;

  const budgetStatus = overBudget > 0 ? "Over Budget" : nearLimit > 0 ? "Close" : "On Track";
  const budgetStatusColor = overBudget > 0 ? "#FF5733" : nearLimit > 0 ? "#FFD700" : "#52B788";

  const activeSavingsGoals = savingsGoals.filter(g => !g.isCompleted);
  const completedGoals = savingsGoals.filter(g => g.isCompleted);
  const totalSaved = savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0); // Preserve (g.currentAmount || 0)

  const latestExpense = expenses.length > 0 ? expenses[0] : null;
  const hoursAgoExpense = latestExpense
    ? Math.round(differenceInHours(new Date(), new Date(latestExpense.updated_date || latestExpense.created_date)))
    : null;

  const avgSavingsProgress = activeSavingsGoals.length > 0
    ? Math.round(
      activeSavingsGoals.reduce((sum, g) =>
        sum + (((g.currentAmount || 0) / (g.targetAmount || 1)) * 100), 0 // Preserve (|| 0) and (|| 1)
      ) / activeSavingsGoals.length
    )
    : 0;

  const spendTrend = expenses.length >= 14
    ? (() => {
      const todayDate = new Date();
      const thisWeekSpend = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return differenceInDays(todayDate, expenseDate) <= 7;
      }).reduce((sum, e) => sum + (e.amount || 0), 0); // Preserve (|| 0)

      const lastWeekSpend = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        const daysDiff = differenceInDays(todayDate, expenseDate);
        return daysDiff > 7 && daysDiff <= 14;
      }).reduce((sum, e) => sum + (e.amount || 0), 0); // Preserve (|| 0)

      // Reverting to original logic: "up" means more spending
      if (thisWeekSpend > lastWeekSpend && lastWeekSpend !== 0) return "up";
      if (thisWeekSpend < lastWeekSpend) return "down";
      if (thisWeekSpend > 0 && lastWeekSpend === 0) return "up"; // Spent this week, nothing last week implies upward trend
      return "stable";
    })()
    : "stable";

  // NEW: Milestones calculations
  const recentCompletedGoal = completedGoals.length > 0
    ? completedGoals.sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date))[0] // Preserve updated_date || created_date
    : null;

  const biggestSaving = expenses.length >= 14
    ? (() => {
      const todayDate = new Date();
      const thisWeekSpend = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return differenceInDays(todayDate, expenseDate) <= 7;
      }).reduce((sum, e) => sum + (e.amount || 0), 0);

      const lastWeekSpend = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        const daysDiff = differenceInDays(todayDate, expenseDate);
        return daysDiff > 7 && daysDiff <= 14;
      }).reduce((sum, e) => sum + (e.amount || 0), 0);

      // If this week's spending is less than last week's, it's a "saving"
      return lastWeekSpend - thisWeekSpend;
    })()
    : 0;

  const perfectBudgetMonths = budgetPerformance.every(b => b.percentage <= 100) && budgetPerformance.length > 0;

  // NEW from outline: Top 3 spending categories
  const categorySpending = CATEGORIES.map(cat => {
    const spent = thisMonthExpenses.filter(e => e.category === cat.value).reduce((sum, e) => sum + (e.amount || 0), 0);
    return { ...cat, spent };
  }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent);

  const top3Categories = categorySpending.slice(0, 3);

  // NEW from outline: Nearest savings goal (by percentage)
  const nearestGoal = activeSavingsGoals.length > 0
    ? activeSavingsGoals.map(g => ({
      ...g,
      percentage: ((g.currentAmount || 0) / (g.targetAmount || 1)) * 100, // Preserve (|| 0) and (|| 1)
      remaining: (g.targetAmount || 0) - (g.currentAmount || 0) // Preserve (|| 0)
    })).sort((a, b) => b.percentage - a.percentage)[0]
    : null;

  // NEW from outline: Budget alerts
  const budgetAlerts = budgetPerformance.filter(b => b.percentage >= 80).sort((a, b) => b.percentage - a.percentage);

  const milestones = [
    recentCompletedGoal && differenceInDays(new Date(), new Date(recentCompletedGoal.updated_date || recentCompletedGoal.created_date)) <= 30 && { // Preserve updated_date || created_date
      id: 'goal-reached',
      type: 'goal',
      icon: Target,
      title: 'Savings Goal Reached!',
      description: recentCompletedGoal.goalName,
      value: `$${Math.round(recentCompletedGoal.targetAmount || 0).toLocaleString()}`, // Preserve (|| 0) and toLocaleString
      color: "#52B788",
      date: format(new Date(recentCompletedGoal.updated_date || recentCompletedGoal.created_date), 'MMM d, yyyy'), // Preserve updated_date || created_date
      isNew: differenceInDays(new Date(), new Date(recentCompletedGoal.updated_date || recentCompletedGoal.created_date)) <= 7 // Preserve updated_date || created_date
    },
    biggestSaving >= 50 && { // Only show for significant savings, e.g., $50+ (Reverted to 50 from 100)
      id: 'spending-reduction',
      type: 'improvement',
      icon: TrendingDown,
      title: 'Spending Reduced',
      description: 'Spent less than last week',
      value: `-$${Math.round(biggestSaving).toLocaleString()}`, // Preserve toLocaleString
      color: "#4CC9F0",
      date: 'This week',
      isNew: true
    },
    perfectBudgetMonths && {
      id: 'budget-master',
      type: 'award',
      icon: Award,
      title: 'Budget Master',
      description: 'All budgets on track this month',
      value: `${budgetPerformance.length}/${budgetPerformance.length}`,
      color: "#FFD700",
      date: format(new Date(), 'MMM yyyy'),
      isNew: true
    },
    totalSaved >= 1000 && {
      id: 'savings-milestone',
      type: 'achievement',
      icon: PiggyBank,
      title: 'Savings Milestone',
      description: 'Total amount saved across all goals',
      value: `$${Math.round(totalSaved).toLocaleString()}`, // Preserve toLocaleString
      color: PILLAR.color,
      isNew: false
    }
  ].filter(Boolean);


  const atAGlanceMetrics = [
    {
      icon: <DollarSign />,
      label: "Monthly Spend",
      value: `$${Math.round(monthlySpend).toLocaleString()}`, // Preserve toLocaleString
      subtitle: `${thisMonthExpenses.length} transactions`,
      trend: spendTrend,
      lastUpdated: hoursAgoExpense !== null ? `${hoursAgoExpense}h ago` : "No expenses",
      color: "#FF5733" // Re-added color
    },
    {
      icon: budgetStatus === "On Track" ? <CheckCircle2 /> : <AlertCircle />,
      label: "Budget Health",
      value: budgetStatus,
      subtitle: `${activeBudgets.length} active`,
      color: budgetStatusColor,
      message: overBudget > 0
        ? `⚠️ ${overBudget} budget${overBudget > 1 ? 's' : ''} over limit`
        : nearLimit > 0
          ? `⚡ ${nearLimit} budget${nearLimit > 1 ? 's' : ''} near limit`
          : onTrack > 0
            ? `✨ ${onTrack} budget${onTrack > 1 ? 's' : ''} on track`
            : null
    },
    {
      icon: <PiggyBank />,
      label: "Savings Progress",
      value: activeSavingsGoals.length > 0 ? `${avgSavingsProgress}%` : "—",
      subtitle: `${activeSavingsGoals.length} active goal${activeSavingsGoals.length !== 1 ? 's' : ''}`,
      progress: avgSavingsProgress,
      color: "#52B788", // Re-added color
      trend: avgSavingsProgress >= 75 ? "up" : avgSavingsProgress >= 40 ? "stable" : "down"
    }
  ];

  // NEW: Recent Activity Data
  const recentActivityData = [
    ...expenses.slice(0, 3).map(e => {
      const category = CATEGORIES.find(c => c.value === e.category);
      return {
        id: `expense-${e.id}`, // Keep consistent ID format
        type: 'expense',
        icon: Receipt,
        title: `${category?.emoji || '💵'} ${e.description || category?.label || 'Expense'}`,
        summary: `$${(e.amount || 0).toLocaleString()} • ${category?.label || e.category}${e.paymentMethod ? ` • ${e.paymentMethod}` : ''}`, // Ensure formatting
        timestamp: e.date,
        color: category?.color || "#FF5733", // Preserve original color for expense
        badges: [
          { text: `$${(e.amount || 0).toLocaleString()}`, color: "#FF5733" }, // Preserve original color for expense
          { text: category?.label || e.category, color: category?.color || "#FFD700" }
        ],
        data: e
      };
    }),
    ...savingsGoals.filter(g => g.contributions?.length > 0).flatMap(g =>
      g.contributions.slice(0, 1).map(c => ({
        id: `savings-${g.id}-${c.date}`, // Keep consistent ID format
        type: 'savings',
        icon: PiggyBank,
        title: g.goalName,
        summary: `+$${(c.amount || 0).toLocaleString()} contribution${c.note ? ` • ${c.note}` : ''}`, // Ensure formatting
        timestamp: c.date,
        color: "#52B788", // Preserve original color for savings
        badges: [
          { text: `+$${(c.amount || 0).toLocaleString()}`, color: "#52B788" }, // Preserve original color for savings
          { text: `${Math.round(((g.currentAmount || 0) / (g.targetAmount || 1)) * 100)}% complete`, color: "#4CC9F0" }
        ],
        data: { ...g, latestContribution: c }
      }))
    )
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  const handleActivityClick = (activity) => {
    setSelectedLog(activity.data);
    setDetailModalType(activity.type);
  };

  const stats = [
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: "Monthly Spend",
      value: `$${Math.round(monthlySpend).toLocaleString()}`, // Ensure formatting
      subtitle: `${thisMonthExpenses.length} transactions`,
      color: "#FF5733" // Keep existing color
    },
    {
      icon: <Target className="w-4 h-4" />,
      label: "Budget Status",
      value: budgetStatus,
      subtitle: `${activeBudgets.length} tracked`,
      color: budgetStatusColor
    },
    {
      icon: <PiggyBank className="w-4 h-4" />,
      label: "Savings Goals",
      value: activeSavingsGoals.length,
      subtitle: "active",
      color: "#52B788" // Keep existing color
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Total Saved",
      value: `$${Math.round(totalSaved).toLocaleString()}`, // Ensure formatting
      subtitle: "accumulated",
      color: "#4CC9F0" // Keep existing color
    }
  ];

  return (
    <PillarPage pillar={PILLAR} title="Finances" subtitle="Track expenses, budgets, and savings" stats={stats}>
      {/* At a Glance Section */}
      <PillarAtAGlance metrics={atAGlanceMetrics} color={PILLAR.color} />

      {/* NEW: Milestones Section */}
      {milestones.length > 0 && (
        <MilestonesSection
          milestones={milestones}
          color={PILLAR.color}
          title="Financial Achievements"
          compact={true}
        />
      )}

      {/* NEW: Pro Tip Section */}
      <PillarTip
        tips={getTipsForPillar('finances')}
        color={PILLAR.color}
        icon={DollarSign}
        title="Money Tip"
      />

      {/* NEW: Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-5 mb-6"
          style={{ boxShadow: '0 0 30px rgba(255, 87, 51, 0.2)' }}
        >
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#FF5733]" />
            Budget Alerts
          </h3>

          <div className="space-y-3">
            {budgetAlerts.map(budget => {
              const category = CATEGORIES.find(c => c.value === budget.category);
              const alertColor = budget.percentage > 100 ? "#FF5733" : "#FFD700";

              return (
                <div key={budget.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category?.emoji || '💰'}</span>
                      <div>
                        <div className="text-white font-bold">{category?.label || budget.category}</div>
                        <div className="text-white/60 text-xs">
                          ${Math.round(budget.spent).toLocaleString()} of ${Math.round(budget.monthlyLimit).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold" style={{ color: alertColor }}>
                        {Math.round(budget.percentage)}%
                      </div>
                      {budget.percentage > 100 && (
                        <div className="text-xs text-red-400">
                          ${Math.round(budget.spent - budget.monthlyLimit).toLocaleString()} over
                        </div>
                      )}
                    </div>
                  </div>
                  <LinearProgress
                    value={budget.spent}
                    max={budget.monthlyLimit}
                    height={8}
                    color={alertColor}
                    showValue={false}
                    showPercentage={false}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* NEW: Top 3 Spending Categories */}
        {top3Categories.length > 0 && (
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5"
            style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
          >
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5" style={{ color: PILLAR.color }} />
              Top Spending This Month
            </h3>

            <div className="space-y-3">
              {top3Categories.map((cat, idx) => {
                const percentage = monthlySpend > 0 ? (cat.spent / monthlySpend) * 100 : 0;

                return (
                  <div key={cat.value}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-white/90 text-sm">{cat.label}</span>
                      </div>
                      <div className="text-white font-bold">${Math.round(cat.spent).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: cat.color
                          }}
                        />
                      </div>
                      <span className="text-white/60 text-xs w-12 text-right">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NEW: Nearest Savings Goal */}
        {nearestGoal && (
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5"
            style={{ boxShadow: `0 0 30px #FFD70020` }}
          >
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FFD700]" />
              Closest to Completion
            </h3>

            <div className="text-center">
              <div className="text-3xl mb-2">{nearestGoal.emoji || '🎯'}</div>
              <div className="text-white font-bold text-lg mb-1">{nearestGoal.goalName}</div>
              <div className="text-white/60 text-sm mb-4">
                ${(nearestGoal.currentAmount || 0).toLocaleString()} of ${(nearestGoal.targetAmount || 0).toLocaleString()}
              </div>

              <div className="relative">
                <svg className="w-full" viewBox="0 0 200 100" style={{ height: '100px' }}>
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#52B788"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(nearestGoal.percentage * 2.51) || 0} 251`}
                    transform="rotate(-180 100 100)"
                    style={{ filter: 'drop-shadow(0 0 8px #52B78880)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#52B788]">
                      {Math.round(nearestGoal.percentage || 0)}%
                    </div>
                    <div className="text-white/60 text-xs">${Math.round(nearestGoal.remaining || 0).toLocaleString()} to go</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Progress Tracker - Savings Goals */}
      {activeSavingsGoals.length > 0 && (
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6"
          style={{ boxShadow: `0 0 30px ${PILLAR.color}20` }}
        >
          <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <PiggyBank className="w-5 h-5" style={{ color: PILLAR.color }} />
            Active Savings Goals
          </h3>

          <div className="space-y-4">
            {activeSavingsGoals.slice(0, 3).map(goal => {
              const progress = ((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100;
              const category = CATEGORIES.find(c => c.value === goal.category);

              return (
                <div key={goal.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{goal.emoji || category?.emoji || '💰'}</span>
                      <div>
                        <h4 className="text-white font-bold">{goal.goalName}</h4>
                        <div className="text-white/60 text-xs">
                          ${(goal.currentAmount || 0).toLocaleString()} of ${(goal.targetAmount || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="2xl font-bold" style={{ color: "#52B788" }}>
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </div>

                  <LinearProgress
                    value={goal.currentAmount}
                    max={goal.targetAmount}
                    height={10}
                    color="#52B788"
                    showValue={false}
                    showPercentage={false}
                    milestones={goal.targetAmount >= 1000 ? [ // Only show milestones for larger goals
                      { value: (goal.targetAmount || 0) * 0.25, label: '25%', color: "#FFD700" },
                      { value: (goal.targetAmount || 0) * 0.5, label: '50%', color: "#4CC9F0" },
                      { value: (goal.targetAmount || 0) * 0.75, label: '75%', color: "#7C3AED" }
                    ] : []}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      <RecentActivity
        activities={recentActivityData}
        color={PILLAR.color}
        onItemClick={handleActivityClick}
        emptyMessage="No financial activity logged yet"
        emptyIcon={DollarSign}
        emptyAction={
          <Button
            onClick={() => { // Keep existing logic for setEditingExpense(null)
              setEditingExpense(null);
              setShowExpenseLogger(true);
            }}
            className="bg-gradient-to-r from-[#2E8B57] to-[#3CB371] text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log First Expense
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 mt-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "expenses", label: "Expenses" },
          { id: "budgets", label: "Budgets" },
          { id: "savings", label: "Savings" }
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`py-2.5 px-2 rounded-xl font-bold transition-all text-sm ${
              activeView === view.id
                ? 'text-white'
                : 'bg-[#1a1f35] border border-white/20 text-white hover:bg-white/5'
            }`}
            style={activeView === view.id ? {
              background: `linear-gradient(to right, ${PILLAR.color}, ${PILLAR.color}CC)`,
              boxShadow: `0 0 20px ${PILLAR.color}40`
            } : {}}
          >
            {view.label}
          </button>
        ))}
      </div>

      {activeView === "overview" && (
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <ActionCard
              icon={DollarSign}
              title="Log Expense"
              description="Track spending"
              stats={`${expenses.length} logged`}
              color="#FF5733"
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseLogger(true);
              }}
            />
            <ActionCard
              icon={PieChart}
              title="Set Budget"
              description="Control spending"
              stats={`${budgets.length} budgets`}
              color="#4CC9F0"
              onClick={() => {
                setEditingBudget(null);
                setShowBudgetManager(true);
              }}
            />
            <ActionCard
              icon={Target}
              title="Savings Goal"
              description="Build wealth"
              stats={`${savingsGoals.length} goals`}
              color="#52B788"
              onClick={() => {
                setEditingGoal(null);
                setShowSavingsGoalForm(true);
              }}
            />
          </div>

          {budgets.length > 0 && (
            <DataCard title="Budget Overview" titleIcon={<PieChart />} color="#4CC9F0">
              <div className="space-y-4">
                {budgets.filter(b => b.isActive).map(budget => {
                  const spent = expensesByCategory[budget.category] || 0;
                  const percentage = budget.monthlyLimit > 0
                    ? Math.min((spent / budget.monthlyLimit) * 100, 100)
                    : 0;
                  const isOverBudget = percentage >= 100;
                  const isNearLimit = percentage >= (budget.alertThreshold || 90);
                  const category = CATEGORIES.find(c => c.value === budget.category);

                  return (
                    <div key={budget.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{category?.emoji}</span>
                          <div>
                            <div className="text-white font-bold">{category?.label}</div>
                            <div className="text-white/60 text-xs">
                              ${spent.toLocaleString()} / ${(budget.monthlyLimit || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {(isOverBudget || isNearLimit) && (
                          <AlertCircle className={`w-5 h-5 ${isOverBudget ? 'text-red-400' : 'text-orange-400'}`} />
                        )}
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: isOverBudget ? '#FF5733' : isNearLimit ? '#FFD700' : category?.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </DataCard>
          )}

          {thisMonthExpenses.length > 0 && (
            <DataCard title="Recent Expenses" titleIcon={<Calendar />} color="#FF5733">
              <div className="space-y-2">
                {thisMonthExpenses.slice(0, 5).map(expense => {
                  const category = CATEGORIES.find(c => c.value === expense.category);
                  return (
                    <div key={expense.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: `${category?.color}20` }}
                        >
                          {category?.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-white font-medium truncate">{expense.description}</div>
                          <div className="text-white/60 text-xs">
                            {format(new Date(expense.date), 'MMM d')} • {category?.label}
                          </div>
                        </div>
                      </div>
                      <div className="text-red-400 font-bold whitespace-nowrap ml-3">-${(expense.amount || 0).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </DataCard>
          )}
        </div>
      )}

      {activeView === "expenses" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">Expense History</h2>
            <Button
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseLogger(true);
              }}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold w-full sm:w-auto"
            >
              <Plus className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              Log Expense
            </Button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <DollarSign className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Start Tracking</h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Log your expenses to understand spending patterns and stay within budget
              </p>
              <Button
                onClick={() => setShowExpenseLogger(true)}
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold"
              >
                Log First Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map(expense => {
                const category = CATEGORIES.find(c => c.value === expense.category);
                return (
                  <div key={expense.id} className="bg-[#1a1f35] border border-white/20 rounded-xl p-4 hover:bg-white/5 transition-all backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{
                            backgroundColor: `${category?.color}20`,
                            boxShadow: `0 0 10px ${category?.color}40`
                          }}
                        >
                          {category?.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold truncate">{expense.description}</div>
                          <div className="text-white/60 text-sm mt-1">
                            {format(new Date(expense.date), 'MMM d, yyyy')} • {category?.label}
                            {expense.paymentMethod && ` • ${expense.paymentMethod}`}
                          </div>
                          {expense.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {expense.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <div className="text-red-400 font-bold text-xl">-${(expense.amount || 0).toLocaleString()}</div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => {
                              setEditingExpense(expense);
                              setShowExpenseLogger(true);
                            }}
                            className="text-white/60 hover:text-white text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this expense?')) {
                                deleteExpenseMutation.mutate(expense.id);
                              }
                            }}
                            className="text-white/60 hover:text-red-400 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === "budgets" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">Budget Management</h2>
            <Button
              onClick={() => {
                setEditingBudget(null);
                setShowBudgetManager(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold w-full sm:w-auto"
            >
              <Plus className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              Add Budget
            </Button>
          </div>

          {budgets.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <PieChart className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Create Your Budget</h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Set spending limits for each category to control your finances
              </p>
              <Button
                onClick={() => setShowBudgetManager(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold"
              >
                Create First Budget
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map(budget => {
                const spent = expensesByCategory[budget.category] || 0;
                const percentage = budget.monthlyLimit > 0
                  ? Math.min((spent / budget.monthlyLimit) * 100, 100)
                  : 0;
                const remaining = Math.max(budget.monthlyLimit - spent, 0);
                const isOverBudget = percentage >= 100;
                const isNearLimit = percentage >= (budget.alertThreshold || 90);
                const category = CATEGORIES.find(c => c.value === budget.category);

                return (
                  <div
                    key={budget.id}
                    className="bg-[#1a1f35] border border-white/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm"
                    style={{ boxShadow: `0 0 20px ${category?.color}20` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                          style={{
                            backgroundColor: `${category?.color}20`,
                            boxShadow: `0 0 10px ${category?.color}40`
                          }}
                        >
                          {category?.emoji}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-base md:text-lg">{category?.label}</h3>
                          <p className="text-white/60 text-xs md:text-sm">${(budget.monthlyLimit || 0).toLocaleString()}/month</p>
                        </div>
                      </div>
                      {(isOverBudget || isNearLimit) && (
                        <AlertCircle className={`w-5 md:w-6 h-5 md:h-6 flex-shrink-0 ${isOverBudget ? 'text-red-400' : 'text-orange-400'}`} />
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/70 text-sm">Spent this month</span>
                        <span className="font-bold" style={{ color: isOverBudget ? '#FF5733' : category?.color }}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: isOverBudget ? '#FF5733' : isNearLimit ? '#FFD700' : category?.color
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-white/70">${spent.toLocaleString()}</span>
                        <span className="text-white/70">${(budget.monthlyLimit || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                      <div className="text-white/60 text-xs mb-1">Remaining</div>
                      <div className={`font-bold text-base md:text-lg ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                        {isOverBudget ? '-' : ''}${Math.abs(remaining).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => {
                          setEditingBudget(budget);
                          setShowBudgetManager(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm(`Delete ${category?.label} budget?`)) {
                            deleteBudgetMutation.mutate(budget.id);
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="border-red-500/40 text-red-400 hover:bg-red-500/20 text-xs"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === "savings" && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">Savings Goals</h2>
            <Button
              onClick={() => {
                setEditingGoal(null);
                setShowSavingsGoalForm(true);
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold w-full sm:w-auto"
            >
              <Plus className="w-4 md:w-5 h-4 md:h-5 mr-2" />
              New Goal
            </Button>
          </div>

          {savingsGoals.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-white/5 border border-white/10 rounded-2xl px-4">
              <Target className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Set Savings Goals</h3>
              <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                Create goals for emergency funds, vacations, or major purchases
              </p>
              <Button
                onClick={() => setShowSavingsGoalForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
              >
                Create First Goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savingsGoals.map(goal => (
                <SavingsGoalCard
                  key={goal.id}
                  goal={goal}
                  onAddContribution={(goalId, amount) =>
                    addContributionMutation.mutate({ goalId, amount })
                  }
                  onEdit={(goal) => {
                    setEditingGoal(goal);
                    setShowSavingsGoalForm(true);
                  }}
                  onDelete={(goalId) => deleteSavingsGoalMutation.mutate(goalId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showExpenseLogger && (
        <ExpenseLogger
          onClose={() => {
            setShowExpenseLogger(false);
            setEditingExpense(null); // Keep this for reset after close
          }}
          onSave={(data) => saveExpenseMutation.mutateAsync(data)}
          initialExpense={editingExpense}
        />
      )}

      {showBudgetManager && (
        <BudgetManager
          onClose={() => {
            setShowBudgetManager(false);
            setEditingBudget(null); // Keep this for reset after close
          }}
          onSave={(data) => saveBudgetMutation.mutateAsync(data)}
          initialBudget={editingBudget}
        />
      )}

      {showSavingsGoalForm && (
        <SavingsGoalForm
          onClose={() => {
            setShowSavingsGoalForm(false);
            setEditingGoal(null); // Keep this for reset after close
          }}
          onSave={(data) => saveSavingsGoalMutation.mutateAsync(data)}
          initialGoal={editingGoal}
        />
      )}

      {/* NEW: Detail Modals */}
      {selectedLog && detailModalType === 'expense' && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#FF5733" // Adjusted to match expense color scheme (red/orange)
          icon={Receipt}
          title="Expense Details"
          fields={[
            {
              key: 'amount',
              label: 'Amount',
              icon: DollarSign,
              color: "#FF5733", // Adjusted to match expense color scheme (red/orange)
              render: (value) => <div className="text-3xl font-bold text-red-400">-${(value || 0).toLocaleString()}</div> // Ensure formatting and negative sign
            },
            {
              key: 'category',
              label: 'Category',
              icon: Target,
              color: "#FFD700",
              render: (value) => {
                const cat = CATEGORIES.find(c => c.value === value);
                return <span className="text-lg text-white/90">{cat?.emoji || ''} {cat?.label || value}</span>;
              }
            },
            { key: 'description', label: 'Description', icon: Receipt, color: "#4CC9F0" },
            { key: 'paymentMethod', label: 'Payment Method', icon: CreditCard, color: "#7C3AED" },
            {
              key: 'isRecurring',
              label: 'Recurring',
              icon: Calendar,
              color: "#FF69B4",
              render: (value) => <span className="text-white/90">{value ? '🔄 Yes' : '❌ No'}</span>
            }
          ]}
        />
      )}

      {selectedLog && detailModalType === 'savings' && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => {
            setSelectedLog(null);
            setDetailModalType(null);
          }}
          color="#52B788" // Adjusted to match savings color scheme (green)
          icon={PiggyBank}
          title={selectedLog.goalName}
          fields={[
            {
              key: 'currentAmount',
              label: 'Current Progress',
              icon: PiggyBank,
              color: "#52B788",
              render: (value) => (
                <div>
                  <div className="text-3xl font-bold text-green-400 mb-1">${(value || 0).toLocaleString()}</div> {/* Ensure formatting */}
                  <div className="text-white/60 text-sm">of ${(selectedLog.targetAmount || 0).toLocaleString()} target</div> {/* Ensure formatting */}
                  <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{ width: `${Math.round(((value || 0) / (selectedLog.targetAmount || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            },
            {
              key: 'category',
              label: 'Category',
              icon: Target,
              color: "#FFD700",
              render: (value) => { // Keep detailed render for category
                const cat = CATEGORIES.find(c => c.value === value);
                return <span className="text-lg text-white/90">{cat?.emoji || ''} {cat?.label || value}</span>;
              }
            },
            {
              key: 'targetDate',
              label: 'Target Date',
              icon: Calendar,
              color: "#4CC9F0",
              render: (value) => value ? format(new Date(value), 'MMMM d, yyyy') : null
            },
            { key: 'monthlyContribution', label: 'Recommended Monthly', icon: DollarSign, color: "#7C3AED", render: (value) => value ? `$${(value || 0).toLocaleString()}` : null }, // Ensure formatting
            { key: 'priority', label: 'Priority', icon: AlertCircle, color: "#FF5733" } // Correct icon to AlertCircle
          ]}
        />
      )}
    </PillarPage>
  );
}
