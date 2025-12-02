import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

export default function RecentActivity({ 
  activities = [], 
  color = "#D4AF37",
  onItemClick,
  emptyMessage = "No recent activity yet",
  emptyIcon: EmptyIcon,
  emptyAction
}) {
  if (activities.length === 0) {
    return (
      <motion.div 
        className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {EmptyIcon && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <EmptyIcon className="w-12 h-12 mx-auto mb-3 text-white/40" />
          </motion.div>
        )}
        <p className="text-white/60 text-sm mb-4">{emptyMessage}</p>
        {emptyAction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {emptyAction}
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5"
      style={{ 
        boxShadow: `0 0 25px ${color}15`,
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center gap-2 mb-4"
        variants={itemVariants}
      >
        <Clock className="w-5 h-5" style={{ color }} />
        <h3 className="text-white font-bold text-lg">Recent Activity</h3>
        <span className="text-white/60 text-sm ml-auto">Last {activities.length}</span>
      </motion.div>

      <motion.div 
        className="space-y-2"
        variants={containerVariants}
      >
        <AnimatePresence mode="popLayout">
          {activities.map((activity, idx) => {
            const Icon = activity.icon;
            const timestamp = activity.date || activity.timestamp;
            const timeAgo = timestamp 
              ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
              : "Unknown";

            return (
              <motion.button
                key={activity.id || idx}
                onClick={() => onItemClick?.(activity)}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all text-left group"
                variants={itemVariants}
                whileHover={{ x: 5, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <motion.div 
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${activity.color || color}20`,
                      border: `1px solid ${activity.color || color}40`
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Icon className="w-5 h-5" style={{ color: activity.color || color }} />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-white font-semibold text-sm truncate">
                        {activity.title}
                      </h4>
                      <span className="text-white/40 text-xs whitespace-nowrap flex-shrink-0">
                        {timeAgo}
                      </span>
                    </div>
                    
                    <p className="text-white/70 text-sm line-clamp-2 mb-2">
                      {activity.summary}
                    </p>

                    {/* Badges/Tags */}
                    {activity.badges && activity.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {activity.badges.slice(0, 3).map((badge, badgeIdx) => (
                          <span 
                            key={badgeIdx}
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${badge.color || color}20`,
                              color: badge.color || color,
                              border: `1px solid ${badge.color || color}30`
                            }}
                          >
                            {badge.text}
                          </span>
                        ))}
                        {activity.badges.length > 3 && (
                          <span className="text-white/40 text-xs">+{activity.badges.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <motion.div
                    className="flex-shrink-0 text-white/40 group-hover:text-white/80"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5,
                      repeatDelay: 1
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* View All (optional) */}
      {activities.length >= 5 && (
        <motion.button
          className="w-full mt-3 text-center text-sm font-medium py-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color }}
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          View all activity →
        </motion.button>
      )}
    </motion.div>
  );
}