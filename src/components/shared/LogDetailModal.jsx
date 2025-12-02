import React from "react";
import { motion } from "framer-motion";
import { X, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function LogDetailModal({ 
  log, 
  onClose, 
  color = "#D4AF37",
  icon: Icon,
  title,
  fields = []
}) {
  if (!log) return null;

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-5 flex items-center justify-between z-10">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {Icon && (
              <motion.div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ 
                  backgroundColor: `${color}20`,
                  border: `1px solid ${color}40`
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring" }}
              >
                <Icon className="w-6 h-6" style={{ color }} />
              </motion.div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              {(log.date || log.timestamp) && (
                <div className="text-white/60 text-sm flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(log.date || log.timestamp), 'EEEE, MMMM d, yyyy')}
                  {log.timestamp && ` at ${format(new Date(log.timestamp), 'h:mm a')}`}
                </div>
              )}
            </div>
          </motion.div>
          <motion.button 
            onClick={onClose} 
            className="text-white/60 hover:text-white transition-colors rounded-lg p-2"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Content */}
        <motion.div 
          className="p-5 space-y-4"
          variants={contentVariants}
          initial="hidden"
          animate="visible"
        >
          {fields.map((field, idx) => {
            const value = field.getValue ? field.getValue(log) : log[field.key];
            
            if (!value || (Array.isArray(value) && value.length === 0)) {
              return null;
            }

            return (
              <motion.div 
                key={field.key || idx}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
                variants={itemVariants}
              >
                <div className="flex items-center gap-2 mb-2">
                  {field.icon && (
                    <field.icon className="w-4 h-4" style={{ color: field.color || color }} />
                  )}
                  <h3 className="text-white font-bold text-sm">{field.label}</h3>
                </div>

                {field.render ? (
                  field.render(value, log)
                ) : Array.isArray(value) ? (
                  <ul className="space-y-1">
                    {value.map((item, i) => (
                      <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                        <span style={{ color: field.color || color }}>•</span>
                        <span>{typeof item === 'object' ? item.text || JSON.stringify(item) : item}</span>
                      </li>
                    ))}
                  </ul>
                ) : typeof value === 'number' ? (
                  <div className="text-2xl font-bold" style={{ color: field.color || color }}>
                    {value}{field.unit || ''}
                  </div>
                ) : (
                  <p className="text-white/80 text-sm whitespace-pre-line">{value}</p>
                )}
              </motion.div>
            );
          })}

          {/* Tags if present */}
          {log.tags && log.tags.length > 0 && (
            <motion.div 
              className="bg-white/5 border border-white/10 rounded-xl p-4"
              variants={itemVariants}
            >
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-white/60" />
                <h3 className="text-white font-bold text-sm">Tags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {log.tags.map((tag, i) => (
                  <span 
                    key={i}
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: `${color}20`,
                      color: color,
                      border: `1px solid ${color}30`
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Notes if present */}
          {log.notes && (
            <motion.div 
              className="bg-white/5 border border-white/10 rounded-xl p-4"
              variants={itemVariants}
            >
              <h3 className="text-white font-bold text-sm mb-2">Notes</h3>
              <p className="text-white/80 text-sm whitespace-pre-line">{log.notes}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="sticky bottom-0 bg-[#1a1f35] border-t border-white/10 p-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onClose}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold"
            >
              Close
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}