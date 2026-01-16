import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils/index.js";
import { MessageCircle, ArrowRight } from "lucide-react";

const PILLARS = [
  {
    id: "sleep",
    name: "Sleep",
    color: "#6B46C1",
    icon: "🌙",
    coach: "Dr. Luna",
    desc: "Sleep scientist & certified sleep coach",
  },
  {
    id: "diet",
    name: "Diet",
    color: "#52B788",
    icon: "🥗",
    coach: "Chef Nourish",
    desc: "Registered nutritionist & wellness expert",
  },
  {
    id: "exercise",
    name: "Exercise",
    color: "#FF5733",
    icon: "💪",
    coach: "Coach Phoenix",
    desc: "Certified personal trainer & exercise physiologist",
  },
  {
    id: "physical_health",
    name: "Physical Health",
    color: "#FF7F50",
    icon: "❤️",
    coach: "Dr. Vita",
    desc: "Health optimization specialist",
  },
  {
    id: "mental_health",
    name: "Mental Health",
    color: "#4CC9F0",
    icon: "🧠",
    coach: "Dr. Serenity",
    desc: "Licensed psychologist & mindfulness expert",
  },
  {
    id: "finances",
    name: "Finances",
    color: "#2E8B57",
    icon: "💰",
    coach: "Advisor Prosper",
    desc: "Financial planning & wealth management",
  },
  {
    id: "social",
    name: "Social",
    color: "#FFD700",
    icon: "👥",
    coach: "Coach Connect",
    desc: "Relationship & communication expert",
  },
  {
    id: "spirituality",
    name: "Spirituality",
    color: "#7C3AED",
    icon: "✨",
    coach: "Guide Zenith",
    desc: "Spiritual guidance & purpose discovery",
  },
];

export default function CoachSelect() {
  return (
    <div className="min-h-screen pb-24 px-6 pt-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Your Soldiers
          </h1>
          <p className="text-white/70">
            Select a soldier to start your conversation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {PILLARS.map((pillar) => (
            <Link
              key={pillar.id}
              to={createPageUrl("Coach") + `?pillar=${pillar.id}`}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-200 hover:-translate-y-1 group"
              style={{ boxShadow: `0 0 20px ${pillar.color}40` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-4xl flex-shrink-0"
                  style={{
                    backgroundColor: `${pillar.color}30`,
                    boxShadow: `0 0 20px ${pillar.color}40`,
                  }}
                >
                  {pillar.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-bold text-white">
                      {pillar.coach}
                    </h3>
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="text-white/80 font-bold mb-1">
                    {pillar.name} Soldier
                  </div>
                  <div className="text-white/60 text-sm">{pillar.desc}</div>
                  <div className="flex items-center gap-2 mt-3">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">
                      Online • Ready to help
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
