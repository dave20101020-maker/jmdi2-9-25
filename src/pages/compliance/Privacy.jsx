import React from "react";

const bullets = [
  "We collect only the data needed to deliver the NorthStar experience (profile, pillar selections, habits, and engagement metrics).",
  "We store data in UK/EU regions and encrypt it in transit and at rest where supported.",
  "You can request export or deletion of your data at any time from the account settings area.",
  "AI features are non-diagnostic and should not be treated as clinical guidance.",
];

const dataUses = [
  "Personalisation of habits, nudges, and focus areas across the 8 pillars.",
  "Analytics for KPIs such as onboarding completion, retention, and active habits.",
  "Safety reviews and red-flag escalation within AI interactions.",
  "Improving product quality while maintaining privacy-first defaults.",
];

export default function Privacy() {
  return (
    <div className="ns-page">
      <div className="max-w-3xl mx-auto space-y-6 py-12">
        <header className="ns-card">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50 mb-2">
            Compliance
          </p>
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-white/70 mt-2">
            NorthStar keeps your wellbeing data private, transparent, and under
            your control. This page highlights how we collect, use, and protect
            information across all 8 pillars.
          </p>
        </header>

        <section className="ns-card space-y-3">
          <h2 className="text-xl font-semibold text-white">What we collect</h2>
          <ul className="list-disc list-inside text-white/80 space-y-2">
            {bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ns-card space-y-3">
          <h2 className="text-xl font-semibold text-white">How we use data</h2>
          <ul className="list-disc list-inside text-white/80 space-y-2">
            {dataUses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ns-card space-y-3">
          <h2 className="text-xl font-semibold text-white">Your controls</h2>
          <p className="text-white/80">
            Visit account settings to manage consent, export your data, and
            request deletion. You can also opt out of marketing communications
            at any time.
          </p>
          <p className="text-white/60 text-sm">
            Questions? Contact our trust team at trust@northstar.app.
          </p>
        </section>
      </div>
    </div>
  );
}
