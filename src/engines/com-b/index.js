const DEFAULT_SCORES = {
  motivation: 58,
  opportunity: 55,
  capability: 57,
};

const MICRO_ACTION_LIBRARY = {
  motivation: [
    {
      label: "Reconnect to your why",
      description:
        "Write down one sentence on why {pillar} matters for the person you want to become.",
      rationale: "Reaffirming purpose raises intrinsic motivation.",
    },
    {
      label: "Visualize the win",
      description:
        "Spend two minutes imagining how life feels once {pillar} is thriving.",
      rationale: "Visualization turns abstract goals into near-term energy.",
    },
    {
      label: "Set a micro-celebration",
      description:
        "Pick a tiny reward for completing the next {pillar} habit today.",
      rationale: "Celebrations reinforce the motivational loop.",
    },
  ],
  opportunity: [
    {
      label: "Design the environment",
      description:
        "Place a visible cue (sticky note, alarm, laid-out gear) that nudges your next {pillar} action.",
      rationale: "Environmental cues reduce reliance on willpower.",
    },
    {
      label: "Ask for a quick assist",
      description:
        "Message someone in your circle to hold you accountable for one {pillar} action this week.",
      rationale: "Social opportunity boosts follow-through.",
    },
    {
      label: "Schedule a protected block",
      description:
        "Block 20 distraction-free minutes for {pillar} on your calendar today.",
      rationale: "Time-boxing creates practical space for action.",
    },
  ],
  capability: [
    {
      label: "Shrink the next action",
      description:
        "Break your next {pillar} habit into the smallest possible first step.",
      rationale: "Reducing difficulty makes capability feel attainable.",
    },
    {
      label: "Collect a quick win",
      description:
        "Repeat a skill you already know inside {pillar} to rebuild confidence.",
      rationale: "Proof of competence lifts perceived capability.",
    },
    {
      label: "Learn a micro-technique",
      description:
        "Watch or read one short resource that upgrades how you approach {pillar}.",
      rationale: "Micro learning compounds skill over time.",
    },
  ],
};

const AREA_MESSAGES = {
  motivation:
    "Energy and excitement dipped. Reconnecting to purpose keeps this pillar from stalling.",
  opportunity:
    "Environment or support gaps are blocking momentum. Create lighter friction to act.",
  capability:
    "Confidence in the skills behind this pillar is shaky. Stack simple reps to rebuild trust.",
};

const MAX_ACTIONS = 4;

function clampScore(value, fallback = 60) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, numeric));
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeScores(config) {
  return {
    motivation: clampScore(
      config.motivation ?? config.scores?.motivation,
      DEFAULT_SCORES.motivation
    ),
    opportunity: clampScore(
      config.opportunity ?? config.scores?.opportunity,
      DEFAULT_SCORES.opportunity
    ),
    capability: clampScore(
      config.capability ?? config.scores?.capability,
      DEFAULT_SCORES.capability
    ),
  };
}

function sanitizePillarMetrics(metrics = []) {
  if (!Array.isArray(metrics)) return [];
  return metrics
    .map((metric) => {
      if (!metric || !metric.id) return null;
      const trend = toNumber(metric.trend);
      const lastEntryDays = toNumber(metric.lastEntryDays);
      const habitConsistency = toNumber(metric.habitConsistency);
      return {
        id: metric.id,
        name: metric.name || metric.label || metric.id,
        score: clampScore(metric.score, 50),
        trend: trend ?? 0,
        trendLabel: metric.trendLabel || null,
        lastEntryDays:
          lastEntryDays === null
            ? null
            : Math.max(0, Math.min(365, lastEntryDays)),
        habitConsistency:
          habitConsistency === null
            ? null
            : Math.max(0, Math.min(100, habitConsistency)),
        blockers: Array.isArray(metric.blockers) ? metric.blockers : [],
        focus: metric.focus || null,
      };
    })
    .filter(Boolean);
}

function calculateDeficits(scores) {
  return {
    motivation: Number((1 - scores.motivation / 100).toFixed(2)),
    opportunity: Number((1 - scores.opportunity / 100).toFixed(2)),
    capability: Number((1 - scores.capability / 100).toFixed(2)),
  };
}

function rankPillars(pillarMetrics) {
  return pillarMetrics
    .map((pillar) => {
      const lowScorePressure = (100 - pillar.score) * 0.6;
      const habitDrag = pillar.habitConsistency
        ? (100 - pillar.habitConsistency) * 0.25
        : 0;
      const gapPenalty = pillar.lastEntryDays
        ? Math.min(30, pillar.lastEntryDays) * 0.5
        : 0;
      const risk = lowScorePressure + habitDrag + gapPenalty;
      return { ...pillar, risk: Number(risk.toFixed(1)) };
    })
    .sort((a, b) => b.risk - a.risk);
}

