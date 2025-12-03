/**
 * ═══════════════════════════════════════════════════════════════════════════
 * i18n Multi-Language Support
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * React-i18next integration with 5+ languages
 * Automatic language detection and persistence
 */

// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import zhTranslations from './locales/zh.json';

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations },
  zh: { translation: zhTranslations },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// src/i18n/locales/en.json
{
  "common": {
    "app_name": "NorthStar",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "next": "Next",
    "close": "Close"
  },
  "nav": {
    "dashboard": "Dashboard",
    "habits": "Habits",
    "pillars": "Pillars",
    "ai_coach": "AI Coach",
    "settings": "Settings",
    "profile": "Profile"
  },
  "dashboard": {
    "welcome": "Welcome back, {{name}}!",
    "overall_score": "Overall Score",
    "this_week": "This Week",
    "trending": "Trending",
    "top_habits": "Top Habits"
  },
  "pillars": {
    "sleep": "Sleep & Recovery",
    "diet": "Nutrition & Diet",
    "exercise": "Exercise & Fitness",
    "physical": "Physical Health",
    "mental": "Mental & Emotional Health",
    "finances": "Financial Wellness",
    "social": "Social Connections",
    "spirit": "Spirituality & Purpose"
  },
  "habits": {
    "add_habit": "Add Habit",
    "complete_habit": "Complete Habit",
    "streak": "{{count}} day streak",
    "completed_today": "Completed Today",
    "goal": "Goal: {{goal}}/week"
  },
  "meditation": {
    "guided": "Guided Meditation",
    "breathing": "Breathing Exercises",
    "ambient": "Ambient Sounds",
    "sleep": "Sleep Meditations",
    "minutes": "{{count}} minutes"
  },
  "recipes": {
    "generate": "Generate Recipe",
    "dietary": "Dietary Restrictions",
    "prep_time": "Prep Time",
    "servings": "Servings",
    "nutrition": "Nutrition Info"
  },
  "leaderboard": {
    "overall": "Overall Rankings",
    "pillar": "{{pillar}} Rankings",
    "your_rank": "Your Rank",
    "friends": "Friends",
    "challenge": "Challenge"
  },
  "errors": {
    "network_error": "Network error. Please try again.",
    "auth_error": "Authentication failed. Please log in.",
    "not_found": "Not found",
    "something_wrong": "Something went wrong"
  }
}

// React component for language switcher
import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-3 py-2 rounded font-medium transition-all ${
            i18n.language === lang.code
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          title={lang.name}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
};

// Hook for using translations
export const useAppTranslation = () => {
  const { t } = useTranslation();
  return { t };
};

export default {
  i18n,
  LanguageSwitcher,
};
