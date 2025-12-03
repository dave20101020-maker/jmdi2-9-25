import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * LanguageSwitcher Component
 * 
 * Allows users to switch between available languages.
 * Currently supports: English, Spanish (placeholder)
 * 
 * TODO: Add more languages as translations are added
 * TODO: Persist language preference to localStorage (handled by i18next detector)
 */

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  // TODO: Add more languages
  // { code: 'fr', name: 'Français', flag: '🇫🇷' },
  // { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  // { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
    
    // Announce change for accessibility
    if ('announceForAccessibility' in window) {
      window.announceForAccessibility(`Language changed to ${LANGUAGES.find(l => l.code === code)?.name}`);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white hover:bg-white/10"
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline text-sm">{currentLanguage.flag}</span>
        <span className="text-xs">{currentLanguage.code.toUpperCase()}</span>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 bg-[#1a2332] border border-white/20 rounded-lg shadow-lg z-50 min-w-48"
          role="menu"
        >
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-white/10 transition-colors ${
                i18n.language === lang.code ? 'bg-[#D4AF37]/20 border-l-2 border-[#D4AF37]' : ''
              }`}
              role="menuitem"
              aria-current={i18n.language === lang.code ? 'true' : 'false'}
            >
              <span className="text-lg">{lang.flag}</span>
              <div className="flex-1">
                <div className="text-white font-medium">{lang.name}</div>
                <div className="text-white/60 text-xs">{lang.code}</div>
              </div>
              {i18n.language === lang.code && (
                <span className="text-[#D4AF37]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Close menu when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
