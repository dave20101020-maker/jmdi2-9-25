import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Apple,
  Droplets,
  FlaskConical,
  Hash,
  ScanBarcode,
  Sparkles,
  Utensils,
} from "lucide-react";
import PillarScaffold from "./components/PillarScaffold";
import { themeTokens } from "@/components/ThemeProvider";

const history = [
  { day: "Mon", score: 70 },
  { day: "Tue", score: 72 },
  { day: "Wed", score: 68 },
  { day: "Thu", score: 74 },
  { day: "Fri", score: 71 },
  { day: "Sat", score: 75 },
  { day: "Sun", score: 73 },
];

const macros = [
  { name: "Protein", value: 32, color: "#22c55e" },
  { name: "Carbs", value: 44, color: "#fbbf24" },
  { name: "Fats", value: 24, color: "#38bdf8" },
];

const recipes = [
  "Overnight oats + berries",
  "Sheet-pan veggies & tofu",
  "Hydration booster: citrus water",
  "Protein lunch wrap",
];

export default function DietPillarSpec() {
  const [waterMl, setWaterMl] = useState(0);
  const [scannerStatus, setScannerStatus] = useState("Idle");
  const [balanceScore, setBalanceScore] = useState(7);

  const sections = [
    {
      kicker: "Tracking",
      title: "Diet score history",
      content: (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[65, 80]} />
                <Tooltip labelClassName="text-slate-900" />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#fbbf24"
                  fill="rgba(251,191,36,0.18)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-white/70">Macros & hydration</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macros}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                  >
                    {macros.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/70">
              <span className="rounded-full bg-white/10 px-2 py-1">
                Hydration: 2.6L
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1">
                Fiber: 28g
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1">
                Satiety good
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      kicker: "Logging",
      title: "Quick intake & scanner",
      content: (
        <div className="grid gap-3 md:grid-cols-3">
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              Barcode scanner (mock)
            </p>
            <p className="text-sm text-white/70">
              Use camera to scan packaged foods. Placeholder for integration.
            </p>
            <button
              className={themeTokens.buttonPrimary}
              onClick={() => setScannerStatus("Scanned sample item")}
            >
              <ScanBarcode className="mr-2 inline h-4 w-4" /> Scan item
            </button>
            <p className="text-xs text-white/60">Status: {scannerStatus}</p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">Water intake</p>
            <div className="flex flex-wrap gap-2">
              {[250, 500, 750].map((ml) => (
                <button
                  key={ml}
                  className="rounded-full bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                  onClick={() => setWaterMl((prev) => prev + ml)}
                >
                  +{ml}ml
                </button>
              ))}
            </div>
            <p className="text-xs text-white/60">
              Logged today: {waterMl}ml · Goal: 3000ml
            </p>
          </div>
          <div className={`${themeTokens.panel} p-3 space-y-2`}>
            <p className="text-sm font-semibold text-white">
              Nutritional assessment
            </p>
            <label className="text-xs text-white/60">
              How balanced was today?
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={balanceScore}
              onChange={(e) => setBalanceScore(Number(e.target.value))}
              className="w-full accent-ns-gold"
            />
            <p className="text-xs text-white/60">Balance: {balanceScore}/10</p>
            <textarea
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white"
              placeholder="Notes about meals, cravings, or hydration"
            />
          </div>
        </div>
      ),
    },
    {
      kicker: "AI",
      title: "Diet AI chat",
      content: (
        <div className={`${themeTokens.panel} p-3 space-y-2`}>
          <div className="flex items-center gap-2 text-white">
            <Apple className="h-4 w-4 text-emerald-300" />
            <p className="font-semibold">Context ready</p>
          </div>
          <p className="text-sm text-white/70">
            Ask for swaps, hydration boosts, or prep ideas. Floating NorthStar
            button routes context.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            <span className="rounded-full bg-white/10 px-2 py-1">Prep</span>
            <span className="rounded-full bg-white/10 px-2 py-1">
              Hydration
            </span>
            <span className="rounded-full bg-white/10 px-2 py-1">Macros</span>
          </div>
        </div>
      ),
    },
    {
      kicker: "Library",
      title: "Recipes & meal activity",
      content: (
        <div className="grid gap-2 sm:grid-cols-2">
          {recipes.map((item) => (
            <div
              key={item}
              className={`${themeTokens.panel} p-3 text-sm text-white/80 flex items-start gap-2`}
            >
              <Utensils className="h-4 w-4 text-ns-gold mt-1" />
              <div>
                <p className="font-semibold text-white">{item}</p>
                <p className="text-xs text-white/60">
                  Quick, repeatable, nutrient balanced.
                </p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <PillarScaffold
      id="diet"
      title="Diet pillar"
      scoreLabel="Diet score"
      score="72"
      intent="Steady energy through balanced nutrition & hydration"
      roadmapHint="Prep 2 meals, hydrate to 3L, add evening protein"
      sections={sections}
      aiNote="Diet insights use mock data; barcode scanner is a placeholder trigger."
    />
  );
}
