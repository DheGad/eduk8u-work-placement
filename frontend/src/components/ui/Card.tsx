import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Optional card header content */
  header?: React.ReactNode;
  /** Optional card footer content */
  footer?: React.ReactNode;
  /** Display a skeleton loading state */
  loading?: boolean;
  /** Card visual style */
  variant?: 'default' | 'glass' | 'elevated';
  /** Remove default padding */
  noPadding?: boolean;
  onClick?: () => void;
}

/**
 * Glassmorphism-styled card component with optional header, footer, and skeleton loading.
 */
export const Card: React.FC<CardProps> = ({
  children,
  className,
  header,
  footer,
  loading = false,
  variant = 'default',
  noPadding = false,
  onClick,
}) => {
  const variantClass = {
    default: 'card',
    glass: 'card-glass',
    elevated: 'card-elevated',
  }[variant];

  if (loading) {
    return (
      <div
        className={clsx(variantClass, className)}
        style={{ minHeight: 120 }}
        aria-busy="true"
        aria-label="Loading..."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skeleton" style={{ height: 20, width: '60%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 16, width: '80%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 16, width: '45%', borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(variantClass, className, onClick && 'cursor-pointer')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      style={noPadding ? { padding: 0 } : undefined}
    >
      {header && (
        <div
          style={{
            borderBottom: '1px solid var(--surface-border)',
            paddingBottom: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
          }}
        >
          {header}
        </div>
      )}
      {children}
      {footer && (
        <div
          style={{
            borderTop: '1px solid var(--surface-border)',
            paddingTop: 'var(--space-4)',
            marginTop: 'var(--space-4)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
