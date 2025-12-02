import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { format, differenceInHours } from "date-fns";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

export default function PillarAtAGlance({ metrics, color = "#D4AF37" }) {
  if (!metrics || metrics.length === 0) return null;

  const getTrendIcon = (trend) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = (trend) => {
    if (trend === "up") return "#52B788";
    if (trend === "down") return "#FF5733";
    return "#FFD700";
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 mb-6"
      style={{ 
        boxShadow: `0 0 30px ${color}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center gap-2 mb-4"
        variants={itemVariants}
      >
        <div 
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}80`
          }}
        />
        <h3 className="text-white font-bold text-lg">At a Glance</h3>
      </motion.div>

      <motion.div 
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
        variants={containerVariants}
      >
        {metrics.map((metric, idx) => {
          const trendColor = metric.trend ? getTrendColor(metric.trend) : color;
          
          return (
            <motion.div
              key={idx}
              className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -3 }}
              style={{
                boxShadow: `0 0 15px ${color}10`
              }}
            >
              {/* Hover glow effect */}
              <div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"
                style={{ backgroundColor: `${color}15` }}
              />

              {/* Icon */}
              {metric.icon && (
                <motion.div 
                  className="mb-3"
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {React.cloneElement(metric.icon, {
                    className: "w-5 h-5",
                    style: { color: color }
                  })}
                </motion.div>
              )}

              {/* Label */}
              <div className="text-white/70 text-xs md:text-sm mb-2 flex items-center justify-between">
                <span>{metric.label}</span>
                {metric.trend && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 + idx * 0.1 }}
                  >
                    {getTrendIcon(metric.trend)}
                  </motion.div>
                )}
              </div>

              {/* Value */}
              <motion.div 
                className="text-2xl md:text-3xl font-bold mb-1 transition-all duration-200"
                style={{ color: trendColor }}
                key={metric.value}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {metric.value}
              </motion.div>

              {/* Subtitle */}
              <div className="text-xs text-white/60">{metric.subtitle}</div>

              {/* Visual indicator (optional) */}
              {metric.chart && (
                <motion.div 
                  className="mt-3 h-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  {metric.chart}
                </motion.div>
              )}

              {/* Progress bar (optional) */}
              {metric.progress !== undefined && (
                <motion.div 
                  className="mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ 
                        background: `linear-gradient(to right, ${color}, ${color}CC)`,
                        boxShadow: `0 0 8px ${color}60`
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.progress}%` }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 20,
                        delay: 0.4 + idx * 0.1
                      }}
                    />
                  </div>
                  <div className="text-xs text-white/60 mt-1 text-right">{metric.progress}%</div>
                </motion.div>
              )}

              {/* Time indicator (optional) */}
              {metric.lastUpdated && (
                <motion.div 
                  className="mt-2 flex items-center gap-1 text-xs text-white/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <Clock className="w-3 h-3" />
                  {metric.lastUpdated}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Optional footer message */}
      {metrics.some(m => m.message) && (
        <motion.div 
          className="mt-4 pt-4 border-t border-white/10"
          variants={itemVariants}
        >
          {metrics.filter(m => m.message).map((metric, idx) => (
            <motion.p 
              key={idx}
              className="text-white/70 text-xs md:text-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
            >
              {metric.message}
            </motion.p>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}