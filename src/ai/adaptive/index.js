import { PILLARS, getPillarsArray } from "@/utils";

const DEFAULT_PILLARS = getPillarsArray();
const ALL_PILLAR_IDS = DEFAULT_PILLARS.map((pillar) => pillar.id);

const ASSESSMENT_DOMAIN_MAP = {
  phq9: "mental_health",
  gad7: "mental_health",
  adhd: "neurodiversity",
  aq10: "neurodiversity",
  sleep_hygiene: "sleep",
  diet_quality: "nutrition",
  exercise_readiness: "fitness",
  social_support: "relationships",
};

const DOMAIN_LABELS = {
  mental_health: "Mental health",
  neurodiversity: "Neurodiversity",
  sleep: "Sleep hygiene",
  nutrition: "Nutrition",
  fitness: "Fitness",
  relationships: "Relationships",
  physical_health: "Physical health",
  general: "Wellbeing",
};

const DOMAIN_TO_PILLARS = {
  mental_health: ["mental_health", "sleep", "social", "spirituality"],
  neurodiversity: ["mental_health", "social"],
  sleep: ["sleep", "mental_health"],
  nutrition: ["diet", "physical_health"],
  fitness: ["exercise", "physical_health"],
  relationships: ["social", "mental_health"],
  physical_health: ["physical_health", "exercise"],
  general: ALL_PILLAR_IDS,
};

const DOMAIN_FOCUS_AREA_MAP = {
  mental_health: "motivation",
  neurodiversity: "opportunity",
  sleep: "opportunity",
  nutrition: "capability",
  fitness: "capability",
  relationships: "opportunity",
  physical_health: "capability",
  general: "motivation",
};

const SEVERITY_WEIGHTS = {
  none: 0,
  minimal: 0.15,
  mild: 0.25,
  moderate: 0.45,
  moderatelysevere: 0.6,
  severe: 0.75,
  extremelysevere: 0.85,
};

const DEFICIT_ARCHETYPES = {
  motivation: {
    label: "Momentum Rebuilder",
    tagline: "Reignite purpose to drive action",
    summary:
      "Energy dipped recently. Reconnect actions to purpose and celebrate small wins to restart momentum.",
    focusAreaLabel: "Motivation gap",
  },
  opportunity: {
    label: "Environment Architect",
    tagline: "Remove friction and design better cues",
    summary:
      "Systems or surroundings are blocking progress. Simplify the path and add accountability touchpoints.",
    focusAreaLabel: "Opportunity gap",
  },
  capability: {
    label: "Skill Builder",
    tagline: "Stack tiny reps to grow confidence",
    summary:
      "Confidence in the skills behind your habits is shaky. Break habits into smaller steps and prove competence through quick wins.",
    focusAreaLabel: "Capability gap",
  },
};

const ALERT_THRESHOLD = 0.35;
const DEFAULT_DEFICITS = { motivation: 0, opportunity: 0, capability: 0 };

const safeLower = (value) =>
  typeof value === "string"
    ? value.toLowerCase()
    : String(value || "").toLowerCase();

const severityKey = (value) => safeLower(value).replace(/[^a-z]/g, "");

const pickSeverityWeight = (severity) =>
  SEVERITY_WEIGHTS[severityKey(severity)] ?? 0.2;

function mapAssessmentEntries(raw = {}) {
  if (raw instanceof Map) {
    return Array.from(raw.entries()).map(([id, payload]) => ({
      id,
      ...(payload || {}),
    }));
  }
  if (Array.isArray(raw)) {
    return raw.map((payload) => ({ ...(payload || {}) }));
  }
  return Object.entries(raw || {}).map(([id, payload]) => ({
    id,
    ...(payload || {}),
  }));
}

function normalizeAssessments(rawAssessments) {
  return mapAssessmentEntries(rawAssessments)
    .map((entry) => {
      const domain = safeLower(
        entry.domain || ASSESSMENT_DOMAIN_MAP[entry.id] || "general"
      );
      const severityLabel = entry.severity || null;
      const severityScore = pickSeverityWeight(severityLabel);
      return {
        id: entry.id,
        name: entry.name || DOMAIN_LABELS[domain] || entry.id,
        domain,
        severityLabel,
        severityScore,
        percentile:
          typeof entry.percentile === "number" ? entry.percentile : null,
        interpretation: entry.interpretation || null,
        recommendations: Array.isArray(entry.recommendations)
          ? entry.recommendations
          : [],
        completedAt: entry.completedAt || null,
      };
    })
    .filter((entry) => entry.domain);
}

