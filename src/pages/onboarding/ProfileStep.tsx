import React from "react";
import { ThemeTokens } from "@/components/ThemeProvider";

type DemographicsState = {
  age: string;
  sex: string;
  heightCm: string;
  weightKg: string;
  timezone: string;
  preferences: string;
};

type ConsentState = {
  gdpr: boolean;
  llm: boolean;
};

type ProfileStepProps = {
  demographics: DemographicsState;
  consent: ConsentState;
  onDemographicChange: (field: keyof DemographicsState, value: string) => void;
  onConsentChange: (consent: ConsentState) => void;
  theme: ThemeTokens;
};

export default function ProfileStep({
  demographics,
  consent,
  onDemographicChange,
  onConsentChange,
  theme,
}: ProfileStepProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-[var(--ns-color-card-foreground)] font-semibold">Age</span>
          <input
            type="number"
            min={13}
            value={demographics.age}
            onChange={(e) => onDemographicChange("age", e.target.value)}
            className="w-full rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-color-card)] px-3 py-2 text-[var(--ns-color-card-foreground)]"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--ns-color-card-foreground)] font-semibold">Sex</span>
          <select
            value={demographics.sex}
            onChange={(e) => onDemographicChange("sex", e.target.value)}
            className="w-full rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-color-card)] px-3 py-2 text-[var(--ns-color-card-foreground)]"
          >
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--ns-color-card-foreground)] font-semibold">Height (cm)</span>
          <input
            type="number"
            min={0}
            value={demographics.heightCm}
            onChange={(e) => onDemographicChange("heightCm", e.target.value)}
            className="w-full rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-color-card)] px-3 py-2 text-[var(--ns-color-card-foreground)]"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--ns-color-card-foreground)] font-semibold">Weight (kg)</span>
          <input
            type="number"
            min={0}
            value={demographics.weightKg}
            onChange={(e) => onDemographicChange("weightKg", e.target.value)}
            className="w-full rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-color-card)] px-3 py-2 text-[var(--ns-color-card-foreground)]"
          />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="text-[var(--ns-color-card-foreground)] font-semibold">Timezone</span>
          <input
            type="text"
            value={demographics.timezone}
            onChange={(e) => onDemographicChange("timezone", e.target.value)}
            className="w-full rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-color-card)] px-3 py-2 text-[var(--ns-color-card-foreground)]"
            placeholder="e.g. Europe/London"
          />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="text-[var(--ns-color-card-foreground)] font-semibold">
            Preferences (reminders, habits, focus areas)
          </span>
          <textarea
            value={demographics.preferences}
            onChange={(e) => onDemographicChange("preferences", e.target.value)}
            className="w-full rounded-lg border border-[var(--ns-color-border)] bg-[var(--ns-color-card)] px-3 py-2 text-[var(--ns-color-card-foreground)]"
            rows={3}
          />
        </label>
      </div>

      <div className="space-y-2 rounded-lg bg-[var(--ns-color-accent)]/40 border border-[var(--ns-color-border)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--ns-color-card-foreground)]">Consents</p>
        <label className="flex items-start gap-3 text-sm text-[var(--ns-color-card-foreground)]">
          <input
            type="checkbox"
            checked={consent.gdpr}
            onChange={(e) => onConsentChange({ ...consent, gdpr: e.target.checked })}
            className="mt-1 h-4 w-4 accent-ns-gold"
          />
          <span>
            I consent to the processing of my data under GDPR for the purpose of creating my NorthStar plan.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-[var(--ns-color-card-foreground)]">
          <input
            type="checkbox"
            checked={consent.llm}
            onChange={(e) => onConsentChange({ ...consent, llm: e.target.checked })}
            className="mt-1 h-4 w-4 accent-ns-gold"
          />
          <span>
            I consent to my data being used to generate AI-assisted guidance. I understand this is non-diagnostic.
          </span>
        </label>
      </div>
    </div>
  );
}

export type { DemographicsState, ConsentState };
