import { api } from "@/utils/apiClient";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, Coffee, Utensils, Moon as Dinner, Cookie, CheckCircle2, Camera, Sparkles } from "lucide-react";
import { toast } from "sonner";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", icon: Coffee, emoji: "🍳" },
  { value: "lunch", label: "Lunch", icon: Utensils, emoji: "🍱" },
  { value: "dinner", label: "Dinner", icon: Dinner, emoji: "🍽️" },
  { value: "snack", label: "Snack", icon: Cookie, emoji: "🍿" }
];

const QUALITY_OPTIONS = [
  { value: "healthy", label: "Healthy", color: "#52B788", emoji: "✅", description: "Nutritious, balanced" },
  { value: "moderate", label: "Moderate", color: "#FFD700", emoji: "👍", description: "Could be better" },
  { value: "unhealthy", label: "Unhealthy", color: "#FF5733", emoji: "⚠️", description: "Not ideal" }
];

const PORTION_SIZES = [
  { value: "small", label: "Small", emoji: "🔸" },
  { value: "medium", label: "Medium", emoji: "🔶" },
  { value: "large", label: "Large", emoji: "🔷" }
];

export default function MealLogger({ onClose, onSave, initialMeal = null }) {
  const [meal, setMeal] = useState(initialMeal || {
    mealType: "lunch",
    quality: "healthy",
    description: "",
    portionSize: "medium",
    ingredients: [],
    satisfactionLevel: 7
  });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [ingredientInput, setIngredientInput] = useState("");
  const [nutritionInfo, setNutritionInfo] = useState(null);

  const handleSave = async () => {
    if (!meal.description.trim()) {
      toast.error('Please describe what you ate');
      return;
    }

    setSaving(true);
    try {
      await onSave({ ...meal, nutritionInfo });
      toast.success('Meal logged! 🍽️');
    } catch (error) {
      toast.error('Failed to save meal');
      setSaving(false);
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setMeal({
        ...meal,
        ingredients: [...(meal.ingredients || []), ingredientInput.trim()]
      });
      setIngredientInput("");
    }
  };

  const removeIngredient = (index) => {
    setMeal({
      ...meal,
      ingredients: meal.ingredients.filter((_, i) => i !== index)
    });
  };

  const analyzeNutrition = async () => {
    if (!meal.description.trim() && meal.ingredients.length === 0) {
      toast.error('Add meal description or ingredients first');
      return;
    }

    setAnalyzing(true);
    try {
      const prompt = `Analyze the nutritional content of this meal and provide basic information:

Meal: ${meal.description}
Ingredients: ${meal.ingredients.join(', ') || 'not specified'}
Portion: ${meal.portionSize}

Provide estimated:
1. Calories (range)
2. Protein content (high/medium/low)
3. Healthy aspects (2-3 points)
4. Potential concerns (1-2 points)
5. Overall nutrition rating (1-10)

Return ONLY valid JSON:
{
  "calories": "estimated range as string",
  "protein": "high/medium/low",
  "healthyAspects": ["aspect 1", "aspect 2"],
  "concerns": ["concern 1"],
  "rating": 7
}`;

      const result = await api.aiCoach({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            calories: { type: "string" },
            protein: { type: "string" },
            healthyAspects: {
              type: "array",
              items: { type: "string" }
            },
            concerns: {
              type: "array",
              items: { type: "string" }
            },
            rating: { type: "number" }
          }
        }
      });

      setNutritionInfo(result);
      setAnalyzing(false);
      toast.success('Nutrition analyzed! 🥗');
    } catch (error) {
      console.error('Error analyzing nutrition:', error);
      setAnalyzing(false);
      toast.error('Failed to analyze nutrition');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-7 h-7 text-[#52B788]" />
            Log Meal
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meal Type */}
          <div>
            <Label className="text-white mb-3 block">Meal Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MEAL_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setMeal({ ...meal, mealType: type.value })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      meal.mealType === type.value
                        ? 'bg-[#52B788]/20 border-[#52B788]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-3xl mb-1">{type.emoji}</div>
                    <div className="text-white text-sm font-medium">{type.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal Quality */}
          <div>
            <Label className="text-white mb-3 block">How healthy was it?</Label>
            <div className="grid grid-cols-3 gap-3">
              {QUALITY_OPTIONS.map(quality => (
                <button
                  key={quality.value}
                  onClick={() => setMeal({ ...meal, quality: quality.value })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    meal.quality === quality.value
                      ? 'border-2 scale-105'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={meal.quality === quality.value ? { 
                    backgroundColor: `${quality.color}20`,
                    borderColor: quality.color
                  } : {}}
                >
                  <div className="text-3xl mb-1">{quality.emoji}</div>
                  <div className="text-white text-sm font-bold">{quality.label}</div>
                  <div className="text-white/60 text-xs">{quality.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Meal Description */}
          <div>
            <Label className="text-white mb-2 block">What did you eat? *</Label>
            <Textarea
              value={meal.description}
              onChange={(e) => setMeal({ ...meal, description: e.target.value })}
              placeholder="e.g., Grilled chicken salad with quinoa, avocado, and olive oil dressing"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              rows={3}
            />
          </div>

          {/* Portion Size */}
          <div>
            <Label className="text-white mb-3 block">Portion Size</Label>
            <div className="grid grid-cols-3 gap-3">
              {PORTION_SIZES.map(portion => (
                <button
                  key={portion.value}
                  onClick={() => setMeal({ ...meal, portionSize: portion.value })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    meal.portionSize === portion.value
                      ? 'bg-[#52B788]/20 border-[#52B788]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{portion.emoji}</div>
                  <div className="text-white text-sm">{portion.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients (Optional) */}
          <div>
            <Label className="text-white mb-2 block">Key Ingredients (Optional)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                placeholder="Add ingredient..."
                className="bg-white/10 border-white/20 text-white flex-1"
              />
              <Button
                onClick={addIngredient}
                size="sm"
                className="bg-[#52B788]/20 text-[#52B788] border border-[#52B788]/40"
              >
                Add
              </Button>
            </div>
            {meal.ingredients?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {meal.ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#52B788]/20 text-[#52B788] rounded-full text-sm flex items-center gap-2"
                  >
                    {ing}
                    <button onClick={() => removeIngredient(idx)} className="hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI Nutrition Scanner */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                AI Nutrition Analysis
              </h4>
              <Button
                onClick={analyzeNutrition}
                disabled={analyzing}
                size="sm"
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40"
              >
                {analyzing ? 'Analyzing...' : 'Scan Nutrition'}
              </Button>
            </div>

            {nutritionInfo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Calories</span>
                  <span className="text-white font-bold">{nutritionInfo.calories}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Protein</span>
                  <span className="text-white font-bold capitalize">{nutritionInfo.protein}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">Nutrition Score</span>
                  <span className="text-[#52B788] font-bold">{nutritionInfo.rating}/10</span>
                </div>

                {nutritionInfo.healthyAspects?.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="text-green-400 font-bold text-xs mb-2">✓ Healthy Aspects</div>
                    <ul className="space-y-1">
                      {nutritionInfo.healthyAspects.map((aspect, idx) => (
                        <li key={idx} className="text-white/80 text-xs flex items-start gap-2">
                          <span className="text-green-400">•</span>
                          <span>{aspect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {nutritionInfo.concerns?.length > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <div className="text-orange-400 font-bold text-xs mb-2">⚠ Considerations</div>
                    <ul className="space-y-1">
                      {nutritionInfo.concerns.map((concern, idx) => (
                        <li key={idx} className="text-white/80 text-xs flex items-start gap-2">
                          <span className="text-orange-400">•</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/60 text-sm text-center py-4">
                Add meal details and click "Scan Nutrition" for AI analysis
              </p>
            )}
          </div>

          {/* Satisfaction Level */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white">Satisfaction Level</Label>
              <span className="text-[#52B788] font-bold">{meal.satisfactionLevel}/10</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => setMeal({ ...meal, satisfactionLevel: num })}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm ${
                    meal.satisfactionLevel === num
                      ? 'bg-[#52B788] text-white scale-110'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-[#52B788] to-[#5ECA99] text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Meal'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}