function consolidateAlerts(signals = []) {
  const byDomain = new Map();
  signals.forEach((signal) => {
    const existing = byDomain.get(signal.domain);
    if (!existing || signal.severityScore > existing.severityScore) {
      byDomain.set(signal.domain, signal);
    }
  });
  return Array.from(byDomain.entries()).map(([domain, signal]) => {
    const pillarIds = DOMAIN_TO_PILLARS[domain] || ALL_PILLAR_IDS;
    return {
      id: `${domain}-${signal.id}`,
      domain,
      label: DOMAIN_LABELS[domain] || signal.name || domain,
      severityLabel: signal.severityLabel || "Unknown",
      score: signal.severityScore,
      interpretation: signal.interpretation,
      recommendations: signal.recommendations,
      pillarIds,
      focusArea: DOMAIN_FOCUS_AREA_MAP[domain] || "motivation",
    };
  });
}

function buildPrioritySummary(action, alert, deficitScore) {
  const parts = [];
  if (alert) {
    parts.push(
      `${alert.label} is ${
        alert.severityLabel ? alert.severityLabel.toLowerCase() : "elevated"
      }`
    );
  }
  if (deficitScore > 0) {
    parts.push(
      `${Math.round(deficitScore * 100)}% ${action.focusArea} gap detected`
    );
  }
  return parts.length
    ? `${parts.join(". ")}.`
    : `Keep nurturing ${action.focusArea} inside this pillar.`;
}

function buildPriorityPillars({
  recommendedActions = [],
  deficits = {},
  alerts = [],
  accessiblePillars = DEFAULT_PILLARS,
}) {
  if (!recommendedActions.length && !alerts.length) {
    return [];
  }
  const byId = new Map();
  const alertsByPillar = (pillarId) =>
    alerts.filter((alert) => alert.pillarIds.includes(pillarId));

  recommendedActions.forEach((action, index) => {
    if (!action?.pillarId) return;
    const matchingAlert = alertsByPillar(action.pillarId)[0] || null;
    const deficitScore = deficits[action.focusArea] || 0;
    const alertScore = matchingAlert?.score || 0;
    const meta = accessiblePillars.find(
      (pillar) => pillar.id === action.pillarId
    ) ||
      PILLARS[action.pillarId] || {
        id: action.pillarId,
        name: action.pillarId,
      };
    const priorityScore = Number(
      (
        alertScore * 0.6 +
        deficitScore * 0.4 +
        (index === 0 ? 0.05 : 0)
      ).toFixed(2)
    );
    byId.set(action.pillarId, {
      id: action.pillarId,
      name: meta.name || meta.label || action.pillarId,
      color: meta.color,
      focusArea: action.focusArea,
      intensity: action.intensity,
      comBGap: Math.round(deficitScore * 100),
      priorityScore,
      summary: buildPrioritySummary(action, matchingAlert, deficitScore),
      microActions: Array.isArray(action.microActions)
        ? action.microActions.slice(0, 3)
        : [],
      alert: matchingAlert,
    });
  });

  alerts.forEach((alert) => {
    if (!Array.isArray(alert.pillarIds)) return;
    alert.pillarIds.forEach((pillarId) => {
      if (byId.has(pillarId) || alert.score < ALERT_THRESHOLD) return;
      const meta = accessiblePillars.find((pillar) => pillar.id === pillarId) ||
        PILLARS[pillarId] || { id: pillarId, name: pillarId };
      const deficitScore = deficits[alert.focusArea] || 0;
      const priorityScore = Number(
        (alert.score * 0.7 + deficitScore * 0.3).toFixed(2)
      );
      byId.set(pillarId, {
        id: pillarId,
        name: meta.name || meta.label || pillarId,
        color: meta.color,
        focusArea: alert.focusArea,
        intensity: alert.score > 0.6 ? "Deep" : "Medium",
        comBGap: Math.round(deficitScore * 100),
        priorityScore,
        summary:
          alert.interpretation ||
          `${alert.label} needs nurturing before momentum slips.`,
        microActions: (alert.recommendations || [])
          .slice(0, 2)
          .map((text, i) => ({
            id: `${alert.id}-rec-${i}`,
            label: text,
            description: text,
          })),
        alert,
      });
    });
  });

  return Array.from(byId.values()).sort(
    (a, b) => b.priorityScore - a.priorityScore
  );
}

