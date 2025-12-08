import React from "react";
import { cn } from "@/utils";

/**
 * PillarScoreBar - Visual progress bar for pillar scores
 * @param {number} score - Score value (0-100)
 * @param {string} pillarName - Name of the pillar
 * @param {string} color - Hex color for the bar
 * @param {string} icon - Emoji or icon
 * @param {boolean} showLabel - Show score label
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} animated - Enable animation
 * @param {function} onClick - Click handler
 */
export const PillarScoreBar = ({
  score = 0,
  pillarName,
  color = "#4CC9F0",
  icon,
  showLabel = true,
  size = "md",
  animated = true,
  onClick,
  className,
}) => {
  // Normalize score to 0-100
  const normalizedScore = Math.max(0, Math.min(100, score));

  // Determine score category for styling
  const getScoreCategory = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "fair";
    if (score >= 20) return "poor";
    return "critical";
  };

  const category = getScoreCategory(normalizedScore);

  // Size variants
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Category colors (fallback if no custom color)
  const categoryColors = {
    excellent: "#06D6A0",
    good: "#4CC9F0",
    fair: "#FFD60A",
    poor: "#FF6B35",
    critical: "#EF476F",
  };

  const barColor = color || categoryColors[category];

  return (
    <div
      className={cn(
        "w-full",
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      {(pillarName || showLabel) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon && <span className="text-lg">{icon}</span>}
            {pillarName && (
              <span
                className={cn(
                  "font-medium text-gray-800 dark:text-gray-100",
                  labelSizeClasses[size]
                )}
              >
                {pillarName}
              </span>
            )}
          </div>
          {showLabel && (
            <span
              className={cn(
                "font-semibold tabular-nums",
                labelSizeClasses[size]
              )}
              style={{ color: barColor }}
            >
              {Math.round(normalizedScore)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div
        className={cn(
          "w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden",
          sizeClasses[size]
        )}
      >
        {/* Progress Bar Fill */}
        <div
          className={cn(
            "h-full rounded-full transition-all",
            animated && "duration-500 ease-out"
          )}
          style={{
            width: `${normalizedScore}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      {/* Optional Score Text Below Bar */}
      {size === "lg" && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {category === "excellent" && "🎉 Excellent!"}
          {category === "good" && "✨ Great progress!"}
          {category === "fair" && "📈 Keep going!"}
          {category === "poor" && "💪 Room to improve"}
          {category === "critical" && "🔧 Needs attention"}
        </div>
      )}
    </div>
  );
};

export default PillarScoreBar;
