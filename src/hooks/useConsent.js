/**
 * useConsent Hook
 * 
 * Manages AI consent state and provides methods to check/update consent.
 * Reads from localStorage and backend.
 */

import { useState, useEffect } from 'react'

const CONSENT_STORAGE_KEY = 'aiConsent'

/**
 * Hook to manage AI data usage consent
 * 
 * @returns {Object} Consent state and methods
 *   - hasConsent: boolean - Whether user has given AI consent
 *   - isLoading: boolean - Loading state while fetching from backend
 *   - consentData: object - Full consent data { aiConsent, consentTimestamp, etc. }
 *   - giveConsent: function - Save consent to localStorage and backend
 *   - revokeConsent: function - Revoke consent
 *   - checkConsent: function - Check current consent status
 */
export function useConsent() {
  const [hasConsent, setHasConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [consentData, setConsentData] = useState(null)

  // Check consent on mount
  useEffect(() => {
    checkConsent()
  }, [])

  const checkConsent = () => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        setConsentData(data)
        setHasConsent(data.aiConsent === true)
      } else {
        setHasConsent(false)
        setConsentData(null)
      }
    } catch (error) {
      console.error('Error checking consent:', error)
      setHasConsent(false)
    } finally {
      setIsLoading(false)
    }
  }

  const giveConsent = async () => {
    setIsLoading(true)
    try {
      const consentInfo = {
        aiConsent: true,
        consentTimestamp: new Date().toISOString(),
        consentVersion: '1.0'
      }

      // Save locally first
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentInfo))
      setConsentData(consentInfo)
      setHasConsent(true)

      // Sync to backend
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('jwt')
        await fetch('/api/user/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify(consentInfo)
        })
      } catch (error) {
        console.warn('Could not sync consent to backend:', error)
        // Continue - localStorage is sufficient
      }
    } finally {
      setIsLoading(false)
    }
  }

  const revokeConsent = async () => {
    setIsLoading(true)
    try {
      const consentInfo = {
        aiConsent: false,
        consentTimestamp: new Date().toISOString(),
        consentVersion: '1.0'
      }

      // Save locally
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentInfo))
      setConsentData(consentInfo)
      setHasConsent(false)

      // Sync to backend
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('jwt')
        await fetch('/api/user/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify(consentInfo)
        })
      } catch (error) {
        console.warn('Could not sync consent revocation to backend:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    hasConsent,
    isLoading,
    consentData,
    giveConsent,
    revokeConsent,
    checkConsent
  }
}

export default useConsent
