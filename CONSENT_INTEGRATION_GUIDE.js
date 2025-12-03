/**
 * AI Consent Guards - Quick Integration Guide
 * 
 * Use these patterns to check consent before AI operations
 */

// ============================================================================
// PATTERN 1: Check Consent Before Calling AI Function
// ============================================================================

// In src/api/aiClient.js or any component using AI:

import { checkAIOperationConsent, logAIOperation } from '@/utils/consentUtils'

export async function sendToOrchestrator(prompt, context = {}) {
  // Check consent before making API call
  const consentCheck = checkAIOperationConsent('sendToOrchestrator')
  
  if (!consentCheck.allowed) {
    console.warn(consentCheck.reason)
    // Optionally throw error or show toast
    throw new Error(consentCheck.reason)
  }

  // Log the operation (if consent is valid)
  logAIOperation('sendToOrchestrator', { prompt: prompt.substring(0, 50) })

  // Make the API call
  const response = await fetch(/* ... */)
  return response
}

// ============================================================================
// PATTERN 2: Gate Component Behind Consent Check
// ============================================================================

// In React components:

import { useConsent } from '@/hooks/useConsent'
import { hasAIConsent } from '@/utils/consentUtils'

function AIFeatureComponent() {
  const { hasConsent, isLoading } = useConsent()

  if (isLoading) {
    return <div>Checking consent...</div>
  }

  if (!hasConsent) {
    return (
      <div className="alert alert-warning">
        This feature requires AI consent. Please enable it in settings.
      </div>
    )
  }

  return (
    <div>
      {/* AI-powered content here */}
    </div>
  )
}

// ============================================================================
// PATTERN 3: Show Consent Required Before Operation
// ============================================================================

// For operations that require explicit consent:

import { hasAIConsent } from '@/utils/consentUtils'

function triggerAIOperation() {
  if (!hasAIConsent()) {
    // Show modal asking user to enable consent
    showConsentModal({
      title: 'AI Features Disabled',
      message: 'Enable AI features to use this capability',
      onEnable: () => {
        // User will see ConsentBanner or settings to enable
      }
    })
    return
  }

  // Proceed with operation
  performAIOperation()
}

// ============================================================================
// PATTERN 4: Log All AI Operations for Audit Trail
// ============================================================================

// In middleware or API interceptors:

import { logAIOperation } from '@/utils/consentUtils'

const aiAPIInterceptor = (request) => {
  if (isAIEndpoint(request.url)) {
    logAIOperation(request.method, {
      endpoint: request.url,
      timestamp: new Date().toISOString()
    })
  }
  return request
}

// ============================================================================
// PATTERN 5: Check Consent Before Saving Sensitive Data
// ============================================================================

// When saving personal information (journals, deep logs, etc.):

import { hasAIConsent } from '@/utils/consentUtils'

export async function saveJournalEntry(content) {
  if (!hasAIConsent()) {
    return {
      success: false,
      message: 'Journal AI features require consent',
      saved: false
    }
  }

  // Save with AI processing
  const result = await fetch('/api/entries', {
    method: 'POST',
    body: JSON.stringify({ content, processWithAI: true })
  })

  return result.json()
}

// ============================================================================
// FUNCTIONS AVAILABLE IN consentUtils.js
// ============================================================================

/*
hasAIConsent() 
  - Returns boolean
  - Check if user has given AI consent
  - Reads from localStorage

getConsentData()
  - Returns { aiConsent, consentTimestamp, consentVersion } or null
  - Get full consent data

isConsentValid()
  - Returns boolean
  - Check if consent is still valid and not outdated

checkAIOperationConsent(operation)
  - Returns { allowed: boolean, reason?: string }
  - Guard function for before AI operations

logAIOperation(operation, data)
  - Returns boolean (was logged or not)
  - Log AI operation if consent given

formatConsentTimestamp(timestamp)
  - Returns formatted string like "December 3, 2025"
  - Display consent timestamp to user

syncConsentFromBackend()
  - Returns Promise<object> or null
  - Fetch and update consent from backend
  - Useful on app startup or after settings change
*/

// ============================================================================
// IMPLEMENTATION CHECKLIST
// ============================================================================

/*
□ Import consentUtils in files that call AI APIs
□ Add checkAIOperationConsent() before sensitive AI operations
□ Add logAIOperation() to audit trail for compliance
□ Gate AI-powered components with hasAIConsent() check
□ Show ConsentBanner/warning if user tries to use AI without consent
□ Test consent flow: enable → disable → re-enable
□ Verify logs are recorded only when consent is given
□ Add consent revocation to Settings page
□ Update onboarding to explain AI features
□ Consider requiring re-consent if AI features change
*/

export default {
  PATTERN_1_CHECK_BEFORE_CALL: 'Use checkAIOperationConsent() before AI API calls',
  PATTERN_2_GATE_COMPONENT: 'Use hasAIConsent() in component render logic',
  PATTERN_3_SHOW_REQUIRED: 'Show consent modal if user attempts AI operation without consent',
  PATTERN_4_LOG_OPERATIONS: 'Use logAIOperation() to audit AI feature usage',
  PATTERN_5_SENSITIVE_DATA: 'Skip AI processing for sensitive data if no consent'
}
