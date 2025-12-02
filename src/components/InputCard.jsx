import React from 'react';
import { cn } from '@/lib/utils';

/**
 * InputCard - Card-style input wrapper with label, description, and error handling
 * @param {string} label - Input label
 * @param {string} description - Optional helper text
 * @param {string} error - Error message
 * @param {boolean} required - Show required indicator
 * @param {string} type - Input type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'
 * @param {string} placeholder - Input placeholder
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {string} icon - Optional icon (left side)
 * @param {string} iconRight - Optional icon (right side)
 * @param {boolean} disabled - Disable input
 * @param {array} options - Options for select type
 * @param {number} rows - Rows for textarea
 * @param {string} name - Input name
 * @param {string} id - Input id
 */
export const InputCard = ({
  label,
  description,
  error,
  required = false,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  iconRight,
  disabled = false,
  options = [],
  rows = 4,
  name,
  id,
  className,
  inputClassName,
  ...props
}) => {
  const inputId = id || name || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  const baseInputClasses = cn(
    'w-full px-4 py-2.5 text-base',
    'bg-white dark:bg-gray-800',
    'border rounded-lg',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    error
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500',
    icon && 'pl-10',
    iconRight && 'pr-10'
  );

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={cn(baseInputClasses, 'resize-y', inputClassName)}
          {...props}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(baseInputClasses, 'pr-10', inputClassName)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value || option}
              value={option.value || option}
            >
              {option.label || option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(baseInputClasses, inputClassName)}
        {...props}
      />
    );
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Description */}
      {description && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {description}
        </p>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}

        {/* Input/Textarea/Select */}
        {renderInput()}

        {/* Right Icon */}
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {iconRight}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default InputCard;
