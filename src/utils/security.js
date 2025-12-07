const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

const escapeRegex = /[&<>"'`]/g;
const TAG_STRIP_REGEX = /<[^>]*>/g;

export function escapeHTML(input) {
  if (input == null) {
    return "";
  }
  const value = typeof input === "string" ? input : String(input);
  return value.replace(escapeRegex, (char) => HTML_ESCAPE_MAP[char] || char);
}

export function sanitizeText(input, fallback = "") {
  if (input == null || input === undefined) {
    return fallback;
  }
  const raw = typeof input === "string" ? input : String(input);
  const stripped = raw.replace(TAG_STRIP_REGEX, "");
  return escapeHTML(stripped);
}

export function sanitizeRecord(record) {
  if (!record || typeof record !== "object") {
    return record;
  }
  if (Array.isArray(record)) {
    return record.map((item) => sanitizeRecord(item));
  }
  const result = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") {
      result[key] = sanitizeText(value);
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeRecord(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