function pickFocusArea(deficits) {
  return Object.entries(deficits)
    .sort((a, b) => b[1] - a[1])
    .map(([area]) => area)[0];
}

function buildConstraints(pillar, deficits) {
  const constraints = [];
  if (pillar.lastEntryDays && pillar.lastEntryDays > 4) {
    constraints.push({
      id: `${pillar.id}-logging`,
      label: "Logging gap",
      description: `No log in ${pillar.lastEntryDays} days for ${pillar.name}.`,
    });
  }
  if (pillar.habitConsistency !== null && pillar.habitConsistency < 60) {
    constraints.push({
      id: `${pillar.id}-consistency`,
      label: "Habit consistency",
      description: `${pillar.name} habits averaged ${pillar.habitConsistency}%.`,
    });
  }
  Object.entries(deficits)
    .filter(([, value]) => value > 0.25)
    .forEach(([area, value]) => {
      constraints.push({
        id: `${pillar.id}-${area}`,
        label: `${area.charAt(0).toUpperCase() + area.slice(1)} gap`,
        description: `${Math.round(value * 100)}% deficit detected in ${area}.`,
      });
    });
  return constraints.slice(0, 4);
}

function personalize(template, pillarName) {
  return template.replace(/{pillar}/g, pillarName || "this pillar");
}

function selectMicroActions(area, pillarName, limit = 2) {
  return (MICRO_ACTION_LIBRARY[area] || [])
    .slice(0, limit)
    .map((template, index) => ({
      id: `${area}-micro-${index}`,
      label: personalize(template.label, pillarName),
      description: personalize(template.description, pillarName),
      rationale: template.rationale,
    }));
}

function buildAction(pillar, area, severity) {
  const intensity =
    severity > 0.45 ? "Deep" : severity > 0.25 ? "Medium" : "Light";
  const microActions = selectMicroActions(area, pillar.name, 3);
  return {
    id: `${pillar.id}-${area}`,
    pillarId: pillar.id,
    focusArea: area,
    label: `${pillar.name || pillar.id}: boost ${area}`,
    description: personalize(
      AREA_MESSAGES[area] || "Apply a small improvement inside {pillar}.",
      pillar.name
    ),
    rationale: AREA_MESSAGES[area],
    intensity,
    microActions,
  };
}

export function createComBInput(config = {}) {
  const scores = normalizeScores(config);
  const pillarMetrics = sanitizePillarMetrics(config.pillarMetrics || []);
  return {
    scores,
    pillarMetrics,
    focusPillarId: config.focusPillarId || pillarMetrics[0]?.id || null,
  };
}

export function computeComBRecommendations(input, options = {}) {
  const sanitized = {
    scores: normalizeScores(input),
    pillarMetrics: sanitizePillarMetrics(input.pillarMetrics),
    focusPillarId: input.focusPillarId || input.pillarMetrics?.[0]?.id || null,
  };

  if (!sanitized.pillarMetrics.length) {
    return {
      primaryFocus: null,
      recommendedActions: [],
      deficits: calculateDeficits(sanitized.scores),
      constraints: [],
    };
  }

  const deficits = calculateDeficits(sanitized.scores);
  const orderedPillars = rankPillars(sanitized.pillarMetrics);
  const deficitOrder = Object.entries(deficits)
    .sort((a, b) => b[1] - a[1])
    .map(([area]) => area);
  const limit = Math.max(
    1,
    Math.min(options.limit || MAX_ACTIONS, MAX_ACTIONS)
  );

  const recommendedActions = orderedPillars
    .slice(0, limit)
    .map((pillar, index) => {
      const area = deficitOrder[index % deficitOrder.length] || deficitOrder[0];
      const severity = deficits[area] || 0;
      return buildAction(pillar, area, severity);
    });

  const focusPillar =
    orderedPillars.find((p) => p.id === sanitized.focusPillarId) ||
    orderedPillars[0];
  const focusArea = pickFocusArea(deficits);
  const constraints = buildConstraints(focusPillar, deficits);

  return {
    primaryFocus: {
      pillarId: focusPillar.id,
      pillarName: focusPillar.name,
      focusArea,
      reasoning:
        focusPillar.trendLabel ||
        `Biggest gap right now is ${focusArea}. Direct attention to ${focusPillar.name}.`,
      microActions: recommendedActions[0]?.microActions || [],
      constraints,
    },
    recommendedActions,
    deficits,
    constraints,
  };
}
