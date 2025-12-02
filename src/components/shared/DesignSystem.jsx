/**
 * NorthStar Design System
 * Comprehensive design tokens and utilities for consistent, accessible UI
 */

export const COLORS = {
  // Primary Brand
  primary: '#D4AF37',
  primaryLight: '#F4D03F',
  primaryDark: '#B8941F',
  
  // Backgrounds
  background: '#0A1628',
  backgroundLight: '#1A1838',
  backgroundCard: 'rgba(255, 255, 255, 0.05)',
  backgroundCardHover: 'rgba(255, 255, 255, 0.1)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.2)',
  borderFocus: '#D4AF37',
  
  // Status
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.1)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.1)',
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.1)',
};

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
};

export const TYPOGRAPHY = {
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const SIZING = {
  touchTarget: {
    mobile: '56px',
    desktop: '48px',
  },
  buttonHeight: {
    sm: '40px',
    md: '48px',
    lg: '56px',
  },
  inputHeight: {
    sm: '40px',
    md: '48px',
    lg: '56px',
  },
};

export const TRANSITIONS = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
};

export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  glow: '0 0 20px rgba(212, 175, 55, 0.4)',
  glowStrong: '0 0 30px rgba(212, 175, 55, 0.6)',
};

export const BORDERS = {
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  width: {
    thin: '1px',
    normal: '2px',
    thick: '3px',
  },
};

// Button Style Utilities
export const getButtonStyles = (variant = 'primary', size = 'md') => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.base,
    borderRadius: BORDERS.radius.lg,
    transition: TRANSITIONS.normal,
    cursor: 'pointer',
    minHeight: SIZING.buttonHeight[size],
    padding: `${SPACING.sm} ${SPACING.lg}`,
    border: `${BORDERS.width.normal} solid transparent`,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };

  const variants = {
    primary: {
      background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryLight})`,
      color: COLORS.background,
      boxShadow: SHADOWS.glow,
      ':hover': {
        boxShadow: SHADOWS.glowStrong,
        transform: 'translateY(-1px)',
      },
      ':active': {
        transform: 'translateY(0)',
      },
      ':disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
    secondary: {
      background: COLORS.backgroundCard,
      color: COLORS.textPrimary,
      border: `${BORDERS.width.normal} solid ${COLORS.border}`,
      ':hover': {
        background: COLORS.backgroundCardHover,
        borderColor: COLORS.borderLight,
      },
    },
    outline: {
      background: 'transparent',
      color: COLORS.textPrimary,
      border: `${BORDERS.width.normal} solid ${COLORS.borderLight}`,
      ':hover': {
        background: COLORS.backgroundCard,
        borderColor: COLORS.primary,
      },
    },
    ghost: {
      background: 'transparent',
      color: COLORS.textSecondary,
      border: 'none',
      ':hover': {
        background: COLORS.backgroundCard,
        color: COLORS.textPrimary,
      },
    },
    danger: {
      background: COLORS.error,
      color: '#FFFFFF',
      ':hover': {
        background: '#DC2626',
      },
    },
  };

  return { ...baseStyles, ...variants[variant] };
};

// Input Style Utilities
export const getInputStyles = (hasError = false) => ({
  width: '100%',
  minHeight: SIZING.inputHeight.md,
  padding: `${SPACING.md} ${SPACING.md}`,
  fontSize: TYPOGRAPHY.fontSize.base,
  fontWeight: TYPOGRAPHY.fontWeight.normal,
  color: COLORS.textPrimary,
  background: COLORS.backgroundCard,
  border: `${BORDERS.width.normal} solid ${hasError ? COLORS.error : COLORS.border}`,
  borderRadius: BORDERS.radius.md,
  transition: TRANSITIONS.normal,
  ':focus': {
    outline: 'none',
    borderColor: hasError ? COLORS.error : COLORS.primary,
    boxShadow: `0 0 0 3px ${hasError ? COLORS.errorBg : 'rgba(212, 175, 55, 0.1)'}`,
  },
  '::placeholder': {
    color: COLORS.textTertiary,
  },
});

// Card Style Utilities
export const getCardStyles = (elevated = false) => ({
  background: COLORS.backgroundCard,
  backdropFilter: 'blur(10px)',
  border: `${BORDERS.width.thin} solid ${COLORS.border}`,
  borderRadius: BORDERS.radius.xl,
  padding: SPACING.lg,
  transition: TRANSITIONS.normal,
  ...(elevated && {
    ':hover': {
      background: COLORS.backgroundCardHover,
      transform: 'translateY(-2px)',
      boxShadow: SHADOWS.lg,
    },
  }),
});

export const ACCESSIBILITY = {
  // WCAG AA minimum contrast ratios
  minContrastRatio: {
    normal: 4.5,
    large: 3,
  },
  // Focus ring styles
  focusRing: {
    outline: `${BORDERS.width.normal} solid ${COLORS.primary}`,
    outlineOffset: '2px',
    borderRadius: BORDERS.radius.sm,
  },
  // Screen reader only class
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
};