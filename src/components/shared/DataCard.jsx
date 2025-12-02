import React from "react";

export default function DataCard({ 
  title, 
  titleIcon,
  children, 
  color = "#4CC9F0",
  className = "" 
}) {
  return (
    <div 
      className={`bg-[#1a1f35] border border-white/20 rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:shadow-xl group ${className}`}
      style={{ 
        boxShadow: `0 0 25px ${color}15`,
      }}
    >
      <h3 className="text-white font-bold mb-4 flex items-center gap-2 group-hover:scale-[1.02] transition-transform duration-200">
        {titleIcon && React.cloneElement(titleIcon, { 
          className: "w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
          style: { 
            color,
            filter: `drop-shadow(0 0 6px ${color}80)`
          }
        })}
        {title}
      </h3>
      
      {/* Animated border glow on hover */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-md"
        style={{ 
          background: `linear-gradient(135deg, ${color}20, transparent 50%, ${color}10)`,
        }}
      />
      
      {children}
    </div>
  );
}