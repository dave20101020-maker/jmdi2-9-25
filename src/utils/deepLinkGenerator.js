/**
 * ═══════════════════════════════════════════════════════════════════════════
 * App Store Deep Links Generator
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Generate iOS (itms-apps) and Android (intent://) deep links
 * Track app installs and route users appropriately
 */

// App store IDs (configure with your real app IDs)
const APP_CONFIG = {
  ios: {
    appId: '6502345678', // Apple App Store ID
    appName: 'NorthStar',
    appStoreUrl: 'https://apps.apple.com/app/northstar/id6502345678',
  },
  android: {
    packageName: 'com.northstar.wellness',
    appName: 'NorthStar',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.northstar.wellness',
  },
  web: {
    baseUrl: 'https://northstar.app',
  },
};

/**
 * Generate platform-specific deep link
 * @param {string} platform - 'ios', 'android', 'web'
 * @param {string} route - Route path (e.g., '/dashboard', '/checkin')
 * @param {Object} params - Query parameters
 * @returns {string} Deep link URL
 */
export function generateDeepLink(platform, route = '/', params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const query = queryString ? `?${queryString}` : '';

  switch (platform) {
    case 'ios':
      // iOS App Store link
      return APP_CONFIG.ios.appStoreUrl;

    case 'android':
      // Android intent link - opens Play Store, falls back to web
      const intentUrl = [
        'intent://northstar.app' + route,
        `action=android.intent.action.VIEW`,
        `category=android.intent.category.BROWSABLE`,
        `data=https://northstar.app${route}${query}`,
        `package=${APP_CONFIG.android.packageName}`,
        `component=com.northstar.wellness/.MainActivity`,
      ].join(';');
      return intentUrl.includes('#Intent') ? intentUrl : intentUrl + '#Intent;end';

    case 'web':
      return `${APP_CONFIG.web.baseUrl}${route}${query}`;

    default:
      return APP_CONFIG.web.baseUrl + route + query;
  }
}

/**
 * Get appropriate link based on user agent
 * @param {string} routePath - Route path
 * @param {Object} params - Query parameters
 * @returns {string} Platform-appropriate deep link
 */
export function getPlatformDeepLink(routePath = '/', params = {}) {
  const userAgent = navigator.userAgent || '';
  
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return generateDeepLink('ios', routePath, params);
  } else if (/Android/.test(userAgent)) {
    return generateDeepLink('android', routePath, params);
  } else {
    return generateDeepLink('web', routePath, params);
  }
}

/**
 * React component for smart app link
 * Shows appropriate download/open link based on platform
 */
import React, { useEffect, useState } from 'react';

export const AppStoreLink = ({ route = '/', params = {}, children, className = '' }) => {
  const [platform, setPlatform] = useState(null);
  const [link, setLink] = useState(null);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    let detectedPlatform = 'web';
    let appLink = generateDeepLink('web', route, params);

    if (/iPad|iPhone|iPod/.test(ua)) {
      detectedPlatform = 'ios';
      appLink = generateDeepLink('ios', route, params);
    } else if (/Android/.test(ua)) {
      detectedPlatform = 'android';
      appLink = generateDeepLink('android', route, params);
    }

    setPlatform(detectedPlatform);
    setLink(appLink);
  }, [route, params]);

  if (!link) return null;

  return (
    <a href={link} className={className} target="_blank" rel="noopener noreferrer">
      {children || (
        <>
          {platform === 'ios' && 'Download on App Store'}
          {platform === 'android' && 'Get it on Google Play'}
          {platform === 'web' && 'Open NorthStar'}
        </>
      )}
    </a>
  );
};

/**
 * Track app install/open events
 * @param {string} source - Where link was clicked ('email', 'sms', 'social', etc)
 * @param {string} campaign - Campaign identifier
 */
export async function trackDeepLinkClick(source, campaign) {
  try {
    await fetch('/api/analytics/deep-link-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        campaign,
        platform: navigator.userAgent,
        timestamp: new Date(),
      }),
    });
  } catch (error) {
    console.error('Error tracking deep link:', error);
  }
}

/**
 * Generate shareable links for different contexts
 */
export const deepLinkTemplates = {
  referral: (userId) => ({
    ios: `${APP_CONFIG.ios.appStoreUrl}?ref=${userId}`,
    android: generateDeepLink('android', '/', { ref: userId }),
    web: generateDeepLink('web', '/', { ref: userId }),
  }),
  
  share: (habitId) => ({
    ios: generateDeepLink('ios', `/habit/${habitId}`),
    android: generateDeepLink('android', `/habit/${habitId}`),
    web: generateDeepLink('web', `/habit/${habitId}`),
  }),

  invite: (inviteCode) => ({
    ios: `${APP_CONFIG.ios.appStoreUrl}?invite=${inviteCode}`,
    android: generateDeepLink('android', '/', { invite: inviteCode }),
    web: generateDeepLink('web', '/', { invite: inviteCode }),
  }),

  challenge: (challengeId) => ({
    ios: generateDeepLink('ios', `/challenge/${challengeId}`),
    android: generateDeepLink('android', `/challenge/${challengeId}`),
    web: generateDeepLink('web', `/challenge/${challengeId}`),
  }),
};

/**
 * Backend endpoint to track installs
 * POST /api/analytics/app-install
 */
export async function recordAppInstall(platform, source, campaign) {
  try {
    const response = await fetch('/api/analytics/app-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        source,
        campaign,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        timestamp: new Date(),
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error recording app install:', error);
  }
}

export default {
  generateDeepLink,
  getPlatformDeepLink,
  trackDeepLinkClick,
  recordAppInstall,
  deepLinkTemplates,
  AppStoreLink,
  APP_CONFIG,
};
