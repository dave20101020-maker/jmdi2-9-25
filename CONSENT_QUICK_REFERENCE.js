/**
 * CONSENT PHASE 3 - QUICK REFERENCE CARD
 * 
 * Everything you need to know to use the consent system
 */

// ============================================================================
// 1. USER PERSPECTIVE
// ============================================================================

/*
WHAT USERS SEE:
1. App loads → ConsentBanner appears at bottom
2. Banner says: "NorthStar uses AI to create personalized plans..."
3. Two buttons: "Dismiss" (hide) or "I Understand" (consent)
4. User clicks "I Understand"
5. "Successfully saved your preferences" toast shows
6. Banner disappears
7. Reload page → banner doesn't show (consent remembered)

HOW TO REVOKE CONSENT:
- Future: Settings page will have "Disable AI Features" option
- For now: Clear localStorage key 'aiConsent' to reset
*/

// ============================================================================
// 2. STORAGE LOCATIONS
// ============================================================================

// FRONTEND - localStorage
{
  "aiConsent": {
    "aiConsent": true,
    "consentTimestamp": "2025-12-03T10:30:00.000Z",
    "consentVersion": "1.0"
  }
}

// BACKEND - MongoDB User document
{
  _id: ObjectId("..."),
  email: "user@example.com",
  aiConsent: true,
  consentTimestamp: ISODate("2025-12-03T10:30:00.000Z"),
  consentVersion: "1.0",
  // ... other fields
}

// ============================================================================
// 3. FRONTEND FILES & THEIR PURPOSE
// ============================================================================

/*
File: src/components/ConsentBanner.jsx (160 lines)
├─ What: The banner UI users see at app startup
├─ When: Renders if user hasn't given consent yet
├─ Shows: "I Understand" button → saves consent
├─ Saves to: localStorage + /api/user/consent (background)
└─ Success: Shows toast, calls onConsentGiven() to hide banner

File: src/hooks/useConsent.js (131 lines)
├─ What: React hook for managing consent state
├─ Call: const { hasConsent, isLoading, consentData, giveConsent, revokeConsent } = useConsent()
├─ Returns:
│  ├─ hasConsent: boolean (user gave consent?)
│  ├─ isLoading: boolean (fetching from backend?)
│  ├─ consentData: object (full consent data)
│  ├─ giveConsent(): Promise (save consent)
│  └─ revokeConsent(): Promise (remove consent)
└─ Usage: Called in App.jsx to show/hide ConsentBanner

File: src/utils/consentUtils.js (195 lines)
├─ What: Utility functions for consent checks
├─ Functions:
│  ├─ hasAIConsent() → boolean
│  ├─ getConsentData() → object | null
│  ├─ isConsentValid() → boolean (not outdated)
│  ├─ checkAIOperationConsent(operation) → { allowed, reason }
│  ├─ logAIOperation(operation, data) → boolean
│  ├─ formatConsentTimestamp(date) → "December 3, 2025"
│  └─ syncConsentFromBackend() → Promise<object>
└─ Usage: Gate AI operations, check consent, log for audit
*/

// ============================================================================
// 4. BACKEND ENDPOINTS
// ============================================================================

/*
GET /api/user/consent
├─ Auth: Required (JWT token)
├─ Returns: { success: true, data: { aiConsent, consentTimestamp, consentVersion } }
└─ Usage: Fetch user's current consent status

POST /api/user/consent
├─ Auth: Required (JWT token)
├─ Body: { aiConsent: true/false, consentTimestamp?, consentVersion? }
├─ Returns: { success: true, data: { aiConsent, consentTimestamp, consentVersion } }
└─ Usage: Update user's consent status
*/

// ============================================================================
// 5. INTEGRATION PATTERNS
// ============================================================================

// Pattern A: Show banner only if no consent
import ConsentBanner from '@/components/ConsentBanner'
import { useConsent } from '@/hooks/useConsent'

function AppContent() {
  const { hasConsent, isLoading } = useConsent()
  const [showBanner, setShowBanner] = useState(!hasConsent)

  if (showBanner && !isLoading) {
    return <ConsentBanner onConsentGiven={() => setShowBanner(false)} />
  }

  return <Routes>...</Routes>
}

// Pattern B: Check consent before AI operation
import { checkAIOperationConsent, logAIOperation } from '@/utils/consentUtils'

async function callAIFeature(data) {
  const check = checkAIOperationConsent('callAIFeature')
  if (!check.allowed) {
    console.warn(check.reason)
    return // or throw error
  }

  logAIOperation('callAIFeature', { /* data */ })
  // Make API call...
}

// Pattern C: Gate AI-powered component
import { hasAIConsent } from '@/utils/consentUtils'

function AIFeature() {
  if (!hasAIConsent()) {
    return <Alert>Enable AI features to use this</Alert>
  }

  return <AIComponent />
}

// ============================================================================
// 6. CONSENT FLOW TIMELINE
// ============================================================================