function pickPersona(deficits = {}) {
  const ordered = Object.entries({ ...DEFAULT_DEFICITS, ...deficits })
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
  const topKey = ordered[0] || "motivation";
  const persona = DEFICIT_ARCHETYPES[topKey] || DEFICIT_ARCHETYPES.motivation;
  return {
    key: topKey,
    ...persona,
  };
}

export function buildAdaptiveCoachProfile({
  user,
  comBInsights,
  accessiblePillars = DEFAULT_PILLARS,
} = {}) {
  const normalizedPillars = accessiblePillars.length
    ? accessiblePillars
    : DEFAULT_PILLARS;
  const assessments = normalizeAssessments(user?.assessments || {});
  const alerts = consolidateAlerts(assessments);
  const deficits = { ...DEFAULT_DEFICITS, ...(comBInsights?.deficits || {}) };
  const persona = pickPersona(deficits);
  const priorityPillars = buildPriorityPillars({
    recommendedActions: comBInsights?.recommendedActions || [],
    deficits,
    alerts,
    accessiblePillars: normalizedPillars,
  }).slice(0, 3);
  const watchouts = alerts
    .filter((alert) => alert.score >= ALERT_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (
    !priorityPillars.length &&
    !watchouts.length &&
    !assessments.length &&
    !comBInsights
  ) {
    return null;
  }

  const summaryParts = [persona.summary];
  if (watchouts[0]) {
    summaryParts.push(
      `${watchouts[0].label} scores ${
        watchouts[0].severityLabel?.toLowerCase?.() || "high"
      }. Blend calming rituals into the week.`
    );
  }

  return {
    persona: persona.label,
    personaTagline: persona.tagline,
    focusArea: persona.key,
    focusAreaLabel: persona.focusAreaLabel,
    summary: summaryParts.join(" ").trim(),
    comBDeficits: deficits,
    priorityPillars,
    alerts: watchouts,
    assessments,
  };
}

export function buildAdaptiveCoachContext(profile) {
  if (!profile) return null;
  return {
    persona: profile.persona,
    personaTagline: profile.personaTagline,
    focusArea: profile.focusArea,
    focusAreaLabel: profile.focusAreaLabel,
    summary: profile.summary,
    deficits: profile.comBDeficits,
    priorityPillars: (profile.priorityPillars || []).map((pillar) => ({
      id: pillar.id,
      name: pillar.name,
      focusArea: pillar.focusArea,
      intensity: pillar.intensity,
      summary: pillar.summary,
      microActions: pillar.microActions,
      alert: pillar.alert
        ? {
            label: pillar.alert.label,
            severity: pillar.alert.severityLabel,
            domain: pillar.alert.domain,
          }
        : null,
    })),
    watchouts: (profile.alerts || []).map((alert) => ({
      label: alert.label,
      severity: alert.severityLabel,
      description: alert.interpretation,
      domain: alert.domain,
    })),
  };
}

export function getAdaptivePillarPlan(pillarId, profile) {
  if (!pillarId || !profile) return null;
  const fromPriority = profile.priorityPillars?.find(
    (pillar) => pillar.id === pillarId
  );
  if (fromPriority) return fromPriority;
  const fromAlert = profile.alerts?.find((alert) =>
    alert.pillarIds?.includes(pillarId)
  );
  if (!fromAlert) return null;
  return {
    id: pillarId,
    name: PILLARS[pillarId]?.name || pillarId,
    focusArea: fromAlert.focusArea,
    intensity: fromAlert.score > 0.6 ? "Deep" : "Medium",
    summary:
      fromAlert.interpretation ||
      `${fromAlert.label} indicates ${
        fromAlert.severityLabel?.toLowerCase?.() || "elevated"
      } risk.`,
    microActions: (fromAlert.recommendations || [])
      .slice(0, 2)
      .map((text, i) => ({
        id: `${fromAlert.id}-alert-${i}`,
        label: text,
        description: text,
      })),
    alert: fromAlert,
  };
}
