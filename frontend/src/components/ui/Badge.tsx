import React from 'react';
import clsx from 'clsx';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  /** Show a colored dot indicator before text */
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  primary: 'badge-primary',
  neutral: 'badge-neutral',
};

/**
 * Maps common status strings to badge variants.
 */
export function statusToVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    active: 'success',
    completed: 'primary',
    pending: 'warning',
    approved: 'success',
    at_risk: 'danger',
    cancelled: 'neutral',
    suspended: 'danger',
    verified: 'success',
    rejected: 'danger',
    expired: 'danger',
    compliant: 'success',
    non_compliant: 'danger',
    none: 'neutral',
    low: 'info',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  };
  return map[status.toLowerCase()] ?? 'neutral';
}

/**
 * Status badge component with dot indicator support.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  dot = false,
  children,
  className,
}) => {
  return (
    <span className={clsx('badge', variantMap[variant], className)}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
};

export default Badge;
