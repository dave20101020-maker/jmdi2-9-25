import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from '@/utils';

export default function PillarPage({ pillar, title, subtitle, stats, children }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 px-4 sm:px-6 pt-6 relative">
      {/* Pillar-specific cosmic accent */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div 
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse-slow"
          style={{ backgroundColor: pillar.color }}
        />
        <div 
          className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 animate-pulse-slow"
          style={{ 
            backgroundColor: pillar.color,
            animationDelay: '2s'
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="text-white/60 hover:text-white transition-all duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-2 rounded-lg p-1"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 group">
              <span 
                className="text-3xl transition-all duration-300 group-hover:scale-110" 
                style={{ 
                  filter: `drop-shadow(0 0 10px ${pillar.color})`
                }}
              >
                {pillar.icon}
              </span>
              {title}
            </h1>
            <p className="text-white/60 text-sm">{subtitle}</p>
          </div>
        </div>

        {/* Stats Grid - Enhanced with hover effects */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {stats.map((stat, idx) => (
              <div 
                key={idx}
                className="bg-[#1a1f35] border border-white/20 rounded-xl p-3 md:p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-[#1f2540] hover:border-white/30 cursor-default group"
                style={{ 
                  boxShadow: `0 0 20px ${stat.color || pillar.color}15`,
                  animationDelay: `${idx * 100}ms`
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="transition-all duration-300 group-hover:scale-110"
                    style={{ color: stat.color || pillar.color }}
                  >
                    {stat.icon}
                  </div>
                  <div className="text-white/70 text-xs md:text-sm">{stat.label}</div>
                </div>
                <div 
                  className="text-2xl md:text-3xl font-bold transition-all duration-300 group-hover:scale-110"
                  style={{ color: stat.color || pillar.color }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-white/60">{stat.subtitle}</div>
                
                {/* Hover glow effect */}
                <div 
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"
                  style={{ backgroundColor: `${stat.color || pillar.color}20` }}
                />
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
      
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.05); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}