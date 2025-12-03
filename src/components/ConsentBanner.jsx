/**
 * Consent Banner Component
 * 
 * Displays AI data usage consent to users on first app load.
 * Stores consent in localStorage and sends to backend for tracking.
 */

import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ConsentBanner({ onConsentGiven, onDismiss }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const handleAcceptConsent = async () => {
    setIsLoading(true)
    try {
      // Store consent in localStorage
      const consentData = {
        aiConsent: true,
        consentTimestamp: new Date().toISOString(),
        consentVersion: '1.0'
      }
      localStorage.setItem('aiConsent', JSON.stringify(consentData))

      // Send to backend to track in user record
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('jwt')
        const response = await fetch('/api/user/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include',
          body: JSON.stringify(consentData)
        })

        if (!response.ok) {
          console.warn('Failed to save consent to backend:', response.status)
          // Continue anyway - localStorage is sufficient fallback
        }
      } catch (error) {
        console.warn('Could not reach backend for consent tracking:', error)
        // Continue anyway - localStorage consent is still valid
      }

      toast.success('Thank you! Your preferences have been saved.', {
        icon: '✓',
        duration: 3000
      })

      // Notify parent
      if (onConsentGiven) {
        onConsentGiven()
      }

      setIsDismissed(true)
    } catch (error) {
      console.error('Error saving consent:', error)
      toast.error('Failed to save preferences. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss()
    }
    setIsDismissed(true)
  }

  if (isDismissed) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800 border-t border-blue-500/30 shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-4 items-start justify-between">
          {/* Left: Content */}
          <div className="flex gap-3 flex-1">
            <AlertCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">
                AI-Powered Personalization
              </h3>
              <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                NorthStar uses AI to create personalized plans, goals, and insights based on your 
                data. This helps us provide more relevant coaching and recommendations. Your data 
                is never shared with third parties.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <a 
                  href="/privacy" 
                  className="hover:text-blue-400 underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                <a 
                  href="/terms" 
                  className="hover:text-blue-400 underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>
                <a 
                  href="/data-usage" 
                  className="hover:text-blue-400 underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  How We Use Data
                </a>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex gap-2 flex-shrink-0 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              disabled={isLoading}
              className="border-slate-600 hover:border-slate-500 hover:bg-slate-800"
            >
              <X className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptConsent}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-blue-200 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  I Understand
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
