const DISCLAIMER_TEXT =
  "NorthStar generated content is AI and non-diagnostic in nature; treat it as friendly guidance rather than a substitute for professional consultation.";

const getTimestamp = () => new Date().toISOString();

const ensureArray = (value) =>
  Array.isArray(value) ? value : value ? [value] : [];

export const applyAiDisclaimer = (payload = {}) => {
  const container =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? { ...payload }
      : { data: payload };

  const existing = ensureArray(container.disclaimers);
  const disclaimer = {
    id: "ai-non-diagnostic",
    text: DISCLAIMER_TEXT,
    timestamp: getTimestamp(),
  };

  container.disclaimers = [...existing, disclaimer];
  return container;
};
