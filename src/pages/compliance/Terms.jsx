import React from "react";

const commitments = [
  "NorthStar is a wellbeing companion and does not provide medical advice.",
  "Users must be 16+ or have guardian consent where applicable.",
  "Premium features require an active subscription; free tier remains available with limited pillars.",
  "We may update these terms; continued use constitutes acceptance of revisions.",
];

const userDuties = [
  "Keep your account secure and do not share credentials.",
  "Use AI coaches responsibly and avoid entering sensitive medical emergencies.",
  "Respect community guidelines when social features are enabled (no harassment or harmful comparisons).",
  "Report suspected vulnerabilities or misuse to security@northstar.app.",
];

export default function Terms() {
  return (
    <div className="ns-page">
      <div className="max-w-3xl mx-auto space-y-6 py-12">
        <header className="ns-card">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50 mb-2">
            Compliance
          </p>
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          <p className="text-white/70 mt-2">
            Please review the commitments and responsibilities that govern your
            use of NorthStar across the 8 wellbeing pillars.
          </p>
        </header>

        <section className="ns-card space-y-3">
          <h2 className="text-xl font-semibold text-white">Our commitments</h2>
          <ul className="list-disc list-inside text-white/80 space-y-2">
            {commitments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ns-card space-y-3">
          <h2 className="text-xl font-semibold text-white">
            Your responsibilities
          </h2>
          <ul className="list-disc list-inside text-white/80 space-y-2">
            {userDuties.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="ns-card space-y-3">
          <h2 className="text-xl font-semibold text-white">
            Non-diagnostic use
          </h2>
          <p className="text-white/80">
            AI coaches provide supportive guidance only. If you experience a
            medical or mental health emergency, contact local services
            immediately. NorthStar does not replace professional care.
          </p>
        </section>
      </div>
    </div>
  );
}
