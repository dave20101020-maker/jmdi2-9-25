import React from 'react';
import { cn } from '@/lib/utils';

/**
 * SectionHeader - Reusable section header component
 * @param {string} title - Main heading text
 * @param {string} subtitle - Optional subtitle/description
 * @param {string} icon - Optional emoji or icon
 * @param {ReactNode} action - Optional action button/element (top-right)
 * @param {string} variant - 'default' | 'primary' | 'accent'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} divider - Show bottom border
 */
export const SectionHeader = ({
  title,
  subtitle,
  icon,
  action,
  variant = 'default',
  size = 'md',
  divider = false,
  className,
  children,
}) => {
  const sizeClasses = {
    sm: {
      title: 'text-lg font-semibold',
      subtitle: 'text-sm',
      spacing: 'mb-3',
    },
    md: {
      title: 'text-2xl font-bold',
      subtitle: 'text-base',
      spacing: 'mb-4',
    },
    lg: {
      title: 'text-3xl font-bold',
      subtitle: 'text-lg',
      spacing: 'mb-6',
    },
  };

  const variantClasses = {
    default: {
      title: 'text-gray-900 dark:text-gray-50',
      subtitle: 'text-gray-600 dark:text-gray-400',
    },
    primary: {
      title: 'text-blue-600 dark:text-blue-400',
      subtitle: 'text-blue-500 dark:text-blue-300',
    },
    accent: {
      title: 'text-purple-600 dark:text-purple-400',
      subtitle: 'text-purple-500 dark:text-purple-300',
    },
  };

  const { title: titleSize, subtitle: subtitleSize, spacing } = sizeClasses[size];
  const { title: titleColor, subtitle: subtitleColor } = variantClasses[variant];

  return (
    <div
      className={cn(
        spacing,
        divider && 'pb-4 border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Icon + Title + Subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {icon && (
              <span className={cn(
                'flex-shrink-0',
                size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'
              )}>
                {icon}
              </span>
            )}
            <h2 className={cn(titleSize, titleColor, 'truncate')}>
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className={cn(subtitleSize, subtitleColor, 'mt-1')}>
              {subtitle}
            </p>
          )}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>

        {/* Right side: Action button/element */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
