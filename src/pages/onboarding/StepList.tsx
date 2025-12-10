import React from "react";
import { CheckCircle2, Dot } from "lucide-react";
import { ThemeTokens } from "@/components/ThemeProvider";

type Step = {
  id: string;
  title: string;
  description: string;
};

type StepListProps = {
  steps: Step[];
  currentIndex: number;
  theme: ThemeTokens;
};

export default function StepList({
  steps,
  currentIndex,
  theme,
}: StepListProps) {
  return (
    <ol className="space-y-3" aria-label="Onboarding steps">
      {steps.map((step, idx) => {
        const isComplete = idx < currentIndex;
        const isActive = idx === currentIndex;
        return (
          <li
            key={step.id}
            className={`${theme.card} flex items-start gap-3 border border-[var(--ns-color-border)]`}
            aria-current={isActive ? "step" : undefined}
          >
            <div className="pt-2 text-ns-gold" aria-hidden>
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Dot className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--ns-color-card-foreground)]">
                {step.title}
              </p>
              <p className="text-xs text-[var(--ns-color-muted)]">
                {step.description}
              </p>
              {isActive && (
                <span className="inline-flex rounded-full bg-[var(--ns-color-accent)]/50 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--ns-color-foreground)]">
                  In progress
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
