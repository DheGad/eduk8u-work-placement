import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Wrapper className */
  containerClassName?: string;
}

/**
 * Form Input with label, error, hint, and icon slots.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerClassName,
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className={clsx('input-group', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {rest.required && (
              <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>
            )}
          </label>
        )}
        <div className={clsx(leftIcon || rightIcon ? 'input-with-icon' : undefined)}>
          {leftIcon && <span className="input-icon">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={clsx('input', error && 'input-error', className)}
            style={leftIcon ? { paddingLeft: '2.5rem' } : rightIcon ? { paddingRight: '2.5rem' } : undefined}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...rest}
          />
          {rightIcon && (
            <span
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="input-error-msg" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p
            id={`${inputId}-hint`}
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}
          >
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

// =========================================
// SELECT
// =========================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

/**
 * Styled Select component with label and error support.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, options, placeholder, containerClassName, className, id, ...rest },
    ref,
  ) => {
    const selectId = id ?? `select-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className={clsx('input-group', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="input-label">
            {label}
            {rest.required && (
              <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>
            )}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx('select', error && 'input-error', className)}
          aria-invalid={!!error}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="input-error-msg" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

// =========================================
// TEXTAREA
// =========================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

/**
 * Styled Textarea with label and error.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, containerClassName, className, id, ...rest }, ref) => {
    const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className={clsx('input-group', containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="input-label">
            {label}
            {rest.required && (
              <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx('textarea', error && 'input-error', className)}
          aria-invalid={!!error}
          {...rest}
        />
        {error && (
          <p className="input-error-msg" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

// =========================================
// CHECKBOX
// =========================================

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

/**
 * Styled checkbox with label and optional description.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, description, className, id, ...rest }, ref) => {
    const checkId = id ?? `checkbox-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label
          htmlFor={checkId}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            cursor: rest.disabled ? 'not-allowed' : 'pointer',
            opacity: rest.disabled ? 0.6 : 1,
          }}
        >
          <input
            ref={ref}
            type="checkbox"
            id={checkId}
            className={className}
            style={{
              width: 16,
              height: 16,
              accentColor: 'var(--color-primary-500)',
              marginTop: 2,
              cursor: 'inherit',
              flexShrink: 0,
            }}
            {...rest}
          />
          <span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              {label}
            </span>
            {description && (
              <span
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                {description}
              </span>
            )}
          </span>
        </label>
        {error && <p className="input-error-msg">{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export default Input;
