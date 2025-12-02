import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Sun, Thermometer, Volume2, BedDouble, Wind, Lightbulb } from "lucide-react";
import { toast } from "sonner";

const AUDIT_FACTORS = [
  { 
    key: "darkness", 
    label: "Darkness", 
    icon: Sun, 
    lowLabel: "Very Bright", 
    highLabel: "Pitch Black",
    color: "#6B46C1"
  },
  { 
    key: "temperature", 
    label: "Temperature", 
    icon: Thermometer, 
    lowLabel: "Too Hot/Cold", 
    highLabel: "Perfect",
    color: "#FF5733"
  },
  { 
    key: "noise", 
    label: "Noise Level", 
    icon: Volume2, 
    lowLabel: "Very Noisy", 
    highLabel: "Silent",
    color: "#4CC9F0"
  },
  { 
    key: "mattressComfort", 
    label: "Mattress Comfort", 
    icon: BedDouble, 
    lowLabel: "Uncomfortable", 
    highLabel: "Perfect",
    color: "#52B788"
  },
  { 
    key: "airQuality", 
    label: "Air Quality", 
    icon: Wind, 
    lowLabel: "Stuffy", 
    highLabel: "Fresh",
    color: "#7C3AED"
  }
];

export default function EnvironmentAudit({ onClose, onSave, initialAudit = null }) {
  const [audit, setAudit] = useState(initialAudit || {
    darkness: 5,
    temperature: 5,
    noise: 5,
    mattressComfort: 5,
    airQuality: 5,
    issuesIdentified: [],
    improvements: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const overall = Math.round(
      ((audit.darkness || 0) + (audit.temperature || 0) + (audit.noise || 0) + 
       (audit.mattressComfort || 0) + (audit.airQuality || 0)) / 5 * 10
    );
    setAudit(prev => ({ ...prev, overallScore: overall }));
  }, [audit.darkness, audit.temperature, audit.noise, audit.mattressComfort, audit.airQuality]);

  const updateRating = (factor, value) => {
    setAudit({
      ...audit,
      [factor]: value
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(audit);
      toast.success('Sleep environment audit saved! 🛏️');
    } catch (error) {
      toast.error('Failed to save audit');
      setSaving(false);
    }
  };

  const overallScore = audit.overallScore || 0;
  const scoreColor = overallScore >= 80 ? '#52B788' : overallScore >= 60 ? '#FFD700' : '#FF5733';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BedDouble className="w-7 h-7 text-[#6B46C1]" />
            Sleep Environment Audit
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Score Display */}
          <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-6xl font-bold mb-2" style={{ color: scoreColor }}>
              {overallScore}
            </div>
            <div className="text-white/70 text-sm">Overall Environment Score</div>
            <div className="text-white/50 text-xs mt-1">
              {overallScore >= 80 ? 'Excellent sleep environment!' :
               overallScore >= 60 ? 'Good, with room for improvement' :
               'Several areas need attention'}
            </div>
          </div>

          {/* Rating Factors */}
          {AUDIT_FACTORS.map(factor => {
            const Icon = factor.icon;
            const value = audit[factor.key] || 5;
            
            return (
              <div key={factor.key} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${factor.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: factor.color }} />
                  </div>
                  <div className="flex-1">
                    <Label className="text-white font-bold">{factor.label}</Label>
                    <div className="flex items-center justify-between text-xs text-white/60 mt-1">
                      <span>{factor.lowLabel}</span>
                      <span className="font-bold text-lg" style={{ color: factor.color }}>{value}/10</span>
                      <span>{factor.highLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={value}
                  onChange={(e) => updateRating(factor.key, parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${factor.color}40 0%, ${factor.color} ${(value - 1) * 11.11}%, rgba(255,255,255,0.1) ${(value - 1) * 11.11}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                
                {/* Visual scale */}
                <div className="flex justify-between mt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <button
                      key={num}
                      onClick={() => updateRating(factor.key, num)}
                      className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                        value === num
                          ? 'text-white scale-125'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                      style={value === num ? { backgroundColor: factor.color } : {}}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* AI Recommendations */}
          {overallScore < 80 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-400" />
                Improvement Tips
              </h4>
              <ul className="space-y-2 text-sm text-white/80">
                {audit.darkness < 7 && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span><strong>Darkness:</strong> Use blackout curtains, eye mask, or remove light sources</span>
                  </li>
                )}
                {audit.temperature < 7 && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span><strong>Temperature:</strong> Ideal sleep temperature is 60-67°F (15-19°C)</span>
                  </li>
                )}
                {audit.noise < 7 && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span><strong>Noise:</strong> Try earplugs, white noise machine, or address noise sources</span>
                  </li>
                )}
                {audit.mattressComfort < 7 && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span><strong>Comfort:</strong> Consider mattress topper or new pillows</span>
                  </li>
                )}
                {audit.airQuality < 7 && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span><strong>Air Quality:</strong> Open window before bed or use air purifier</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] text-white font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Audit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}