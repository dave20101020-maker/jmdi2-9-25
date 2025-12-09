/**
 * Enhanced Agent Display Component
 *
 * Shows:
 * - Agent avatar and name
 * - Model used (GPT vs Claude with icons)
 * - Typing bubbles animation
 * - Persona introduction
 * - Cross-pillar impact warnings
 * - Message history with formatting
 *
 * Usage:
 *   <EnhancedAgentDisplay
 *     agent={{name: 'Dr. Luna', avatar: '🌙', pillar: 'sleep'}}
 *     isTyping={true}
 *     messages={[...]}
 *     modelInfo={{name: 'GPT-4', logo: '⚡'}}
 *   />
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Zap, Cpu } from "lucide-react";

const AGENT_CONFIG = {
  sleep: {
    name: "Dr. Luna",
    avatar: "🌙",
    color: "from-indigo-600 to-purple-600",
    introduction:
      "Hi! I'm Dr. Luna, your AI sleep specialist. Let's get you restorative sleep.",
  },
  fitness: {
    name: "Coach Atlas",
    avatar: "💪",
    color: "from-orange-500 to-red-500",
    introduction:
      "I'm Coach Atlas. Let's build strength, endurance, and vitality together!",
  },
  "mental-health": {
    name: "Dr. Serenity",
    avatar: "🧘",
    color: "from-green-500 to-emerald-600",
    introduction:
      "I'm Dr. Serenity. Your wellbeing matters. Let's explore what's on your mind.",
  },
  nutrition: {
    name: "Chef Nourish",
    avatar: "🥗",
    color: "from-yellow-500 to-amber-600",
    introduction:
      "I'm Chef Nourish. Nutrition is about nourishing, not restricting.",
  },
  finances: {
    name: "Adviser Prosper",
    avatar: "💰",
    color: "from-green-600 to-teal-600",
    introduction:
      "I'm Adviser Prosper. Let's build wealth and financial peace of mind.",
  },
  "physical-health": {
    name: "Dr. Vitality",
    avatar: "⚕️",
    color: "from-pink-500 to-red-600",
    introduction:
      "I'm Dr. Vitality. Your physical health is the foundation of everything.",
  },
  social: {
    name: "Coach Connect",
    avatar: "👥",
    color: "from-blue-500 to-cyan-600",
    introduction:
      "I'm Coach Connect. Connection enriches life. Let's build relationships.",
  },
  spirituality: {
    name: "Guide Zenith",
    avatar: "✨",
    color: "from-purple-600 to-pink-600",
    introduction:
      "I'm Guide Zenith. Let's explore meaning, purpose, and inner peace.",
  },
};

export default function EnhancedAgentDisplay({
  agent,
  isTyping = false,
  messages = [],
  modelInfo = null,
  impacts = [],
  onModelChange = null,
}) {
  const config = AGENT_CONFIG[agent?.pillar] || AGENT_CONFIG.sleep;
  const [displayedMessages, setDisplayedMessages] = useState(messages);

  useEffect(() => {
    setDisplayedMessages(messages);
  }, [messages]);

  return (
    <div className="space-y-4">
      {/* Agent Header */}
      <div
        className={`bg-gradient-to-r ${config.color} rounded-lg p-6 text-white shadow-lg`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{config.avatar}</div>
            <div>
              <h2 className="text-2xl font-bold">{config.name}</h2>
              <p className="text-white/80 text-sm">Pillar: {agent?.pillar}</p>
            </div>
          </div>

          {/* Model Indicator */}
          {modelInfo && (
            <div className="text-right">
              <div className="flex items-center gap-2 bg-white/20 rounded px-3 py-2">
                <span className="text-lg">{modelInfo.logo}</span>
                <div>
                  <p className="text-xs font-semibold uppercase">
                    {modelInfo.name}
                  </p>
                  <p className="text-xs opacity-75 max-w-xs">
                    {modelInfo.reason}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Persona Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded"
      >
        <p className="text-gray-800 italic">"{config.introduction}"</p>
      </motion.div>

      {/* Cross-Pillar Impact Warnings */}
      {impacts && impacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {impacts.map((impact, idx) => (
            <div
              key={idx}
              className={`flex gap-3 p-3 rounded-lg border-l-4 ${
                impact.level === "high"
                  ? "bg-red-50 border-red-500"
                  : "bg-yellow-50 border-yellow-500"
              }`}
            >
              <AlertCircle
                size={20}
                className={
                  impact.level === "high" ? "text-red-600" : "text-yellow-600"
                }
              />
              <div>
                <p
                  className={`font-semibold text-sm ${
                    impact.level === "high" ? "text-red-900" : "text-yellow-900"
                  }`}
                >
                  {impact.from.replace("-", " ")} Status: {impact.category}
                </p>
                <p className="text-xs text-gray-700 mt-1">{impact.impact}</p>
                {impact.adjustments?.recommendation && (
                  <p className="text-xs text-gray-600 mt-1 italic">
                    💡 {impact.adjustments.recommendation}
                  </p>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Message Area */}
      <div className="space-y-4 h-96 overflow-y-auto pr-2">
        <AnimatePresence mode="wait">
          {displayedMessages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.modelUsed && (
                  <p className="text-xs opacity-60 mt-1">{msg.modelUsed}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 items-center"
          >
            <div className="text-2xl">{config.avatar}</div>
            <div className="flex gap-1">
              {[0, 1, 2].map((idx) => (
                <motion.div
                  key={idx}
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: idx * 0.1,
                  }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {config.name} is thinking...
            </span>
          </motion.div>
        )}
      </div>

      {/* Agent Context Info (Collapsible) */}
      <details className="text-xs text-gray-600 border rounded p-2 bg-gray-50">
        <summary className="cursor-pointer font-semibold">
          Context & Habits
        </summary>
        <div className="mt-3 space-y-1 pl-4">
          <p>• Active habits for this pillar loaded</p>
          <p>• Recent screening results considered</p>
          <p>• Cross-pillar factors included</p>
          <p>• Streak consistency: tracked</p>
        </div>
      </details>
    </div>
  );
}

/**
 * Standalone typing bubble component
 */
export function TypingBubbles({ agentName, avatarEmoji = "🤖" }) {
  return (
    <motion.div className="flex gap-2 items-center">
      <span className="text-xl">{avatarEmoji}</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((idx) => (
          <motion.div
            key={idx}
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: idx * 0.1,
            }}
            className="w-2 h-2 bg-gray-400 rounded-full"
          />
        ))}
      </div>
      <span className="text-sm text-gray-500">{agentName} is thinking...</span>
    </motion.div>
  );
}

/**
 * Model indicator badge
 */
export function ModelBadge({ modelInfo }) {
  return (
    <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-xs">
      <span>{modelInfo?.logo || "🤖"}</span>
      <span className="font-semibold">{modelInfo?.name || "AI"}</span>
      <span className="text-gray-500">•</span>
      <span className="text-gray-600 max-w-xs truncate">
        {modelInfo?.reason}
      </span>
    </div>
  );
}
