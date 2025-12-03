/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Usage Consent Popups
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Legal consent management for AI features with privacy & terms acceptance
 */

// src/consent/AIConsentManager.js
import React, { useState, useEffect } from 'react';
import { AccessibleModal, AccessibleButton } from '../accessibility/wcagCompliance';

const CONSENT_KEY = 'ai_usage_consent';
const CONSENT_VERSION = '1.0';
const CONSENT_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * AI Consent Manager - Handles user consent for AI features
 */
export class AIConsentManager {
  /**
   * Get current consent status
   */
  static getConsent() {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored);
    const isExpired = Date.now() - consent.timestamp > CONSENT_EXPIRY;

    return isExpired ? null : consent;
  }

  /**
   * Save user consent
   */
  static saveConsent(consents) {
    const consentData = {
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      aiFeatures: consents.aiFeatures || false,
      dataProcessing: consents.dataProcessing || false,
      privacyAccepted: consents.privacyAccepted || false,
      termsAccepted: consents.termsAccepted || false,
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    // Notify backend
    this.sendConsentToBackend(consentData);
  }

  /**
   * Check if specific AI feature is enabled
   */
  static isFeatureEnabled(feature) {
    const consent = this.getConsent();
    if (!consent) return false;

    const featureMap = {
      personalization: consent.aiFeatures,
      toneProfiler: consent.aiFeatures,
      voiceInput: consent.dataProcessing,
      meditation: consent.aiFeatures,
      exercises: consent.aiFeatures,
      recipes: consent.aiFeatures,
      spending: consent.dataProcessing,
      leaderboard: consent.dataProcessing,
      relationships: consent.aiFeatures,
      memoryBackup: consent.dataProcessing,
    };

    return featureMap[feature] || false;
  }

  /**
   * Withdraw consent
   */
  static withdrawConsent() {
    localStorage.removeItem(CONSENT_KEY);
    // Notify backend
    fetch('/api/consent/withdraw', { method: 'POST' }).catch(console.error);
  }

  /**
   * Send consent to backend
   */
  static async sendConsentToBackend(consentData) {
    try {
      await fetch('/api/consent/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consentData),
      });
    } catch (error) {
      console.error('Failed to save consent:', error);
    }
  }

  /**
   * Check if consent needs renewal
   */
  static needsRenewal() {
    const consent = this.getConsent();
    if (!consent) return true;
    return consent.version !== CONSENT_VERSION;
  }
}

/**
 * AI Consent Modal Component
 */
export const AIConsentModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [consents, setConsents] = useState({
    aiFeatures: false,
    dataProcessing: false,
    privacyAccepted: false,
    termsAccepted: false,
  });

  const isComplete = Object.values(consents).every((v) => v === true);

  const handleConsent = (field) => {
    setConsents((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleAccept = () => {
    if (isComplete) {
      AIConsentManager.saveConsent(consents);
      onClose();
    }
  };

  const handleDecline = () => {
    setConsents({
      aiFeatures: false,
      dataProcessing: false,
      privacyAccepted: false,
      termsAccepted: false,
    });
    onClose();
  };

  return (
    <AccessibleModal isOpen={isOpen} onClose={handleDecline} title="AI Features Consent">
      <div className="space-y-6">
        {step === 1 && (
          <>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">
                  🤖 AI-Powered Features
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  NorthStar uses AI to provide personalized recommendations, analyze your
                  patterns, and help you achieve your goals more effectively.
                </p>

                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={consents.aiFeatures}
                    onChange={() => handleConsent('aiFeatures')}
                    aria-label="Enable AI features"
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to AI-powered personalization (tone profiler, habit recommendations,
                    meditation guidance)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consents.dataProcessing}
                    onChange={() => handleConsent('dataProcessing')}
                    aria-label="Allow data processing for AI"
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to data processing for voice input, spending analysis, and
                    advanced features
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Next: Review Policies
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {/* Privacy Policy Section */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">📋 Privacy Policy</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Your data is encrypted end-to-end. We use your information only to improve
                  your experience. We never sell or share your personal data with third parties.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 mb-3">
                  <li>✓ End-to-end encryption for all data</li>
                  <li>✓ GDPR and CCPA compliant</li>
                  <li>✓ Regular security audits</li>
                  <li>✓ Data deletion on account removal</li>
                </ul>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consents.privacyAccepted}
                    onChange={() => handleConsent('privacyAccepted')}
                    aria-label="Accept privacy policy"
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and accept the Privacy Policy
                  </span>
                </label>
              </div>

              {/* Terms of Service Section */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">📄 Terms of Service</h4>
                <p className="text-xs text-gray-600 mb-3">
                  By using NorthStar, you agree to our terms. AI features are provided as-is
                  without warranties. We reserve the right to update terms with 30-day notice.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 mb-3">
                  <li>✓ AI outputs may not be 100% accurate</li>
                  <li>✓ Service availability and uptime guarantees apply</li>
                  <li>✓ User content remains your property</li>
                  <li>✓ Prohibited uses and restrictions defined</li>
                </ul>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consents.termsAccepted}
                    onChange={() => handleConsent('termsAccepted')}
                    aria-label="Accept terms of service"
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and accept the Terms of Service
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!consents.privacyAccepted || !consents.termsAccepted}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">✅ Review Your Choices</h4>
              <div className="space-y-2 text-sm text-green-800 mb-4">
                <p>
                  <strong>AI Features:</strong> {consents.aiFeatures ? '✓ Enabled' : '✗ Disabled'}
                </p>
                <p>
                  <strong>Data Processing:</strong>{' '}
                  {consents.dataProcessing ? '✓ Enabled' : '✗ Disabled'}
                </p>
                <p>
                  <strong>Privacy Accepted:</strong>{' '}
                  {consents.privacyAccepted ? '✓ Yes' : '✗ No'}
                </p>
                <p>
                  <strong>Terms Accepted:</strong> {consents.termsAccepted ? '✓ Yes' : '✗ No'}
                </p>
              </div>
              <p className="text-xs text-gray-600">
                You can change these preferences anytime in Settings → Privacy & Consent.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={!isComplete}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Accept & Continue
              </button>
            </div>
          </>
        )}
      </div>
    </AccessibleModal>
  );
};

/**
 * Consent Banner Component (Initial prompt)
 */
export const ConsentBanner = ({ onAccept, onManage }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            🤖 We use AI to personalize your experience
          </p>
          <p className="text-xs text-gray-400">
            Learn how we protect your privacy and use AI responsibly
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onManage}
            className="px-4 py-2 text-sm border border-gray-600 rounded hover:bg-gray-800"
          >
            Customize
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 text-sm bg-blue-500 rounded hover:bg-blue-600"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Consent Hook for React components
 */
export const useAIConsent = (featureName) => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsEnabled(AIConsentManager.isFeatureEnabled(featureName));
  }, [featureName]);

  return {
    isEnabled,
    manager: AIConsentManager,
    requestConsent: () => {
      // Trigger consent modal
      window.dispatchEvent(new CustomEvent('show-consent-modal'));
    },
  };
};

export default {
  AIConsentManager,
  AIConsentModal,
  ConsentBanner,
  useAIConsent,
};
