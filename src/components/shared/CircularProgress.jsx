import React from "react";
import { motion } from "framer-motion";

export default function CircularProgress({ 
  value = 0, 
  max = 100, 
  size = 120, 
  strokeWidth = 8,
  color = "#D4AF37",
  label,
  subtitle,
  showPercentage = true,
  icon,
  glowEffect = true
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glow effect */}
      {glowEffect && (
        <motion.div 
          className="absolute inset-0 rounded-full blur-xl opacity-30"
          style={{ backgroundColor: color }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{
            type: "spring",
            stiffness: 50,
            damping: 20,
            mass: 1
          }}
          style={{
            filter: `drop-shadow(0 0 8px ${color}80)`
          }}
        />

        {/* Inner glow ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius - strokeWidth / 2}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.2}
          strokeDasharray="4 4"
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon && (
          <motion.div
            className="mb-1"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {React.cloneElement(icon, {
              className: "w-6 h-6",
              style: { color }
            })}
          </motion.div>
        )}
        
        <motion.div 
          className="text-2xl font-bold text-white"
          key={value}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {showPercentage ? `${Math.round(percentage)}%` : value}
        </motion.div>
        
        {label && (
          <div className="text-xs text-white/60 text-center px-2">{label}</div>
        )}
      </div>

      {/* Subtitle below */}
      {subtitle && (
        <motion.div 
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/60 whitespace-nowrap"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {subtitle}
        </motion.div>
      )}
    </div>
  );
}