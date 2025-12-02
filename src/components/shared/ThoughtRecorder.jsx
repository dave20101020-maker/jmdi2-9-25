
import { api } from "@/utils/apiClient";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Save, Brain, Plus, Trash2, Lightbulb, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";

const COMMON_EMOTIONS = [
  "anxious", "sad", "angry", "frustrated", "overwhelmed",
  "worried", "ashamed", "guilty", "lonely", "scared"
];

const STEPS = [
  { id: 1, title: "Situation", icon: "📍" },
  { id: 2, title: "Automatic Thought", icon: "💭" },
  { id: 3, title: "Emotions", icon: "😔" },
  { id: 4, title: "Evidence", icon: "🔍" },
  { id: 5, title: "Balanced Thought", icon: "⚖️" },
  { id: 6, title: "Outcome", icon: "✨" }
];

export default function ThoughtRecorder({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [record, setRecord] = useState({
    situation: "",
    automaticThought: "",
    emotions: [],
    evidence: [],
    counterEvidence: [],
    balancedThought: "",
    emotionsAfter: [],
    actionPlan: "",
    aiSuggestion: ""
  });
  const [saving, setSaving] = useState(false);
  const [gettingAI, setGettingAI] = useState(false);
  
  const [emotionInput, setEmotionInput] = useState("");
  const [emotionIntensity, setEmotionIntensity] = useState(5);
  const [evidenceInput, setEvidenceInput] = useState("");
  const [counterInput, setCounterInput] = useState("");

  const addEmotion = (emotion = emotionInput) => {
    if (emotion.trim()) {
      setRecord({
        ...record,
        emotions: [...(record.emotions || []), { emotion: emotion.trim(), intensity: emotionIntensity }]
      });
      setEmotionInput("");
      setEmotionIntensity(5);
    }
  };

  const addEvidence = () => {
    if (evidenceInput.trim()) {
      setRecord({
        ...record,
        evidence: [...(record.evidence || []), evidenceInput.trim()]
      });
      setEvidenceInput("");
    }
  };

  const addCounterEvidence = () => {
    if (counterInput.trim()) {
      setRecord({
        ...record,
        counterEvidence: [...(record.counterEvidence || []), counterInput.trim()]
      });
      setCounterInput("");
    }
  };

  const getAISuggestion = async () => {
    if (!record.automaticThought.trim()) {
      toast.error('Please enter your automatic thought first');
      return;
    }

    setGettingAI(true);
    try {
      const prompt = `As a supportive CBT coach, help reframe this negative thought:

Situation: ${record.situation}
Automatic Thought: ${record.automaticThought}
Evidence For: ${record.evidence?.join(', ') || 'none provided'}
Evidence Against: ${record.counterEvidence?.join(', ') || 'none provided'}

Provide:
1. A more balanced, compassionate alternative perspective (2-3 sentences)
2. One cognitive distortion that might be present (e.g., catastrophizing, black-and-white thinking)
3. A brief, actionable coping strategy

Return ONLY valid JSON:
{
  "balancedPerspective": "alternative viewpoint here",
  "cognitiveDistortion": "distortion type",
  "copingStrategy": "actionable strategy"
}`;

      const result = await api.aiCoach({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            balancedPerspective: { type: "string" },
            cognitiveDistortion: { type: "string" },
            copingStrategy: { type: "string" }
          }
        }
      });

      setRecord({
        ...record,
        aiSuggestion: `${result.balancedPerspective}\n\nCognitive Pattern: ${result.cognitiveDistortion}\n\nTry This: ${result.copingStrategy}`
      });
      setGettingAI(false);
      toast.success('AI suggestion generated! ✨');
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      setGettingAI(false);
      toast.error('Failed to generate suggestion');
    }
  };

  const handleSave = async () => {
    if (!record.situation.trim() || !record.automaticThought.trim()) {
      toast.error('Please fill in the situation and automatic thought');
      return;
    }

    setSaving(true);
    try {
      await onSave(record);
      toast.success('Thought record saved! 🧠');
    } catch (error) {
      toast.error('Failed to save record');
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return record.situation.trim();
    if (step === 2) return record.automaticThought.trim();
    if (step === 3) return record.emotions.length > 0;
    if (step === 4) return true; // Evidence is optional
    if (step === 5) return record.balancedThought.trim();
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] border border-white/20 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1f35] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-400" />
            Thought Record (CBT)
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => setStep(s.id)}
                  className={`flex flex-col items-center gap-2 min-w-[80px] ${
                    step === s.id ? 'scale-110' : 'opacity-60'
                  } transition-all`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    step === s.id
                      ? 'bg-purple-500/30 border-2 border-purple-500'
                      : 'bg-white/10 border border-white/20'
                  }`}>
                    {s.icon}
                  </div>
                  <div className="text-white/70 text-xs text-center font-medium">{s.title}</div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-white/20 mx-2 min-w-[20px]" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-xl font-bold text-white mb-2">What happened?</h3>
                <p className="text-white/70 text-sm mb-4">
                  Describe the situation that triggered this thought. Be specific but brief.
                </p>
                <Textarea
                  value={record.situation}
                  onChange={(e) => setRecord({ ...record, situation: e.target.value })}
                  placeholder="Example: My friend didn't reply to my text for 3 hours..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  rows={6}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-xl font-bold text-white mb-2">What thought popped into your head?</h3>
                <p className="text-white/70 text-sm mb-4">
                  What was the automatic, unhelpful thought that came to mind?
                </p>
                <Textarea
                  value={record.automaticThought}
                  onChange={(e) => setRecord({ ...record, automaticThought: e.target.value })}
                  placeholder="Example: They must be mad at me. I always say the wrong thing..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  rows={6}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-xl font-bold text-white mb-2">What emotions did you feel?</h3>
                <p className="text-white/70 text-sm mb-4">
                  Identify the emotions and rate their intensity (1-10)
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {COMMON_EMOTIONS.map(emotion => (
                    <button
                      key={emotion}
                      onClick={() => addEmotion(emotion)}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all capitalize text-sm"
                    >
                      {emotion}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mb-4">
                  <Input
                    value={emotionInput}
                    onChange={(e) => setEmotionInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmotion()}
                    placeholder="Or type custom emotion..."
                    className="bg-white/10 border-white/20 text-white flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={emotionIntensity}
                      onChange={(e) => setEmotionIntensity(parseInt(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-white font-bold w-8">{emotionIntensity}</span>
                  </div>
                  <Button
                    onClick={() => addEmotion()}
                    size="sm"
                    className="bg-purple-500/20 text-purple-400 border border-purple-500/40"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {record.emotions?.length > 0 && (
                  <div className="space-y-2">
                    {record.emotions.map((em, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-white capitalize">{em.emotion}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-6 rounded-sm ${
                                  i < em.intensity ? 'bg-purple-500' : 'bg-white/20'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-purple-400 font-bold">{em.intensity}/10</span>
                        </div>
                        <button
                          onClick={() => setRecord({
                            ...record,
                            emotions: record.emotions.filter((_, i) => i !== idx)
                          })}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Evidence FOR the thought</h3>
                  <p className="text-white/70 text-sm mb-4">
                    What facts support this thought?
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={evidenceInput}
                      onChange={(e) => setEvidenceInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addEvidence()}
                      placeholder="Add evidence..."
                      className="bg-white/10 border-white/20 text-white flex-1"
                    />
                    <Button
                      onClick={addEvidence}
                      size="sm"
                      className="bg-red-500/20 text-red-400 border border-red-500/40"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {record.evidence?.map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-red-500/10 rounded-lg p-3 mb-2">
                      <span className="text-red-400">•</span>
                      <span className="text-white/80 text-sm flex-1">{ev}</span>
                      <button
                        onClick={() => setRecord({
                          ...record,
                          evidence: record.evidence.filter((_, i) => i !== idx)
                        })}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Evidence AGAINST the thought</h3>
                  <p className="text-white/70 text-sm mb-4">
                    What facts contradict this thought? What would you tell a friend?
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={counterInput}
                      onChange={(e) => setCounterInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCounterEvidence()}
                      placeholder="Add counter-evidence..."
                      className="bg-white/10 border-white/20 text-white flex-1"
                    />
                    <Button
                      onClick={addCounterEvidence}
                      size="sm"
                      className="bg-green-500/20 text-green-400 border border-green-500/40"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {record.counterEvidence?.map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-green-500/10 rounded-lg p-3 mb-2">
                      <span className="text-green-400">•</span>
                      <span className="text-white/80 text-sm flex-1">{ev}</span>
                      <button
                        onClick={() => setRecord({
                          ...record,
                          counterEvidence: record.counterEvidence.filter((_, i) => i !== idx)
                        })}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-xl font-bold text-white mb-2">Create a balanced thought</h3>
                <p className="text-white/70 text-sm mb-4">
                  Considering all the evidence, what's a more realistic, balanced way to think about this?
                </p>

                {record.aiSuggestion && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h4 className="text-white font-bold">AI Suggestion</h4>
                    </div>
                    <p className="text-white/80 text-sm whitespace-pre-line">{record.aiSuggestion}</p>
                  </div>
                )}

                <Button
                  onClick={getAISuggestion}
                  disabled={gettingAI}
                  className="w-full bg-purple-500/20 text-purple-400 border border-purple-500/40 mb-4"
                >
                  <Lightbulb className={`w-4 h-4 mr-2 ${gettingAI ? 'animate-pulse' : ''}`} />
                  {gettingAI ? 'Getting AI Help...' : 'Get AI Help'}
                </Button>

                <Textarea
                  value={record.balancedThought}
                  onChange={(e) => setRecord({ ...record, balancedThought: e.target.value })}
                  placeholder="Example: While they haven't replied yet, there could be many reasons. Maybe they're busy. I can check in later without jumping to conclusions..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  rows={6}
                />
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-xl font-bold text-white mb-2">How do you feel now?</h3>
                <p className="text-white/70 text-sm mb-4">
                  Re-rate your emotions after reframing the thought
                </p>

                {record.emotions?.length > 0 && (
                  <div className="space-y-3">
                    {record.emotions.map((em, idx) => {
                      const afterEmotion = record.emotionsAfter?.find(e => e.emotion === em.emotion);
                      const afterIntensity = afterEmotion?.intensity || em.intensity;
                      const improved = afterIntensity < em.intensity;

                      return (
                        <div key={idx} className="bg-white/5 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-white capitalize font-medium">{em.emotion}</span>
                            {improved && <TrendingUp className="w-5 h-5 text-green-400" />}
                          </div>
                          
                          <div className="flex items-center gap-4 mb-2">
                            <div className="text-xs text-white/60">Before:</div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-6 rounded-sm ${
                                    i < em.intensity ? 'bg-red-500' : 'bg-white/10'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-white/70 font-bold">{em.intensity}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-xs text-white/60">After:</div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={afterIntensity}
                              onChange={(e) => {
                                const newIntensity = parseInt(e.target.value);
                                const emotionsAfter = record.emotionsAfter?.filter(e => e.emotion !== em.emotion) || [];
                                setRecord({
                                  ...record,
                                  emotionsAfter: [...emotionsAfter, { emotion: em.emotion, intensity: newIntensity }]
                                });
                              }}
                              className="flex-1"
                            />
                            <span className="text-green-400 font-bold w-8">{afterIntensity}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4">
                  <Label className="text-white mb-2 block">Action Plan (Optional)</Label>
                  <Textarea
                    value={record.actionPlan}
                    onChange={(e) => setRecord({ ...record, actionPlan: e.target.value })}
                    placeholder="What will you do next? Any specific actions or coping strategies..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-6 border-t border-white/10">
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
            )}
            {step < 6 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold"
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Complete & Save'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}