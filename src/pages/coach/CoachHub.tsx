import React, { useMemo, useState } from "react";
import { ArrowRight, Clock3, MessageSquare, Shield, Sparkles } from "lucide-react";
import CoachChat from "@/components/coach/CoachChat";
import { useThemeTokens } from "@/components/ThemeProvider";

const COACHES = [
  // Define your coach metadata here
];

const SAFETY_POINTS = [
  // Define your safety notes here
];

export default function CoachHub() {
  const theme = useThemeTokens();
  const [selectedId, setSelectedId] = useState(COACHES[0].id);

  const selectedCoach = useMemo(
    () => COACHES.find((coach) => coach.id === selectedId) ?? COACHES[0],
    [selectedId]
  );

  return (
    <div className="space-y-6">
      {/* Render your hero section here */}
      
      {/* Safety callouts */}
      <div className="safety-notes">
        {SAFETY_POINTS.map((point, index) => (
          <div key={index} className="safety-point">
            <Shield />
            <span>{point}</span>
          </div>
        ))}
      </div>

      {/* Coach selection sidebar */}
      <div className="coach-directory">
        {COACHES.map((coach) => (
          <div
            key={coach.id}
            onClick={() => setSelectedId(coach.id)}
            className={`coach-item ${selectedId === coach.id ? 'selected' : ''}`}
          >
            <Sparkles />
            <span>{coach.name}</span>
          </div>
        ))}
      </div>

      {/* Selected coach summary */}
      <div className="coach-summary">
        <h2>{selectedCoach.name}</h2>
        <p>{selectedCoach.persona}</p>
        <p>{selectedCoach.focus}</p>
      </div>

      {/* Coach chat component */}
      <CoachChat
        coachId={selectedCoach.id}
        coachName={selectedCoach.name}
        persona={selectedCoach.persona}
        focus={selectedCoach.focus}
        quickPrompts={selectedCoach.quickPrompts}
        contextSummary="Pillar scores, recent habits, and preferences shared during onboarding are used to personalise suggestions."
      />
    </div>
  );
}