import React, { useEffect, useMemo, useState } from "react";
import { themeTokens } from "@/components/ThemeProvider";
import { getRoutingEvents } from "@/api/auditClient";
import { PILLARS } from "@/config/pillars";

type RoutingEvent = {
  id?: string | null;
  type?: string | null;
  from?: string | null;
  to?: string | null;
  pillar?: string | null;
  timestamp?: string | null;
  requestId?: string | null;
};

export default function TrustCenter() {
  const [routingEvents, setRoutingEvents] = useState<RoutingEvent[]>([]);
  const [routingError, setRoutingError] = useState(false);

  const pillarLabelMap = useMemo(() => {
    const map = new Map<string, string>();
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

  const formatTimestamp = (value?: string | null) => {
    if (!value) return "Time unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Time unavailable";
    return date.toLocaleString();
  };

  const labelForEvent = (event: RoutingEvent) =>
    pillarLabelMap.get(String(event.pillar || "")) ||
    event.pillar ||
    "a specialist";

  return (
    <div className={`${themeTokens.card} space-y-4`}>
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">
          NorthStar
        </p>
        <h1 className="text-2xl font-semibold text-white">Trust Center</h1>
        <p className="text-sm text-white/70">
          Security, reliability, and responsible AI practices.
        </p>
      </header>
      <div className="space-y-3 text-white/80 leading-relaxed">
        <p>
          We prioritize encryption in transit and at rest, role-based access
          controls, and regular audits of critical services.
        </p>
        <p>
          AI systems are monitored for safety and bias; escalations surface to
          humans-in-the-loop where needed.
        </p>
        <p>
          Report security concerns to security@northstar.app for a rapid review.
        </p>
      </div>
      <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white">
            Routing transparency
          </h2>
          <p className="text-sm text-white/70">
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
                <span>NorthStar connected you to {labelForEvent(event)}.</span>
                <span className="text-xs text-white/50">
                  {formatTimestamp(event.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
