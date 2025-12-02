import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dumbbell, Zap, TrendingUp, Activity, Flame, Clock, Target, ChevronRight } from "lucide-react";

const PRESET_TEMPLATES = [
  {
    id: "beginner_strength",
    name: "Beginner Full Body",
    difficulty: "beginner",
    duration: 30,
    category: "strength",
    description: "Perfect for starting your strength journey",
    exercises: [
      { name: "Bodyweight Squats", sets: 3, reps: 12, rest: 60, notes: "Focus on form" },
      { name: "Push-ups (knees ok)", sets: 3, reps: 10, rest: 60, notes: "Keep core tight" },
      { name: "Dumbbell Rows", sets: 3, reps: 12, rest: 60, notes: "Light weight to start" },
      { name: "Plank", sets: 3, duration: 30, rest: 60, notes: "Hold steady" },
      { name: "Glute Bridges", sets: 3, reps: 15, rest: 60, notes: "Squeeze at top" }
    ]
  },
  {
    id: "intermediate_strength",
    name: "Intermediate Upper Body",
    difficulty: "intermediate",
    duration: 45,
    category: "strength",
    description: "Build strength and muscle definition",
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: 10, rest: 90, notes: "Progressive overload" },
      { name: "Pull-ups", sets: 3, reps: 8, rest: 90, notes: "Assisted if needed" },
      { name: "Overhead Press", sets: 4, reps: 10, rest: 90, notes: "Control the weight" },
      { name: "Dumbbell Curls", sets: 3, reps: 12, rest: 60, notes: "No swinging" },
      { name: "Tricep Dips", sets: 3, reps: 12, rest: 60, notes: "Full range of motion" }
    ]
  },
  {
    id: "advanced_strength",
    name: "Advanced Push Day",
    difficulty: "advanced",
    duration: 60,
    category: "strength",
    description: "High-volume push workout for serious lifters",
    exercises: [
      { name: "Barbell Bench Press", sets: 5, reps: 5, rest: 180, notes: "Heavy weight, perfect form" },
      { name: "Incline Dumbbell Press", sets: 4, reps: 8, rest: 120, notes: "Chest focus" },
      { name: "Dips", sets: 4, reps: 12, rest: 90, notes: "Add weight if possible" },
      { name: "Overhead Press", sets: 4, reps: 8, rest: 120, notes: "Strict press" },
      { name: "Lateral Raises", sets: 4, reps: 15, rest: 60, notes: "Burn out set" },
      { name: "Tricep Pushdowns", sets: 4, reps: 15, rest: 60, notes: "Constant tension" }
    ]
  },
  {
    id: "beginner_cardio",
    name: "Beginner Cardio",
    difficulty: "beginner",
    duration: 20,
    category: "cardio",
    description: "Easy cardio to build endurance",
    exercises: [
      { name: "Brisk Walking", duration: 15, notes: "Maintain steady pace" },
      { name: "Marching in Place", duration: 3, notes: "Active recovery" },
      { name: "Light Jogging", duration: 2, notes: "If comfortable" }
    ]
  },
  {
    id: "intermediate_hiit",
    name: "HIIT Blast",
    difficulty: "intermediate",
    duration: 25,
    category: "hiit",
    description: "High-intensity interval training",
    exercises: [
      { name: "Burpees", sets: 4, reps: 10, rest: 30, notes: "Full extension" },
      { name: "Mountain Climbers", sets: 4, duration: 30, rest: 30, notes: "Fast pace" },
      { name: "Jump Squats", sets: 4, reps: 15, rest: 30, notes: "Explosive" },
      { name: "High Knees", sets: 4, duration: 30, rest: 30, notes: "Max effort" },
      { name: "Plank Jacks", sets: 4, reps: 20, rest: 30, notes: "Keep hips level" }
    ]
  },
  {
    id: "beginner_yoga",
    name: "Morning Yoga Flow",
    difficulty: "beginner",
    duration: 20,
    category: "yoga",
    description: "Gentle flow to start your day",
    exercises: [
      { name: "Cat-Cow Stretch", sets: 1, duration: 120, notes: "Breathe with movement" },
      { name: "Downward Dog", sets: 1, duration: 60, notes: "Pedal feet" },
      { name: "Warrior I", sets: 2, duration: 30, notes: "Each side" },
      { name: "Child's Pose", sets: 1, duration: 60, notes: "Rest and breathe" },
      { name: "Seated Forward Fold", sets: 1, duration: 60, notes: "Relax into it" }
    ]
  }
];

export default function WorkoutTemplates({ onSelectTemplate, userLevel = "beginner" }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState(userLevel);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredTemplates = PRESET_TEMPLATES.filter(template => {
    const difficultyMatch = selectedDifficulty === "all" || template.difficulty === selectedDifficulty;
    const categoryMatch = selectedCategory === "all" || template.category === selectedCategory;
    return difficultyMatch && categoryMatch;
  });

  const difficulties = [
    { value: "all", label: "All Levels", color: "#D4AF37" },
    { value: "beginner", label: "Beginner", color: "#52B788" },
    { value: "intermediate", label: "Intermediate", color: "#FFD700" },
    { value: "advanced", label: "Advanced", color: "#FF5733" }
  ];

  const categories = [
    { value: "all", label: "All Types" },
    { value: "strength", label: "Strength" },
    { value: "cardio", label: "Cardio" },
    { value: "hiit", label: "HIIT" },
    { value: "yoga", label: "Yoga" },
    { value: "flexibility", label: "Flexibility" }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-3">
        <div>
          <label className="text-white/70 text-sm mb-2 block">Difficulty</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {difficulties.map(diff => (
              <button
                key={diff.value}
                onClick={() => setSelectedDifficulty(diff.value)}
                className={`py-2 px-3 rounded-lg font-bold transition-all text-sm ${
                  selectedDifficulty === diff.value
                    ? 'text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
                style={selectedDifficulty === diff.value ? { 
                  backgroundColor: `${diff.color}40`,
                  borderColor: diff.color,
                  color: diff.color
                } : {}}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white/70 text-sm mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`py-2 px-4 rounded-lg font-bold transition-all text-sm ${
                  selectedCategory === cat.value
                    ? 'bg-[#FF5733] text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredTemplates.map(template => {
          const difficultyColor = template.difficulty === 'beginner' ? '#52B788' :
                                 template.difficulty === 'intermediate' ? '#FFD700' : '#FF5733';

          return (
            <div
              key={template.id}
              className="bg-[#1a1f35] border border-white/20 rounded-2xl p-5 hover:bg-white/5 transition-all cursor-pointer group"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1 group-hover:text-[#FF5733] transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-white/60 text-sm mb-2">{template.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="px-2 py-1 rounded-full font-bold"
                      style={{ backgroundColor: `${difficultyColor}20`, color: difficultyColor }}
                    >
                      {template.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-white/10 text-white/70 rounded-full capitalize">
                      {template.category}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-[#FF5733] group-hover:translate-x-1 transition-all" />
              </div>

              <div className="flex items-center gap-4 text-sm text-white/60 pt-3 border-t border-white/10">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{template.duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>{template.exercises.length} exercises</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/60">No templates match your filters</p>
        </div>
      )}
    </div>
  );
}

export { PRESET_TEMPLATES };