import { QUESTION_BANKS } from "./questionBanks";

const DOMAIN_RECOMMENDATIONS = {
  mental_health: [
    "Log mood daily so NorthStar can spot shifts early.",
    "Schedule grounding activities (breath work, journaling) after stressful events.",
    "Reach out to your care team or local hotline if symptoms escalate.",
  ],
  neurodiversity: [
    "Break tasks into single-focus blocks with protected transitions.",
    "Use routines and visual cues to lower cognitive load.",
    "Share preferred communication styles with close collaborators.",
  ],
  sleep: [
    "Anchor wake and bed times within a 1-hour window.",
    "Build a 30-minute wind-down without screens.",
    "Keep caffeine earlier in the day and track the cutoff in NorthStar.",
  ],
  nutrition: [
    "Prep simple balanced meals ahead of your busiest days.",
    "Pair hydration reminders with existing habits like meetings or commutes.",
    "Add one colorful produce serving to your next meal.",
  ],
  fitness: [
    "Schedule movement as a meeting with yourself—block it on the calendar.",
    "Alternate effort and recovery days to maintain momentum.",
    "Recruit an accountability buddy or coach for your next training block.",
  ],
  relationships: [
    "Book time with someone who energizes you this week.",
    "Share one honest update with a trusted friend to deepen connection.",
    "Explore a community aligned with your current goals or hobbies.",
  ],
};

const DEFAULT_RECOMMENDATIONS = [
  "Share results with your care team if you have one.",
  "Save this snapshot in NorthStar so AI coaches can personalize guidance.",
];

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function pickSeverity(score, bands = []) {
  if (!bands?.length) return null;
  const match = bands.find(({ range }) => {
    const [min, max] = range;
    return score >= min && score <= max;
  });
  return match ? match.label : null;
}

function buildResult(definition, { score, totalPossible, severity }) {
  const percentile = totalPossible
    ? Math.round((score / totalPossible) * 100)
    : null;
  const recs =
    DOMAIN_RECOMMENDATIONS[definition.domain] || DEFAULT_RECOMMENDATIONS;
  const interpretation = severity
    ? `${definition.name} suggests ${severity.toLowerCase()}.`
    : `${definition.name} responses are incomplete.`;
  return {
    id: definition.id,
    name: definition.name,
    domain: definition.domain,
    score,
    totalPossible,
    percentile,
    severity,
    interpretation,
    recommendations: recs,
    completedAt: new Date().toISOString(),
  };
}

function sumResponses(definition, responses) {
  return definition.questions.reduce((total, question) => {
    const value = toNumber(responses[question.id]);
    return total + (value ?? 0);
  }, 0);
}

function defaultLikert(definition, responses) {
  const score = sumResponses(definition, responses);
  const maxOption =
    definition.responseOptions?.[definition.responseOptions.length - 1]
      ?.value ?? 4;
  const totalPossible = definition.questions.length * maxOption;
  const severity = pickSeverity(score, definition.severityBands);
  return buildResult(definition, { score, totalPossible, severity });
}

function scoreAQ10(definition, responses) {
  const score = definition.questions.reduce((total, question) => {
    const value = toNumber(responses[question.id]) ?? 0;
    if (value >= 3) return total + 1; // agree / strongly agree
    if (value === 2) return total + 0.5; // neutral adds light weight
    return total;
  }, 0);
  const totalPossible = definition.questions.length;
  const severity = pickSeverity(score, definition.severityBands);
  return buildResult(definition, { score, totalPossible, severity });
}

const SCORING_RULES = {
  phq9: defaultLikert,
  gad7: defaultLikert,
  adhd: defaultLikert,
  aq10: scoreAQ10,
  sleep_hygiene: defaultLikert,
  diet_quality: defaultLikert,
  exercise_readiness: defaultLikert,
  social_support: defaultLikert,
};

export function scoreAssessment(assessmentId, responses = {}) {
  const definition = QUESTION_BANKS[assessmentId];
  if (!definition) {
    throw new Error(`Unknown assessment: ${assessmentId}`);
  }
  const scorer = SCORING_RULES[assessmentId] || defaultLikert;
  return scorer(definition, responses);
}

export function scoreAllAssessments(allResponses = {}) {
  return Object.entries(QUESTION_BANKS).reduce((acc, [id]) => {
    const responses = allResponses[id] || {};
    acc[id] = scoreAssessment(id, responses);
    return acc;
  }, {});
}
