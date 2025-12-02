import React, { useState } from "react";

export default function ActionCard({ 
  icon: Icon, 
  title, 
  description, 
  stats, 
  color, 
  onClick 
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className="bg-gradient-to-br border rounded-2xl p-6 transition-all text-left group relative overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-2 active:scale-95"
      style={{
        borderColor: `${color}40`,
        backgroundImage: `linear-gradient(to bottom right, ${color}20, ${color}05)`,
        boxShadow: isPressed 
          ? `0 0 15px ${color}40, inset 0 2px 4px rgba(0,0,0,0.3)`
          : `0 0 25px ${color}20`,
        transform: isPressed ? 'scale(0.98) translateY(2px)' : 'scale(1) translateY(0)'
      }}
    >
      {/* Animated gradient overlay on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ 
          background: `linear-gradient(135deg, ${color}30 0%, transparent 50%, ${color}20 100%)`,
          animation: 'shimmer 3s ease-in-out infinite'
        }}
      />
      
      {/* Subtle glow effect on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10"
        style={{ backgroundColor: `${color}30` }}
      />
      
      {/* Ripple effect container */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {isPressed && (
          <div 
            className="absolute inset-0 animate-ripple"
            style={{ 
              background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            }}
          />
        )}
      </div>
      
      <div className="relative z-10">
        <div className="relative mb-3">
          <Icon 
            className="w-8 h-8 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-active:scale-95" 
            style={{ 
              color,
              filter: `drop-shadow(0 0 8px ${color}80)`
            }}
          />
          {/* Icon glow pulse */}
          <div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 animate-ping"
            style={{ backgroundColor: color }}
          />
        </div>
        
        <h3 className="text-white font-bold mb-1 transition-colors duration-200 group-hover:text-white">
          {title}
        </h3>
        <p className="text-white/60 text-sm transition-colors duration-200 group-hover:text-white/80">
          {description}
        </p>
        {stats && (
          <div 
            className="text-xs mt-2 font-medium transition-all duration-200 group-hover:font-bold"
            style={{ color }}
          >
            {stats}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        @keyframes ripple {
          0% { 
            transform: scale(0);
            opacity: 1;
          }
          100% { 
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .animate-ripple {
          animation: ripple 0.6s ease-out;
        }
      `}</style>
    </button>
  );
}