/*
FLOW: User First Visit
T=0s     App loads
T=0.1s   useConsent() checks localStorage
T=0.2s   localStorage empty → hasConsent = false
T=0.3s   ConsentBanner renders
T=0.5s   "User sees banner and explanation"
T=5s     User clicks "I Understand"
T=5.1s   localStorage updated: aiConsent: true
T=5.2s   POST /api/user/consent sent (background)
T=5.3s   handleConsentGiven() → setShowBanner(false)
T=5.4s   Banner disappears from UI
T=5.5s   Backend updates User.aiConsent = true
T=6s     User can use AI features
T=∞      Page reload → localStorage has aiConsent → banner doesn't show

FLOW: User With Existing Consent
T=0s     App loads
T=0.1s   useConsent() checks localStorage
T=0.2s   localStorage has 'aiConsent' → hasConsent = true
T=0.3s   ConsentBanner doesn't render
T=0.4s   App shows normally
T=∞      User can use AI features immediately
*/

// ============================================================================
// 7. ERROR HANDLING
// ============================================================================

/*
BACKEND UNAVAILABLE:
- localStorage consent still valid (primary storage)
- No POST to /api/user/consent succeeds
- Frontend shows warning in console
- App continues with localStorage consent
- User can still use AI features

localStorage CLEARED:
- User visits with cleared storage
- ConsentBanner shows again
- User clicks "I Understand"
- localStorage and backend both updated
- Consent flow repeats

INVALID JWT TOKEN:
- /api/user/consent returns 401
- localStorage consent still used as fallback
- User should log in again if needed
- AI features work with localStorage consent
*/

// ============================================================================
// 8. TESTING CHECKLIST
// ============================================================================

/*
□ Fresh Browser
  □ ConsentBanner visible on first load
  □ Banner has proper styling and links
  □ "I Understand" button saves consent

□ localStorage
  □ Key 'aiConsent' created with correct structure
  □ consentVersion = '1.0'
  □ consentTimestamp = ISO format
  □ aiConsent = true

□ Backend
  □ POST /api/user/consent returns success
  □ GET /api/user/consent returns consent data
  □ User.aiConsent field updated in database

□ Persistence
  □ Page reload → banner doesn't show
  □ Separate browser tab → banner doesn't show
  □ Private browsing window → banner shows

□ useConsent Hook
  □ hasConsent = true after "I Understand"
  □ getConsentData() returns full object
  □ giveConsent() works
  □ revokeConsent() works

□ Consent Utilities
  □ hasAIConsent() returns true/false correctly
  □ checkAIOperationConsent() guards operations
  □ logAIOperation() records operations
  □ isConsentValid() checks version
*/

// ============================================================================
// 9. FILES SUMMARY
// ============================================================================

/*
CREATED (Phase 3):
✅ src/components/ConsentBanner.jsx     (160 lines) - UI component
✅ src/hooks/useConsent.js              (131 lines) - State hook
✅ src/utils/consentUtils.js            (195 lines) - Utility functions
✅ CONSENT_INTEGRATION_GUIDE.js          (192 lines) - Implementation guide
✅ PHASE_13_CONSENT_COMPLETE.md         (469 lines) - Full documentation

MODIFIED (Phase 3):
✅ src/App.jsx                          (added ConsentBanner integration)
✅ backend/models/User.js               (added 3 consent fields)
✅ backend/controllers/userController.js (added 2 functions)
✅ backend/routes/userRoutes.js         (added 2 routes)

PREVIOUS PHASES:
✅ Rate Limiting (Phase 1)
✅ API Centralization (Phase 2)

TOTAL ADDED THIS PHASE: ~1,200 lines
*/

// ============================================================================
// 10. QUICK COMMANDS
// ============================================================================

/*
Reset consent (testing):
  localStorage.removeItem('aiConsent')

Check consent:
  localStorage.getItem('aiConsent')

Check user in browser:
  JSON.parse(localStorage.getItem('aiConsent'))

Call consent check:
  import { hasAIConsent } from '@/utils/consentUtils'
  hasAIConsent() // true or false

Sync with backend:
  import { syncConsentFromBackend } from '@/utils/consentUtils'
  await syncConsentFromBackend()

Log operation:
  import { logAIOperation } from '@/utils/consentUtils'
  logAIOperation('operationName', { data })
*/

// ============================================================================
// 11. RELATED DOCUMENTATION
// ============================================================================

/*
Read These Files:
1. PHASE_13_CONSENT_COMPLETE.md     - Full feature documentation
2. CONSENT_INTEGRATION_GUIDE.js     - Implementation patterns
3. src/components/ConsentBanner.jsx - UI code and comments
4. src/hooks/useConsent.js          - Hook implementation details
5. src/utils/consentUtils.js        - Utility function documentation

Related Previous Phases:
- Phase 1: RATE_LIMITING_GUIDE.js   - Cost protection
- Phase 2: API_CENTRALIZATION_GUIDE.md - Centralized APIs
*/

export default {
  STATUS: "✅ COMPLETE",
  PHASE: 3,
  COMPONENTS: 1,
  HOOKS: 1,
  UTILITIES: 1,
  BACKEND_FIELDS: 3,
  BACKEND_ENDPOINTS: 2,
  TOTAL_LINES: 1200,
  COMPLETION_DATE: "December 3, 2025"
}
