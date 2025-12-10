import { VALID_PILLARS } from "./pillars.js";

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const pearsonCorrelation = (xs, ys) => {
  if (!xs?.length || !ys?.length || xs.length !== ys.length || xs.length < 2) {
    return null;
  }

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = ys.reduce((sum, y) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (!denominator || Number.isNaN(denominator)) return null;

  const coeff = numerator / denominator;
  return Math.max(-1, Math.min(1, Number(coeff.toFixed(3))));
};

const matchScoresByDate = (seriesA = [], seriesB = []) => {
  const mapA = new Map();
  seriesA.forEach(({ date, score }) => {
    if (typeof score === "number") {
      mapA.set(toDateKey(date), score);
    }
  });

  const xs = [];
  const ys = [];
  seriesB.forEach(({ date, score }) => {
    if (typeof score !== "number") return;
    const key = toDateKey(date);
    if (mapA.has(key)) {
      xs.push(mapA.get(key));
      ys.push(score);
    }
  });

  return { xs, ys };
};

export const deriveCorrelationInsights = ({
  checkIns = [],
  habits = [],
  timeframeDays = 30,
} = {}) => {
  const since = new Date();
  since.setDate(since.getDate() - timeframeDays);

  const recentCheckIns = checkIns.filter((c) =>
    c.createdAt ? new Date(c.createdAt) >= since : false
  );

  const sleepSeries = recentCheckIns
    .filter((c) => c.pillar === "sleep")
    .map((c) => ({ date: c.createdAt, score: c.score ?? c.value }));

  const moodSeries = recentCheckIns
    .filter((c) => c.pillar === "mental_health")
    .map((c) => ({ date: c.createdAt, score: c.score ?? c.value }));

  const { xs, ys } = matchScoresByDate(sleepSeries, moodSeries);
  const sleepMoodCorrelation = pearsonCorrelation(xs, ys);

  const pillarAverages = VALID_PILLARS.reduce((acc, pillar) => {
    const entries = recentCheckIns.filter((c) => c.pillar === pillar);
    if (!entries.length) return acc;

    const scores = entries
      .map((c) => (typeof c.score === "number" ? c.score : c.value))
      .filter((v) => typeof v === "number");

    if (!scores.length) return acc;

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    acc[pillar] = {
      average: Number(avg.toFixed(1)),
      checkIns: scores.length,
    };
    return acc;
  }, {});

  const completionRates = habits
    .map((h) => h.completionRate ?? h.progress ?? 0)
    .filter((v) => typeof v === "number");

  const habitMomentum = completionRates.length
    ? Number(
        (
          completionRates.reduce((a, b) => a + b, 0) / completionRates.length
        ).toFixed(2)
      )
    : null;

  return {
    windowStart: since.toISOString(),
    sleepMoodCorrelation,
    pillarAverages,
    habitMomentum,
  };
};

export const formatCorrelationNarrative = (correlations) => {
  if (!correlations) return "";

  const lines = [];
  if (typeof correlations.sleepMoodCorrelation === "number") {
    const strength = Math.abs(correlations.sleepMoodCorrelation);
    const direction =
      correlations.sleepMoodCorrelation >= 0 ? "positive" : "negative";
    lines.push(
      `Sleep ↔ mood correlation: ${direction} (${strength}). Align routines to protect both.`
    );
  }

  const pillars = correlations.pillarAverages || {};
  const weakPillars = Object.entries(pillars)
    .filter(([, data]) => data.average < 6)
    .map(([pillar]) => pillar);
  if (weakPillars.length) {
    lines.push(
      `Watchlist pillars: ${weakPillars.join(
        ", "
      )} are trending below 6/10; prioritize quick wins.`
    );
  }

  if (typeof correlations.habitMomentum === "number") {
    lines.push(
      `Habit momentum: ${(correlations.habitMomentum * 100).toFixed(
        0
      )}% avg completion.`
    );
  }

  return lines.join(" \n");
};

export { pearsonCorrelation };
