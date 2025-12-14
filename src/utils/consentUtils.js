/**
 * Consent Utilities
 *
 * Helper functions to check and enforce AI consent for users.
 * Can be used to gate AI features or log operations.
 */

const IS_DEV = import.meta.env.DEV;

/**
 * Check if user has given AI consent
 * Reads from localStorage first, falls back to backend check
 *
 * @returns {boolean} Whether user has given AI consent
 */
export function hasAIConsent() {
  try {
    const consent = localStorage.getItem("aiConsent");
    if (consent) {
      const data = JSON.parse(consent);
      return data.aiConsent === true;
    }
  } catch (error) {
    console.warn("Error checking consent from localStorage:", error);
  }
  return false;
}

/**
 * Get full consent data from localStorage
 *
 * @returns {object|null} Consent object with aiConsent, consentTimestamp, consentVersion
 */
export function getConsentData() {
  try {
    const consent = localStorage.getItem("aiConsent");
    if (consent) {
      return JSON.parse(consent);
    }
  } catch (error) {
    console.warn("Error reading consent data:", error);
  }
  return null;
}

/**
 * Check if user consent is still valid
 * Consent is considered valid if given and version is current
 *
 * @returns {boolean} Whether consent is valid
 */
export function isConsentValid() {
  const consent = getConsentData();
  if (!consent || !consent.aiConsent) {
    return false;
  }

  const CURRENT_VERSION = "1.0";
  if (consent.consentVersion !== CURRENT_VERSION) {
    console.warn(
      "Consent version is outdated. Current:",
      CURRENT_VERSION,
      "User:",
      consent.consentVersion
    );
    return false;
  }

  return true;
}

/**
 * Guard function to check consent before AI operation
 * Can be used to prevent AI operations without consent
 *
 * @param {string} operation - Name of the AI operation (e.g., 'sendMessage', 'createPlan')
 * @returns {object} Result with { allowed: boolean, reason?: string }
 */
export function checkAIOperationConsent(operation = "unknown") {
  if (!hasAIConsent()) {
    return {
      allowed: false,
      reason: "User has not consented to AI features",
    };
  }

  if (!isConsentValid()) {
    return {
      allowed: false,
      reason: "User consent has expired or is invalid",
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Log an AI operation if consent is given
 * Used to track and audit AI feature usage
 *
 * @param {string} operation - Name of the operation
 * @param {object} data - Optional operation data to log
 */
export function logAIOperation(operation, data = {}) {
  if (!hasAIConsent()) {
    console.warn(`AI operation '${operation}' attempted without consent`);
    return false;
  }

  const timestamp = new Date().toISOString();
  const consentData = getConsentData();

  const log = {
    timestamp,
    operation,
    consentedAt: consentData?.consentTimestamp,
    consentVersion: consentData?.consentVersion,
    data,
  };

  // Log to console in development
  if (IS_DEV) {
    console.debug("AI Operation Log:", log);
  }

  // Could be sent to analytics/logging service here

  return true;
}

/**
 * Format consent timestamp for display
 *
 * @param {string|Date} timestamp - Consent timestamp
 * @returns {string} Formatted timestamp (e.g., "December 3, 2025")
 */
export function formatConsentTimestamp(timestamp) {
  if (!timestamp) return "Never";

  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid date";
  }
}

/**
 * Request backend to fetch current consent status
 * Syncs localStorage with backend state
 *
 * @returns {Promise<object>} Current consent status from backend
 */
export async function syncConsentFromBackend() {
  try {
    const response = await fetch("/api/user/consent", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.warn("Could not fetch consent from backend:", response.status);
      return null;
    }

    const result = await response.json();
    if (result.success && result.data) {
      // Update localStorage to match backend
      localStorage.setItem(
        "aiConsent",
        JSON.stringify({
          aiConsent: result.data.aiConsent,
          consentTimestamp: result.data.consentTimestamp,
          consentVersion: result.data.consentVersion,
        })
      );
      return result.data;
    }
  } catch (error) {
    console.warn("Error syncing consent from backend:", error);
  }

  return null;
}

export default {
  hasAIConsent,
  getConsentData,
  isConsentValid,
  checkAIOperationConsent,
  logAIOperation,
  formatConsentTimestamp,
  syncConsentFromBackend,
};
