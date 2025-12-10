import React from "react";

const controls = [
  "Authentication via backend-owned JWT + refresh tokens; no third-party auth providers hold your credentials.",
  "Data residency in UK/EU regions with encryption in transit and at rest where supported.",
  "Rate limiting, input validation, and audit logging on AI, auth, and payments routes.",
  "AI safety filters enforce non-diagnostic language and escalate red flags to human review paths.",
];

export default function TrustCenter() {
  return (
    <div className="ns-page">
      <div className="max-w-3xl mx-auto space-y-6 py-12">
        <header className="ns-card">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50 mb-2">
            Compliance
          </p>
          <h1 className="text-3xl font-bold text-white">Trust Center</h1>
          <p className="text-white/70 mt-2">
            Security, privacy, and safety controls that keep NorthStar reliable
            for every pillar. This is the single source of truth for our
            governance posture.
          </p>
        </header>

        <section className="ns-card space-y-3">
          <h2 className="text-xl font-semibold text-white">
            Controls at a glance
          </h2>
          <ul className="list-disc list-inside text-white/80 space-y-2">
            {controls.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ns-card space-y-3">
          <h2 className="text-xl font-semibold text-white">Compliance docs</h2>
          <ul className="text-white/80 space-y-2 list-disc list-inside">
            <li>DPIA (see docs/DPIA.md)</li>
            <li>Clinical Safety (see docs/DCB0129_Clinical_Safety.md)</li>
            <li>AI Safety Playbook (see docs/AI_SAFETY_PLAYBOOK.md)</li>
          </ul>
          <p className="text-white/60 text-sm">
            We will keep this page aligned with our latest releases and
            regulatory guidance.
          </p>
        </section>
      </div>
    </div>
  );
}
