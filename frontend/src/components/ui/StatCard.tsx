import React from 'react';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type StatVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface StatCardProps {
  /** Card icon */
  icon: React.ReactNode;
  /** Main numeric value */
  value: string | number;
  /** Descriptive label */
  label: string;
  /** Optional trend info */
  trend?: {
    value: number;
    label?: string;
    direction: 'up' | 'down' | 'flat';
    /** Whether up is good (green) or bad (red) */
    upIsGood?: boolean;
  };
  /** Color theme */
  variant?: StatVariant;
  /** Optional onClick for navigation */
  onClick?: () => void;
  className?: string;
}

/**
 * Dashboard metric card with animated value, icon, and trend indicator.
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  trend,
  variant = 'primary',
  onClick,
  className,
}) => {
  const getTrendColor = () => {
    if (!trend) return '';
    const { direction, upIsGood = true } = trend;
    if (direction === 'flat') return 'trend-flat';
    if (direction === 'up') return upIsGood ? 'trend-up' : 'trend-down';
    return upIsGood ? 'trend-down' : 'trend-up';
  };

  const TrendIcon = trend?.direction === 'up'
    ? TrendingUp
    : trend?.direction === 'down'
    ? TrendingDown
    : Minus;

  return (
    <div
      className={clsx(
        'stat-card',
        `stat-card-${variant}`,
        onClick && 'cursor-pointer',
        className,
      )}
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
      style={{ animation: 'countUp 0.4s ease' }}
    >
      <div className={clsx('stat-card-icon', `stat-card-icon-${variant}`)}>
        {icon}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {trend && (
        <div className={clsx('stat-card-trend', getTrendColor())}>
          <TrendIcon size={13} />
          <span>
            {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
