import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  Calculator,
  CreditCard,
  DollarSign,
  PiggyBank,
  ScanLine,
  Sparkles,
} from "lucide-react";
import PillarScaffold from "./components/PillarScaffold";
import { themeTokens } from "@/components/ThemeProvider";

const history = [
  { month: "Jan", score: 64, spend: 2200 },
  { month: "Feb", score: 66, spend: 2100 },
  { month: "Mar", score: 68, spend: 2050 },
  { month: "Apr", score: 70, spend: 1980 },
];

const insights = [
  "Dining down 8% vs last month",
  "Subscriptions renew in 5 days",
  "Savings rate trending +2%",
];

export default function FinancePillarSpec() {
  const [stress, setStress] = useState(4);
  const [goal, setGoal] = useState("10000");
  const [months, setMonths] = useState("12");
  const [projection, setProjection] = useState("Simulate to see plan");
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetItems, setBudgetItems] = useState([]);

  const suggestedSave = useMemo(() => {
    const goalNum = Number(goal) || 0;
    const monthsNum = Number(months) || 1;
    return monthsNum > 0 ? Math.max(goalNum / monthsNum, 0).toFixed(2) : "0.00";
  }, [goal, months]);

  const sections = [
    {
      kicker: "Tracking",
      title: "Finance score history",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[60, 75]} />
                <Tooltip labelClassName="text-slate-900" />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#f97316"
                  fill="rgba(249,115,22,0.16)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip labelClassName="text-slate-900" />
                <Bar dataKey="spend" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
    {
      kicker: "Stress",
      title: "Financial stress slider",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <p className="text-sm text-white/80">
            How stressed about finances this week?
          </p>
          <input
            type="range"
            min="1"
            max="10"
            value={stress}
            onChange={(e) => setStress(Number(e.target.value))}
            className="w-full accent-ns-gold"
          />
          <p className="text-xs text-white/60">
            Stress: {stress}/10 · Used for AI reprioritisation (mock only)
          </p>
        </div>
      ),
    },
    {
      kicker: "Summary",
      title: "Monthly financial summary",
      content: (
        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${themeTokens.panel} p-3`}>
            <p className="text-sm font-semibold text-white">Net cash flow</p>
            <p className="text-2xl font-bold text-emerald-300">+$420</p>
            <p className="text-xs text-white/60">after savings</p>
          </div>
          <div className={`${themeTokens.panel} p-3`}>
            <p className="text-sm font-semibold text-white">Savings rate</p>
            <p className="text-2xl font-bold text-white">18%</p>
            <p className="text-xs text-white/60">target 20%</p>
          </div>
          <div className={`${themeTokens.panel} p-3`}>
            <p className="text-sm font-semibold text-white">Spending pattern</p>
            <p className="text-sm text-white/70">
              Subscriptions + dining are top levers.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-white/60">
              {insights.map((i) => (
                <li key={i}>• {i}</li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    {
      kicker: "Planning",
      title: "Savings goal simulator",
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Goal</p>
            <input
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="$10,000"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            <input
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Months (e.g., 12)"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
            />
            <button
              className={themeTokens.buttonPrimary}
              onClick={() =>
                setProjection(
                  `Save ~$${suggestedSave} per month to reach $${
                    goal || "0"
                  } in ${months || "?"} months`
                )
              }
            >
              <Calculator className="mr-2 inline h-4 w-4" /> Simulate
            </button>
            <p className="text-xs text-white/60">{projection}</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Budget entry</p>
            <div className="flex gap-2">
              <input
                className="w-2/3 rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="Category"
                value={budgetCategory}
                onChange={(e) => setBudgetCategory(e.target.value)}
              />
              <input
                className="w-1/3 rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
                placeholder="$"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
            </div>
            <button
              className={themeTokens.buttonGhost}
              onClick={() => {
                if (!budgetCategory && !budgetAmount) return;
                setBudgetItems((prev) => [
                  ...prev,
                  {
                    category: budgetCategory || "Unlabeled",
                    amount: budgetAmount || "0",
                  },
                ]);
                setBudgetCategory("");
                setBudgetAmount("");
              }}
            >
              Add budget
            </button>
            {budgetItems.length > 0 && (
              <ul className="space-y-1 text-xs text-white/60">
                {budgetItems.map((item, idx) => (
                  <li key={`${item.category}-${idx}`}>
                    • {item.category}: ${item.amount}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-white/60">
              AI prioritises the biggest levers.
            </p>
          </div>
        </div>
      ),
    },
    {
      kicker: "AI",
      title: "Finance AI chat",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <div className="flex items-center gap-2 text-white">
            <PiggyBank className="h-4 w-4 text-amber-300" />
            <p className="font-semibold">Context ready</p>
          </div>
          <p className="text-sm text-white/70">
            Ask for spending trims, savings plans, or buffer strategies via the
            floating NorthStar button.
          </p>
        </div>
      ),
    },
  ];

  return (
    <PillarScaffold
      id="finances"
      title="Finances pillar"
      scoreLabel="Finance score"
      score="68"
      intent="Reduce stress, increase buffers, and make spending intentional"
      roadmapHint="Trim subscriptions, set buffer, automate savings"
      sections={sections}
    />
  );
}
