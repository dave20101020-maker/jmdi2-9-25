import React, { useEffect, useMemo, useState } from "react";
import { getRoutingEvents } from "@/api/auditClient";
import { PILLARS } from "@/config/pillars";

const highlights = [
  {
    title: "DPIA coverage",
    body: "Data Protection Impact Assessment tracked for AI surfaces and updated with each release that touches data flows.",
  },
  {
    title: "LLM safety guardrails",
    body: "Red-flag escalation, non-diagnostic language enforcement, and content moderation ahead of provider calls.",
  },
  {
    title: "Audit + observability",
    body: "Structured logs for AI requests, rate limits, and safety events with retention aligned to policy.",
  },
];

const safeguards = [
  "Authentication via first-party JWT/refresh with short-lived access tokens; no third-party auth holds credentials.",
  "UK/EU data residency with encryption in transit and at rest for supported stores.",
  "Rate limiting, input validation, and request sanitization on all AI endpoints.",
  "Human-in-the-loop escalation for crisis signals; no diagnostic responses are returned.",
  "Provider keys isolated in server env; frontend never receives LLM credentials.",
];

const disclosures = [
  "Models are used for coaching, not medical diagnosis; users should seek clinical guidance for health conditions.",
  "User prompts may be logged for abuse prevention and safety review in accordance with policy.",
  "Content may be filtered or refused if safety rules are triggered (self-harm, abuse, PHI leakage).",
];

export default function TrustCenter() {
  const [routingEvents, setRoutingEvents] = useState([]);
  const [routingError, setRoutingError] = useState(false);

  const pillarLabelMap = useMemo(() => {
    const map = new Map();
    PILLARS.forEach((pillar) => {
      map.set(String(pillar.id), pillar.label);
    });
    return map;
  }, []);

  useEffect(() => {
    let active = true;

    const loadRoutingEvents = async () => {
      const result = await getRoutingEvents(6);
      if (!active) return;

      if (!result.ok || !result.data?.ok) {
        setRoutingError(true);
        return;
      }

      setRoutingEvents(
        Array.isArray(result.data?.events) ? result.data.events : []
      );
    };

    loadRoutingEvents().catch(() => {
      if (active) setRoutingError(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const formatTimestamp = (value) => {
    if (!value) return "Time unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Time unavailable";
    return date.toLocaleString();
  };

  const labelForEvent = (event) =>
    pillarLabelMap.get(String(event.pillar || "")) ||
    event.pillar ||
    "a specialist";

  return (
    <div className="min-h-screen bg-ns-navy text-ns-white">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <header className="rounded-2xl border border-ns-divider bg-white/5 p-6 shadow-ns-card">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2">
            NorthStar Trust Center
          </p>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white">
              Security, Privacy, and Responsible AI
            </h1>
            <p className="text-white/70">
              A single source of truth for how NorthStar protects data, runs
              DPIAs, and keeps LLM experiences safe.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-ns-card"
            >
              <p className="text-xs uppercase tracking-[0.28em] text-ns-gold mb-2">
                {item.title}
              </p>
              <p className="text-white/80 text-sm leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-ns-card space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                Safety posture
              </p>
              <h2 className="text-xl font-semibold text-white">
                Controls at a glance
              </h2>
            </div>
            <a
              className="inline-flex items-center gap-2 rounded-full bg-ns-gold px-4 py-2 text-sm font-semibold text-ns-navy hover:bg-ns-softGold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ns-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ns-navy"
              href="mailto:security@northstar.app"
            >
              Report a concern
            </a>
          </div>
          <ul className="space-y-2 text-white/80 list-disc list-inside">
            {safeguards.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-ns-card space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">
              LLM Safety Disclosures
            </p>
            <ul className="space-y-2 text-white/80 list-disc list-inside">
              {disclosures.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-ns-card space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">
              Reference docs
            </p>
            <ul className="space-y-2 text-white/80 list-disc list-inside">
              <li>DPIA — see docs/DPIA.md</li>
              <li>Clinical Safety — see docs/DCB0129_Clinical_Safety.md</li>
              <li>AI Safety Playbook — see docs/AI_SAFETY_PLAYBOOK.md</li>
            </ul>
            <p className="text-white/60 text-sm">
              For enterprise requests or bespoke data terms, contact
              legal@northstar.app.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-ns-card space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/60">
              Routing transparency
            </p>
            <h2 className="text-xl font-semibold text-white">
              Recent specialist handoffs
            </h2>
            <p className="text-white/70 text-sm">
              A short record when NorthStar connects you to a specialist.
            </p>
          </div>
          {routingError ? (
            <p className="text-sm text-white/60">
              Routing history is unavailable right now.
            </p>
          ) : routingEvents.length === 0 ? (
            <p className="text-sm text-white/60">
              No recent routing activity yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-white/80">
              {routingEvents.map((event, index) => (
                <li
                  key={event.id || `${event.timestamp || "event"}-${index}`}
                  className="flex flex-col gap-1 rounded-lg bg-white/5 px-3 py-2"
                >
                  <span>
                    NorthStar connected you to {labelForEvent(event)}.
                  </span>
                  <span className="text-xs text-white/50">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
