import React, { useState } from 'react';

const PILLARS = [
  { id: "sleep", name: "Sleep", color: "#6B46C1", angle: 0 },
  { id: "diet", name: "Diet", color: "#52B788", angle: 45 },
  { id: "exercise", name: "Exercise", color: "#FF5733", angle: 90 },
  { id: "physical_health", name: "Health", color: "#FF7F50", angle: 135 },
  { id: "mental_health", name: "Mental", color: "#4CC9F0", angle: 180 },
  { id: "finances", name: "Finance", color: "#2E8B57", angle: 225 },
  { id: "social", name: "Social", color: "#FFD700", angle: 270 },
  { id: "spirituality", name: "Spirit", color: "#7C3AED", angle: 315 }
];

export default function ScoreOrb({ lifeScore, pillarScores = {} }) {
  const [hoveredPillar, setHoveredPillar] = useState(null);

  const getSize = (score) => {
    if (score >= 80) return { size: 24, opacity: 1 };
    if (score >= 60) return { size: 18, opacity: 0.8 };
    if (score >= 40) return { size: 14, opacity: 0.6 };
    return { size: 10, opacity: 0.4 };
  };
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const orbSize = isMobile ? 250 : 400;
  const radius = isMobile ? 90 : 140;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: orbSize, height: orbSize }}>
      {/* Central Sun/Orb - Enhanced with gradient animation */}
      <div 
        className="absolute inset-0 m-auto rounded-full flex items-center justify-center animate-pulse-slow transition-all duration-300 hover:scale-105 cursor-default group"
        style={{
          width: isMobile ? 120 : 180,
          height: isMobile ? 120 : 180,
          background: 'radial-gradient(circle, #F4D03F 0%, #D4AF37 50%, #B8960C 100%)',
          boxShadow: `
            0 0 40px rgba(212, 175, 55, 0.6),
            0 0 80px rgba(212, 175, 55, 0.4),
            0 0 120px rgba(212, 175, 55, 0.2),
            inset 0 0 40px rgba(255, 255, 255, 0.3)
          `
        }}
      >
        {/* Rotating glow effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(244, 208, 63, 0.8), transparent)',
            filter: 'blur(15px)'
          }}
        />
        
        <div className="text-center relative z-10">
          <div className={`${isMobile ? 'text-5xl' : 'text-7xl'} font-bold text-[#0A1628] transition-all duration-300 group-hover:scale-110`}>
            {lifeScore || 0}
          </div>
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-[#0A1628]/80`}>
            Life Score
          </div>
        </div>
      </div>
      
      {/* Orbiting Planets - Enhanced with hover effects */}
      {PILLARS.map((pillar) => {
        const score = pillarScores[pillar.id] || 0;
        const { size, opacity } = getSize(score);
        const angleRad = (pillar.angle * Math.PI) / 180;
        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;
        const isHovered = hoveredPillar === pillar.id;
        
        return (
          <div
            key={pillar.id}
            className="absolute animate-orbit"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              animation: `orbit 20s linear infinite ${pillar.angle / 45}s`,
              zIndex: isHovered ? 50 : 10
            }}
          >
            <div
              className="rounded-full flex items-center justify-center font-semibold text-white transition-all duration-300 cursor-pointer hover:scale-125 group relative"
              style={{
                width: isHovered ? size * 1.5 : size,
                height: isHovered ? size * 1.5 : size,
                backgroundColor: pillar.color,
                opacity: isHovered ? 1 : opacity,
                boxShadow: isHovered 
                  ? `0 0 ${size * 2}px ${pillar.color}, 0 0 ${size * 3}px ${pillar.color}80`
                  : `0 0 ${size}px ${pillar.color}80`,
                fontSize: isMobile ? '8px' : '10px'
              }}
              title={`${pillar.name}: ${score}/100`}
              onMouseEnter={() => setHoveredPillar(pillar.id)}
              onMouseLeave={() => setHoveredPillar(null)}
            >
              {score}
              
              {/* Hover tooltip */}
              {isHovered && (
                <div 
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1a1f35] border border-white/20 rounded-lg px-3 py-2 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200"
                  style={{ boxShadow: `0 0 20px ${pillar.color}40` }}
                >
                  <div className="text-white text-sm font-bold">{pillar.name}</div>
                  <div className="text-xs" style={{ color: pillar.color }}>{score}/100</div>
                  
                  {/* Tooltip arrow */}
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1f35] border-r border-b border-white/20 rotate-45"
                  />
                </div>
              )}
              
              {/* Pulse ring on hover */}
              {isHovered && (
                <div 
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ 
                    backgroundColor: pillar.color,
                    opacity: 0.4
                  }}
                />
              )}
            </div>
            
            {/* Constellation line - Enhanced with glow */}
            <svg
              className="absolute pointer-events-none transition-opacity duration-300"
              style={{
                width: Math.abs(x) * 2,
                height: Math.abs(y) * 2,
                left: x < 0 ? 'auto' : `${size/2}px`,
                right: x < 0 ? `${size/2}px` : 'auto',
                top: y < 0 ? 'auto' : `${size/2}px`,
                bottom: y < 0 ? `${size/2}px` : 'auto',
                opacity: isHovered ? 1 : 0.5
              }}
            >
              <line
                x1={x < 0 ? Math.abs(x) * 2 : 0}
                y1={y < 0 ? Math.abs(y) * 2 : 0}
                x2={x < 0 ? Math.abs(x) : Math.abs(x)}
                y2={y < 0 ? Math.abs(y) : Math.abs(y)}
                stroke={pillar.color}
                strokeWidth={isHovered ? "2" : "1"}
                opacity={isHovered ? "0.8" : "0.3"}
                strokeDasharray="2,2"
                style={{
                  filter: isHovered ? `drop-shadow(0 0 4px ${pillar.color})` : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </svg>
          </div>
        );
      })}
      
      <style>{`
        @keyframes orbit {
          from { transform: translate(-50%, -50%) rotate(0deg) translateX(${radius}px) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg) translateX(${radius}px) rotate(-360deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        /* Focus states for accessibility */
        *:focus-visible {
          outline: 2px solid #D4AF37;
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}